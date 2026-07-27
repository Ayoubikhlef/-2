"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = require("./utils/prisma");
async function seed() {
    console.log('[Seed] Starting...');
    const seedPassword = process.env.SEED_ADMIN_PASSWORD;
    if (!seedPassword) {
        console.error('[Seed] SEED_ADMIN_PASSWORD env var required');
        process.exit(1);
    }
    const adminPassword = await bcryptjs_1.default.hash(seedPassword, 12);
    const admin = await prisma_1.prisma.user.upsert({
        where: { email: process.env.SEED_ADMIN_EMAIL || 'admin@aos.dz' },
        update: {},
        create: {
            email: process.env.SEED_ADMIN_EMAIL || 'admin@aos.dz',
            passwordHash: adminPassword,
            name: 'Admin AOS',
            role: 'SUPER_ADMIN',
            phone: process.env.SEED_ADMIN_PHONE || '',
        },
    });
    console.log(`[Seed] Admin created: ${admin.email.slice(0, 3)}***@***`);
    await prisma_1.prisma.setting.upsert({
        where: { key: 'site_name' },
        update: {},
        create: { key: 'site_name', value: 'Ayoub Office Services' },
    });
    console.log('[Seed] Default settings created');
    console.log('[Seed] Done!');
}
seed()
    .catch((e) => {
    console.error('[Seed] Error:', e);
    process.exit(1);
})
    .finally(() => prisma_1.prisma.$disconnect());
//# sourceMappingURL=seed.js.map