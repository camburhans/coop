import { Standby } from '@/components/shell/standby';

/**
 * /finance — the Finance module surface (stewardship).
 *
 * Standby until Sprint 3 wires real accounts, net worth and cash flow. The
 * dashboard already carries a first-class Finance placeholder; this is the
 * dedicated module route.
 */
export default function FinancePage() {
  return <Standby name="Finance" sub="Net worth, cash flow & stewardship." />;
}
