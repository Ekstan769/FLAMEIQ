import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/flameiq";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

export { prisma };