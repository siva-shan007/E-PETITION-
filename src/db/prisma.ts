// Active Prisma client instance
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

let prisma: PrismaClient;

const connectionString = process.env.DATABASE_URL;

if (process.env.NODE_ENV === 'production') {
  if (!connectionString) {
    throw new Error('DATABASE_URL is required in production.');
  }
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  prisma = new PrismaClient({ adapter });
} else {
  if (!connectionString) {
    console.warn('⚠️ Warning: DATABASE_URL is not configured in local environment.');
    // Return standard client as fallback, queries will fail but allows import/setup to load
    prisma = globalForPrisma.prisma || new PrismaClient();
  } else {
    if (!globalForPrisma.pool) {
      globalForPrisma.pool = new Pool({ connectionString });
    }
    if (!globalForPrisma.prisma) {
      const adapter = new PrismaPg(globalForPrisma.pool);
      globalForPrisma.prisma = new PrismaClient({
        adapter,
        log: ['query', 'info', 'warn', 'error'],
      });
    }
    prisma = globalForPrisma.prisma;
  }
}

export { prisma };
