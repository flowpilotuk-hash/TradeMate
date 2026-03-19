const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const globalForPrisma = globalThis;

function createPrismaClient() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  });

  return new PrismaClient({
    adapter,
    log: ["error", "warn"],
  });
}

const prisma =
  globalForPrisma.__tradematePrisma ||
  createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__tradematePrisma = prisma;
}

module.exports = {
  prisma,
};