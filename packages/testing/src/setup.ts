import { afterAll, beforeEach } from "vitest";
import { prisma } from "@ph360/database";
import { truncateAll } from "./db.js";

beforeEach(async () => {
  await truncateAll(prisma);
});

afterAll(async () => {
  await prisma.$disconnect();
});
