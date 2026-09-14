import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

// Explicitly load server/.env
dotenv.config({ path: path.resolve(__dirname, '../../.env'), override: true });

const prisma = new PrismaClient();

async function main() {
  console.log('🔒 Running ISOLATED Admin Password Rotation Script...');

  const adminPass = process.env.ADMIN_PASSWORD;

  if (!adminPass) {
    throw new Error('❌ FATAL: ADMIN_PASSWORD environment variable is missing from server/.env');
  }

  if (adminPass.trim().length === 0) {
    throw new Error('❌ FATAL: ADMIN_PASSWORD in server/.env is empty.');
  }

  // Generate fresh 10-round bcrypt salt & hash
  const passwordHash = await bcrypt.hash(adminPass, 10);

  // STRICT ISOLATION: Update ONLY the Admin table. Touch NO other tables.
  const admin = await prisma.admin.upsert({
    where: { email: 'admin@yazhisai.com' },
    update: {
      password: passwordHash,
    },
    create: {
      email: 'admin@yazhisai.com',
      password: passwordHash,
    },
  });

  console.log('✅ Admin password rotated successfully in PostgreSQL database!');
  console.log(`✅ Admin Account ID: ${admin.id}`);
  console.log(`✅ Updated Email: ${admin.email}`);
  console.log(`✅ Hash Format Verified: ${admin.password.substring(0, 10)}... (Length: ${admin.password.length})`);
}

main()
  .catch((e) => {
    console.error('❌ Rotation Script Error:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
