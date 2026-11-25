import { z } from 'zod';
import { CATEGORY_NAMES } from '@/constants/categories';
import { brToISO } from '@/utils/date';
import { parseMoney } from '@/utils/money';

export const receiptSchema = z.object({
  merchant: z.string().trim().min(1, 'Informe o estabelecimento').max(80),
  date: z.string().refine((value) => !value || brToISO(value) !== null, 'Data inválida'),
  total: z
    .string()
    .refine(
      (value) => Number.isFinite(parseMoney(value)) && parseMoney(value) > 0,
      'Informe um valor válido',
    ),
  category: z.enum(CATEGORY_NAMES),
});

export type ReceiptFormData = z.infer<typeof receiptSchema>;
