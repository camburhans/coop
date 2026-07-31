/**
 * Service-layer smoke test for the finance backend (accounts, transactions,
 * and reporting derivations).
 *
 * This exercises the SERVICE layer directly — not the HTTP routes — creating an
 * asset and a liability account, asserting net worth from balances, recording
 * signed transactions, and asserting the cash-flow / spend-by-category /
 * net-worth-series derivations. It proves the two hard finance rules:
 *
 *   1. Transactions NEVER drive Account.balance (no double-entry) — recording
 *      three transactions leaves both balances, and net worth, unchanged.
 *   2. Account deletion is GUARDED — deleting an account that still has
 *      transactions throws a ConflictError; only after its transactions are
 *      removed can the account be deleted.
 *
 * It cleans up everything it creates.
 *
 * SAFETY: this inserts and deletes rows, so it must only ever touch the DEV
 * database. It refuses to run unless DATABASE_URL points at dev (the connection
 * string must contain "5433" or "coop_dev"). Never point it at production.
 *
 *   pnpm finance:smoke
 *
 * The `--conditions=react-server` flag in that script makes the `server-only`
 * marker import (present on every service module) resolve to a no-op under
 * tsx; without it plain Node cannot import the service layer.
 */
import { Prisma } from '@prisma/client';

// Load .env FIRST so both the dev-DB guard below and the Prisma client
// (constructed when the service modules are imported) see DATABASE_URL. A bare
// `tsx` process does not auto-load .env.
try {
  process.loadEnvFile();
} catch {
  // .env is optional if DATABASE_URL is already exported in the environment.
}

