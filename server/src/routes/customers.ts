import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { requireAuth, requireRole, type AuthRequest } from '../middleware/auth';
import { logAction } from '../services/audit';
import { accountFlagKey, guestFlagKey } from '../services/customerFlags';
import { normalizeEmail, normalizePhone } from '../utils/phone';

export const customersRouter = Router();

type OrderRow = {
  id: string;
  userId: string | null;
  customer: string;
  phone: string;
  email: string | null;
  total: number;
  status: string;
  createdAt: Date;
  wilaya: string;
  municipality: string;
  items: { name: string; quantity: number; price: number }[];
};

/**
 * Owner-facing customer directory. It exposes everything the store knows about
 * a customer account, but never authentication material: password hashes,
 * refresh/reset/verification tokens and 2FA secrets stay server-side.
 */
customersRouter.get('/', requireAuth, requireRole('SUPER_ADMIN', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const search = String(req.query.search || '').trim();
    const take = Math.min(500, Math.max(1, Number(req.query.limit) || 500));

    const [accounts, orders, flags] = await Promise.all([
      prisma.user.findMany({
        where: {
          role: 'CUSTOMER',
          ...(search
            ? {
                OR: [
                  { name: { contains: search, mode: 'insensitive' as const } },
                  { email: { contains: search, mode: 'insensitive' as const } },
                  { phone: { contains: search } },
                ],
              }
            : {}),
        },
        orderBy: { createdAt: 'desc' },
        take,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          avatar: true,
          emailVerified: true,
          isActive: true,
          twoFactorEnabled: true,
          lastActivityAt: true,
          lockedUntil: true,
          failedLoginAttempts: true,
          createdAt: true,
          updatedAt: true,
          addresses: {
            orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
          },
        },
      }),
      prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        take: 1000,
        select: {
          id: true,
          userId: true,
          customer: true,
          phone: true,
          email: true,
          total: true,
          status: true,
          createdAt: true,
          wilaya: true,
          municipality: true,
          items: { select: { name: true, quantity: true, price: true } },
        },
      }),
      prisma.customerFlag.findMany({
        orderBy: { updatedAt: 'desc' },
        select: {
          key: true,
          userId: true,
          phone: true,
          email: true,
          name: true,
          blocked: true,
          reason: true,
          note: true,
          updatedAt: true,
        },
      }),
    ]);

    // Orders are attached to an account by id when the customer was signed in,
    // and by email/phone for orders placed as a guest with the same details.
    const byUserId = new Map<string, OrderRow[]>();
    const byEmail = new Map<string, OrderRow[]>();
    const byPhone = new Map<string, OrderRow[]>();
    const push = (map: Map<string, OrderRow[]>, key: string, order: OrderRow) => {
      const list = map.get(key);
      if (list) list.push(order);
      else map.set(key, [order]);
    };
    for (const order of orders as OrderRow[]) {
      const phone = normalizePhone(order.phone);
      const email = normalizeEmail(order.email);
      if (order.userId) push(byUserId, order.userId, order);
      if (email) push(byEmail, email, order);
      if (phone) push(byPhone, phone, order);
    }

    const flagByUser = new Map(flags.filter((flag) => flag.userId).map((flag) => [flag.userId as string, flag]));

    const customers = accounts.map((account) => {
      const seen = new Set<string>();
      const matched: OrderRow[] = [];
      const addAll = (list?: OrderRow[]) => {
        if (!list) return;
        for (const order of list) {
          if (seen.has(order.id)) continue;
          seen.add(order.id);
          matched.push(order);
        }
      };
      addAll(byUserId.get(account.id));
      addAll(byEmail.get(normalizeEmail(account.email)));
      const phone = normalizePhone(account.phone);
      if (phone) addAll(byPhone.get(phone));

      matched.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      const active = matched.filter((order) => order.status !== 'cancelled');
      const delivered = matched.filter((order) => order.status === 'completed');
      const flag = flagByUser.get(account.id);

      return {
        ...account,
        twoFactorEnabled: Boolean(account.twoFactorEnabled),
        isLocked: Boolean(account.lockedUntil && account.lockedUntil.getTime() > Date.now()),
        blocked: !account.isActive || Boolean(flag?.blocked),
        blockReason: flag?.reason ?? null,
        note: flag?.note ?? null,
        flagKey: flag?.key ?? accountFlagKey(account.id),
        ordersCount: matched.length,
        cancelledCount: matched.length - active.length,
        completedCount: delivered.length,
        totalSpent: active.reduce((sum, order) => sum + Number(order.total || 0), 0),
        lastOrderAt: matched[0]?.createdAt ?? null,
        orderIds: matched.map((order) => order.id),
        orders: matched.slice(0, 30),
      };
    });

    res.json({
      customers,
      flags,
      totals: {
        accounts: customers.length,
        matchedOrders: customers.reduce((sum, customer) => sum + customer.ordersCount, 0),
        blocked: customers.filter((customer) => customer.blocked).length + flags.filter((flag) => !flag.userId && flag.blocked).length,
      },
    });
  } catch (err) {
    console.error('[Customers] Fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

const flagSchema = z
  .object({
    accountId: z.string().min(1).max(64).optional(),
    phone: z.string().max(40).optional(),
    email: z.string().max(200).optional(),
    name: z.string().max(200).optional(),
    blocked: z.boolean().optional(),
    reason: z.string().max(500).nullable().optional(),
    note: z.string().max(2000).nullable().optional(),
  })
  .refine((data) => Boolean(data.accountId) || Boolean(normalizePhone(data.phone)), {
    message: 'accountId or a valid phone is required',
  });

/**
 * Creates or updates the owner's flag for one customer identity. Blocking an
 * account also deactivates it server-side, so login, refresh and every
 * authenticated route reject it immediately; blocking a guest is enforced when
 * an order is created with the same phone or email.
 */
customersRouter.patch('/flag', requireAuth, requireRole('SUPER_ADMIN', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  const parsed = flagSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid customer flag payload' });
  }
  const body = parsed.data;

  try {
    const account = body.accountId
      ? await prisma.user.findFirst({
          where: { id: body.accountId, role: 'CUSTOMER' },
          select: { id: true, name: true, email: true, phone: true, isActive: true },
        })
      : null;
    if (body.accountId && !account) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const phone = account ? normalizePhone(account.phone) : normalizePhone(body.phone);
    const email = account ? normalizeEmail(account.email) : normalizeEmail(body.email);
    if (!account && !phone) {
      return res.status(400).json({ error: 'A valid phone number is required' });
    }

    const key = account ? accountFlagKey(account.id) : guestFlagKey(phone);
    const existing = await prisma.customerFlag.findUnique({ where: { key } });
    const blocked = body.blocked ?? existing?.blocked ?? false;
    const normalizeText = (value: string | null | undefined) => {
      if (value === undefined) return undefined;
      const trimmed = String(value ?? '').trim();
      return trimmed ? trimmed : null;
    };
    const reason = normalizeText(body.reason);
    const note = normalizeText(body.note);

    const values = {
      userId: account?.id ?? null,
      phone: phone || null,
      email: email || null,
      name: account?.name ?? body.name?.trim() ?? null,
      blocked,
      reason: reason === undefined ? existing?.reason ?? null : reason,
      note: note === undefined ? existing?.note ?? null : note,
    };

    const flag = await prisma.customerFlag.upsert({
      where: { key },
      create: { key, ...values },
      update: values,
    });

    // The account block must survive every token path: requireAuth, login and
    // refresh all consult isActive. Bumping tokenVersion also revokes access
    // tokens that were issued before the block.
    if (account) {
      if (blocked && account.isActive) {
        await prisma.user.update({
          where: { id: account.id },
          data: { isActive: false, refreshToken: null, tokenVersion: { increment: 1 } },
        });
      } else if (!blocked && !account.isActive) {
        await prisma.user.update({ where: { id: account.id }, data: { isActive: true } });
      }
    }

    await logAction(req.userId!, 'CUSTOMER_FLAG_UPDATED', 'CustomerFlag', {
      key,
      blocked,
      hasNote: Boolean(note),
    });

    res.json({ flag });
  } catch (err) {
    console.error('[Customers] Flag update error:', err);
    res.status(500).json({ error: 'Failed to update customer flag' });
  }
});
