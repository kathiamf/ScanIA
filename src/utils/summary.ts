import { categoryInfo } from '@/constants/categories';
import type { Receipt } from '@/types';
import { monthRange } from '@/utils/date';
import type { YearMonth } from '@/utils/date';

export interface CategorySummary {
  category: string;
  color: string;
  icon: string;
  total: number;
  count: number;
  percent: number;
}

export interface ReceiptSummary {
  total: number;
  count: number;
  average: number;
  byCategory: CategorySummary[];
}

export function receiptDate(receipt: Receipt): string {
  return receipt.purchase_date ?? receipt.created_at.slice(0, 10);
}

export function filterByMonth(receipts: Receipt[], month: YearMonth): Receipt[] {
  const { start, endExclusive } = monthRange(month);
  return receipts.filter((receipt) => {
    const date = receiptDate(receipt);
    return date >= start && date < endExclusive;
  });
}

export function summarizeReceipts(receipts: Receipt[]): ReceiptSummary {
  const totals = new Map<string, { cents: number; count: number }>();
  let allCents = 0;
  let count = 0;

  for (const receipt of receipts) {
    if (receipt.status !== 'done' || receipt.total === null) continue;
    const cents = Math.round(receipt.total * 100);
    const category = categoryInfo(receipt.category).name;
    const current = totals.get(category) ?? { cents: 0, count: 0 };
    current.cents += cents;
    current.count += 1;
    totals.set(category, current);
    allCents += cents;
    count += 1;
  }

  const byCategory = Array.from(totals, ([category, value]) => {
    const info = categoryInfo(category);
    return {
      category,
      color: info.color,
      icon: info.icon,
      total: value.cents / 100,
      count: value.count,
      percent: allCents > 0 ? (value.cents / allCents) * 100 : 0,
    };
  }).sort((a, b) => b.total - a.total);

  return {
    total: allCents / 100,
    count,
    average: count > 0 ? Math.round(allCents / count) / 100 : 0,
    byCategory,
  };
}