// ---------------------------------------------------------------------------
// Dev-database guard — refuse to run against anything that isn't obviously dev.
// ---------------------------------------------------------------------------
const dbUrl = process.env.DATABASE_URL ?? '';
if (!(dbUrl.includes('5433') || dbUrl.includes('coop_dev'))) {
  console.error(
    'REFUSING TO RUN: DATABASE_URL does not look like the DEV database.\n' +
    'It must contain "5433" or "coop_dev". This script mutates data and must\n' +
    'never touch production.',
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Tiny assertion helpers.
// ---------------------------------------------------------------------------
let assertions = 0;
function assert(condition: boolean, message: string): void {
  assertions += 1;
  if (!condition) {
    throw new Error(`ASSERTION FAILED: ${message}`);
  }
  console.log(`  ✓ ${message}`);
}

/** Assert a Prisma.Decimal equals an expected plain number (exact). */
function assertDec(actual: Prisma.Decimal, expected: number, message: string): void {
  assert(
    actual.equals(new Prisma.Decimal(expected)),
    `${message} (expected ${expected}, got ${actual.toString()})`,
  );
}

/** A @db.Date value for the server's LOCAL today, anchored at UTC midnight so
 *  it lands squarely inside every period window (month/quarter/ytd). */
function todayDate(): Date {
  const n = new Date();
  return new Date(Date.UTC(n.getFullYear(), n.getMonth(), n.getDate()));
}

async function main(): Promise<void> {
  // Import services AFTER .env is loaded (dynamic import defers the Prisma
  // client construction, which reads DATABASE_URL, until the var is present).
  const { prisma } = await import('@/lib/db/client');
  const { ConflictError } = await import('@/lib/errors');
  const { createAccount, getAccount, deleteAccount } = await import(
    '@/lib/finance/accounts'
  );
  const { createTransaction, deleteTransaction } = await import(
    '@/lib/finance/transactions'
  );
  const {
    getNetWorth,
    getCashFlow,
    getSpendByCategory,
    getNetWorthSeries,
    getRecentTransactions,
  } = await import('@/lib/finance/reporting');

  console.log('--- finance-smoke (DEV database only) ---');
  console.log(`DATABASE_URL: ${dbUrl.replace(/:[^:@/]+@/, ':***@')}\n`);

  // Track everything created so cleanup runs even if an assertion fails.
  const accountIds: string[] = [];
  const txIds: string[] = [];

  try {
    // 1. Two accounts: an asset and a liability.
    const checking = await createAccount({
      name: 'Smoke: Everyday Checking',
      type: 'CHECKING',
      balance: 6000,
      // isLiability omitted → defaults to false (asset)
    });
    const card = await createAccount({
      name: 'Smoke: Rewards Card',
      type: 'CREDIT',
      balance: 1200,
      isLiability: true,
    });
    accountIds.push(checking.id, card.id);
    console.log(
      `1. Created 2 accounts: ${checking.name} (asset, $${checking.balance.toString()}) ` +
      `and ${card.name} (liability, $${card.balance.toString()}).\n`,
    );

    // 2. Net worth is computed from BALANCES: assets − liabilities.
    const nw0 = await getNetWorth();
    console.log(
      `2. getNetWorth(): assets=${nw0.assets}, liabilities=${nw0.liabilities}, net=${nw0.net}`,
    );
    assertDec(nw0.assets, 6000, 'net worth assets = 6000');
    assertDec(nw0.liabilities, 1200, 'net worth liabilities = 1200');
    assertDec(nw0.net, 4800, 'net worth net = 4800 (assets − liabilities)');
    console.log('');

    // 3. Signed transactions THIS MONTH on the checking account: a +payroll
    //    inflow and two outflows (negative amounts).
    const on = todayDate();
    const payroll = await createTransaction({
      accountId: checking.id,
      amount: 5000, // positive → inflow
      category: 'salary', // lower-case in → schema uppercases
      description: 'Payroll — Meridian Labs',
      occurredOn: on,
    });
    const grocery = await createTransaction({
      accountId: checking.id,
      amount: -200, // negative → outflow
      category: 'groceries',
      description: 'Market run',
      occurredOn: on,
    });
    const utility = await createTransaction({
      accountId: checking.id,
      amount: -150, // negative → outflow
      category: 'utilities',
      description: 'Power & water',
      occurredOn: on,
    });
    txIds.push(payroll.id, grocery.id, utility.id);
    console.log(
      '3. Recorded 3 signed transactions this month on checking: ' +
      '+5000 SALARY, −200 GROCERIES, −150 UTILITIES.',
    );
    assert(payroll.source === 'MANUAL', 'created transaction source is MANUAL (never CSV_IMPORT)');
    assert(payroll.category === 'SALARY', 'category was trimmed + uppercased by the schema');
    console.log('');

    // 4. Cash flow for the month is derived from the transactions.
    const cf = await getCashFlow('month');
    console.log(`4. getCashFlow('month'): income=${cf.income}, spend=${cf.spend}, net=${cf.net}`);
    assertDec(cf.income, 5000, 'cash-flow income = 5000 (sum of inflows)');
    assertDec(cf.spend, 350, 'cash-flow spend = 350 (|−200| + |−150|)');
    assertDec(cf.net, 4650, 'cash-flow net = 4650 (income − spend)');
    console.log('');

    // 5. Transactions do NOT drive balances — balances and net worth are
    //    exactly what they were before any transaction existed.
    const checkingAfter = await getAccount(checking.id);
    const cardAfter = await getAccount(card.id);
    const nw1 = await getNetWorth();
    console.log(
      `5. Balances after recording transactions: checking=$${checkingAfter?.balance.toString()}, ` +
      `card=$${cardAfter?.balance.toString()}; net worth=${nw1.net}`,
    );
    assertDec(checkingAfter?.balance as Prisma.Decimal, 6000, 'checking balance UNCHANGED (no double-entry)');
    assertDec(cardAfter?.balance as Prisma.Decimal, 1200, 'card balance UNCHANGED (no double-entry)');
    assertDec(nw1.net, 4800, 'net worth UNCHANGED at 4800 (transactions never feed net worth)');
    console.log('');

    // 6. Spend by category: outflows only, summed, sorted largest-first.
    const cats = await getSpendByCategory('month');
    console.log(
      '6. getSpendByCategory(\'month\'):',
      cats.map((c) => `${c.category}=${c.amount.toString()}`).join(', '),
    );
    assert(cats.length === 2, 'spend-by-category has 2 categories (inflow SALARY excluded)');
    const [topCat, nextCat] = cats;
    if (!topCat || !nextCat) throw new Error('spend-by-category returned fewer rows than asserted');
    assert(topCat.category === 'GROCERIES', 'largest spend category first: GROCERIES');
    assertDec(topCat.amount, 200, 'GROCERIES spend = 200');
    assert(nextCat.category === 'UTILITIES', 'next spend category: UTILITIES');
    assertDec(nextCat.amount, 150, 'UTILITIES spend = 150');
    assert(
      topCat.amount.greaterThanOrEqualTo(nextCat.amount),
      'categories are sorted descending by amount',
    );
    console.log('');

    // 6b. Net-worth series is anchored so the LAST point equals current net
    //     worth and the FIRST equals net − periodNet.
    const series = await getNetWorthSeries('month');
    console.log(
      `6b. getNetWorthSeries('month'): first=${series.first}, last=${series.last}, ` +
      `periodNet=${series.periodNet}, points=[${series.points.map((p) => p.toString()).join(', ')}]`,
    );
    assertDec(series.periodNet, 4650, 'series periodNet = 4650 (matches cash-flow net)');
    assertDec(series.last, 4800, 'series LAST point = current net worth (4800)');
    assertDec(series.first, 150, 'series FIRST point = net − periodNet (4800 − 4650)');
    const lastPoint = series.points[series.points.length - 1];
    if (!lastPoint) throw new Error('net-worth series returned no points');
    assertDec(lastPoint, 4800, 'last plotted point equals net worth');
    console.log('');

    // 6c. Recent transactions across all accounts.
    const recent = await getRecentTransactions();
    console.log(`6c. getRecentTransactions(): ${recent.length} rows, each with its account joined.`);
    assert(recent.length === 3, 'recent transactions returns the 3 recorded rows');
    assert(recent.every((t) => t.account !== null), 'each recent transaction carries its account');
    console.log('');

    // 7. Delete guard: an account WITH transactions cannot be deleted.
    let threw = false;
    try {
      await deleteAccount(checking.id);
    } catch (err) {
      threw = err instanceof ConflictError;
      console.log(`7. deleteAccount(checking) refused: ${(err as Error).name} — ${(err as Error).message}`);
    }
    assert(threw, 'deleteAccount on an account WITH transactions throws ConflictError (no cascade)');
    assert((await getAccount(checking.id)) !== null, 'the guarded account still exists');

    // A zero-transaction account (the card) deletes cleanly.
    await deleteAccount(card.id);
    assert((await getAccount(card.id)) === null, 'a zero-transaction account deletes cleanly');
    console.log('');

    // 8. Remove the transactions, THEN the account deletes.
    await deleteTransaction(payroll.id);
    await deleteTransaction(grocery.id);
    await deleteTransaction(utility.id);
    console.log('8. Deleted the 3 transactions, then re-tried the account delete:');
    await deleteAccount(checking.id);
    assert(
      (await getAccount(checking.id)) === null,
      'account deletes once it has zero transactions',
    );

    console.log(`\n--- finance-smoke OK (${assertions} assertions passed) ---`);
  } finally {
    // Best-effort cleanup so a mid-run failure never leaves rows behind. These
    // are no-ops on the happy path (everything is already deleted). Delete
    // transactions before accounts to respect the FK.
    if (txIds.length > 0) {
      await prisma.transaction.deleteMany({ where: { id: { in: txIds } } });
    }
    if (accountIds.length > 0) {
      await prisma.account.deleteMany({ where: { id: { in: accountIds } } });
    }
    await prisma.$disconnect();
  }
}

main().catch((err: unknown) => {
  console.error('\nfinance-smoke FAILED:', err);
  process.exit(1);
});
