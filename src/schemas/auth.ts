import { z } from 'zod';

const email = z.string().trim().min(1, 'Informe o e-mail').email('E-mail inválido');

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Informe a senha'),
});

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Informe seu nome'),
    email,
    password: z.string().min(6, 'Use pelo menos 6 caracteres'),
    confirm: z.string().min(1, 'Confirme sua senha'),
  })
  .refine((value) => value.password === value.confirm, {
    path: ['confirm'],
    message: 'As senhas não coincidem',
  });

export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;
