import { prisma } from '../src/lib/prisma';
import assert from 'assert';

async function testPrisma() {
  console.log('Testing Prisma connection and seed data...');
  const config = await prisma.studioConfig.findUnique({ where: { id: 'default' } });
  assert(config !== null, 'StudioConfig should exist');
  assert.strictEqual(config.studioName, 'Snapbook Studio', 'Studio name should match');

  const packages = await prisma.package.findMany();
  assert(packages.length >= 3, 'At least 3 packages should exist');

  const admin = await prisma.adminUser.findUnique({ where: { username: 'admin' } });
  assert(admin !== null, 'Admin user should exist');

  console.log('Prisma test passed! Found', packages.length, 'packages.');
}

testPrisma()
  .catch((e) => {
    console.error('Prisma test failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
