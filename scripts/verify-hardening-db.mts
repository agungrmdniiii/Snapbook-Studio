import { PrismaClient } from '@prisma/client';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
const db = new PrismaClient();
try {
  const security = await db.$queryRaw<{protected: bigint; exposed: bigint}[]>`
    SELECT count(*) FILTER (WHERE c.relrowsecurity) AS protected,
      count(*) FILTER (WHERE has_table_privilege('anon',c.oid,'SELECT,INSERT,UPDATE,DELETE')) AS exposed
    FROM pg_class c JOIN pg_namespace n ON c.relnamespace=n.oid
    WHERE n.nspname='public' AND c.relkind='r'
  `;
  assert.equal(Number(security[0].protected), 8);
  assert.equal(Number(security[0].exposed), 0);
  const key = `regression-${randomUUID()}`;
  const rollback = new Error('ROLLBACK_EXPECTED');
  await assert.rejects(db.$transaction(async tx => {
    for(let expected=1; expected<=2; expected++) {
      const rows=await tx.$queryRaw<{count:number}[]>`
        INSERT INTO "RequestLimit" ("key","count","resetAt") VALUES (${key},1,CURRENT_TIMESTAMP + ${60} * INTERVAL '1 second')
        ON CONFLICT ("key") DO UPDATE SET "count"=LEAST("RequestLimit"."count"+1,${3}) RETURNING "count"
      `;
      assert.equal(rows[0].count,expected);
    }
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${'regression-lock'}, 0))`;
    throw rollback;
  }), rollback);
  assert.equal(await db.requestLimit.count({where:{key}}),0);
  console.log('PASS: 8 protected tables, no anon grants, atomic limiter increments, advisory lock, rollback leaves no test row.');
} finally { await db.$disconnect(); }
