import type { Receipt } from '@/types';
import { filterByMonth, receiptDate, summarizeReceipts } from '@/utils/summary';

function makeReceipt(partial: Partial<Receipt> & Pick<Receipt, 'id'>): Receipt {
  const { id, ...overrides } = partial;
  return {
    id,
    user_id: 'user',
    image_path: 'image.jpg',
    status: 'done',
    merchant: 'Loja',
    purchase_date: '2026-09-10',
    total: 10,
    category: 'Alimentação',
    payment_method: null,
    error_message: null,
    created_at: '2026-09-12T15:00:00Z',
    ...overrides,
  };
}

describe('summarizeReceipts', () => {
  const receipts = [
    makeReceipt({ id: '1', total: 0.1 }),
    makeReceipt({ id: '2', total: 0.2 }),
    makeReceipt({ id: '3', total: 99.7, category: 'Transporte' }),
    makeReceipt({ id: '4', status: 'pending', total: null }),
    makeReceipt({ id: '5', status: 'error', total: null }),
  ];

  it('soma apenas notas lidas usando centavos inteiros', () => {
    const summary = summarizeReceipts(receipts);
    expect(summary.total).toBe(100);
    expect(summary.count).toBe(3);
    expect(summary.average).toBe(33.33);
  });

  it('agrupa por categoria da maior para a menor', () => {
    const summary = summarizeReceipts(receipts);
    expect(summary.byCategory.map((category) => category.category)).toEqual([
      'Transporte',
      'Alimentação',
    ]);
    expect(summary.byCategory[0].percent).toBeCloseTo(99.7, 1);
    expect(summary.byCategory[1].count).toBe(2);
  });

  it('mapeia categorias desconhecidas para Outros', () => {
    const summary = summarizeReceipts([makeReceipt({ id: '9', category: 'Viagens' })]);
    expect(summary.byCategory[0].category).toBe('Outros');
  });

  it('retorna valores zerados para uma lista vazia', () => {
    expect(summarizeReceipts([])).toEqual({
      total: 0,
      count: 0,
      average: 0,
      byCategory: [],
    });
  });

  it('usa data de compra ou envio e filtra pelo mês selecionado', () => {
    expect(receiptDate(makeReceipt({ id: '1' }))).toBe('2026-09-10');
    expect(receiptDate(makeReceipt({ id: '2', purchase_date: null }))).toBe('2026-09-12');
    const monthReceipts = [
      makeReceipt({ id: 'a', purchase_date: '2026-08-31' }),
      makeReceipt({ id: 'b', purchase_date: '2026-09-01' }),
      makeReceipt({ id: 'c', purchase_date: '2026-09-30' }),
      makeReceipt({ id: 'd', purchase_date: '2026-10-01' }),
    ];
    expect(
      filterByMonth(monthReceipts, { year: 2026, month: 9 }).map((item) => item.id),
    ).toEqual(['b', 'c']);
  });
});
