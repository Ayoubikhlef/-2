import { Router, Response } from 'express';
import { prisma } from '../utils/prisma';
import { requireAuth, requireRole, type AuthRequest } from '../middleware/auth';

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

    const [accounts, orders] = await Promise.all([
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
      if (order.userId) push(byUserId, order.userId, order);
      if (order.email) push(byEmail, order.email.trim().toLowerCase(), order);
      if (order.phone) push(byPhone, order.phone.trim(), order);
    }

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
      addAll(byEmail.get(account.email.trim().toLowerCase()));
      if (account.phone) addAll(byPhone.get(account.phone.trim()));

      matched.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      const active = matched.filter((order) => order.status !== 'cancelled');
      const delivered = matched.filter((order) => order.status === 'completed');

      return {
        ...account,
        twoFactorEnabled: Boolean(account.twoFactorEnabled),
        isLocked: Boolean(account.lockedUntil && account.lockedUntil.getTime() > Date.now()),
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
      totals: {
        accounts: customers.length,
        matchedOrders: customers.reduce((sum, customer) => sum + customer.ordersCount, 0),
      },
    });
  } catch (err) {
    console.error('[Customers] Fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});
