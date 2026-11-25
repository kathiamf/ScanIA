export const CATEGORY_NAMES = [
  'Alimentação',
  'Transporte',
  'Moradia',
  'Saúde',
  'Lazer',
  'Educação',
  'Compras',
  'Contas',
  'Outros',
] as const;

export type CategoryName = (typeof CATEGORY_NAMES)[number];

export interface ExtractedItem {
  description: string;
  quantity: number;
  unit_price: number | null;
  total_price: number;
}

export interface ExtractedReceipt {
  merchant: string;
  purchase_date: string | null;
  total: number;
  category: CategoryName;
  payment_method: string | null;
  items: ExtractedItem[];
}

export class ReceiptReadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ReceiptReadError';
  }
}

const round2 = (value: number) => Math.round(value * 100) / 100;

function toNumber(value: unknown): number | null {
  const parsed = typeof value === 'string' ? Number(value.replace(',', '.')) : value;
  return typeof parsed === 'number' && Number.isFinite(parsed) && parsed >= 0
    ? parsed
    : null;
}

function toText(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function toDate(value: unknown): string | null {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const valid =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;
  return valid ? value : null;
}

function normalizeItem(raw: unknown): ExtractedItem | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const item = raw as Record<string, unknown>;
  const description = toText(item.description, 120);
  if (!description) return null;

  const parsedQuantity = toNumber(item.quantity);
  const quantity = parsedQuantity !== null && parsedQuantity > 0 ? parsedQuantity : 1;
  const unitPrice = toNumber(item.unit_price);
  let totalPrice = toNumber(item.total_price);
  if (totalPrice === null && unitPrice !== null) totalPrice = unitPrice * quantity;
  if (totalPrice === null) return null;

  return {
    description,
    quantity,
    unit_price: unitPrice === null ? null : round2(unitPrice),
    total_price: round2(totalPrice),
  };
}

export function normalizeReceipt(raw: unknown): ExtractedReceipt {
  if (typeof raw !== 'object' || raw === null) {
    throw new ReceiptReadError('A resposta da IA veio em formato inválido.');
  }
  const input = raw as Record<string, unknown>;
  if (input.is_receipt === false) {
    throw new ReceiptReadError('A imagem não parece ser uma nota fiscal ou recibo.');
  }

  const items = (Array.isArray(input.items) ? input.items : [])
    .slice(0, 100)
    .map(normalizeItem)
    .filter((item): item is ExtractedItem => item !== null);
  let total = toNumber(input.total);
  if (total === null && items.length > 0) {
    total =
      items.reduce((sum, item) => sum + Math.round(item.total_price * 100), 0) / 100;
  }
  if (total === null || total <= 0) {
    throw new ReceiptReadError('Não foi possível ler o valor total da nota.');
  }

  return {
    merchant: toText(input.merchant, 80) || 'Estabelecimento não identificado',
    purchase_date: toDate(input.purchase_date),
    total: round2(total),
    category: CATEGORY_NAMES.find((category) => category === input.category) ?? 'Outros',
    payment_method: toText(input.payment_method, 40) || null,
    items,
  };
}

export function toBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(binary);
}

export const MOCK_RECEIPT: ExtractedReceipt = {
  merchant: 'Supermercado Exemplo',
  purchase_date: '2026-09-18',
  total: 87.4,
  category: 'Alimentação',
  payment_method: 'Cartão de débito',
  items: [
    { description: 'Arroz 5 kg', quantity: 1, unit_price: 29.9, total_price: 29.9 },
    { description: 'Feijão preto 1 kg', quantity: 2, unit_price: 8.5, total_price: 17 },
    {
      description: 'Leite integral 1 L',
      quantity: 6,
      unit_price: 5.25,
      total_price: 31.5,
    },
    { description: 'Sabão em pó', quantity: 1, unit_price: 9, total_price: 9 },
  ],
};
