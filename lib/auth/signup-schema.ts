import { z } from "zod";

const EMAIL_MAX = 254;
const NAME_MAX = 120;
const PASSWORD_MIN = 8;
const PASSWORD_MAX = 200;

export const NameSchema = z
  .string()
  .trim()
  .min(1, "Informe seu nome.")
  .max(NAME_MAX, "Nome muito longo.");

export const SignupSchema = z.object({
  name: NameSchema.optional(),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(EMAIL_MAX, "E-mail muito longo.")
    .email("E-mail inválido."),
  password: z
    .string()
    .min(PASSWORD_MIN, "A senha precisa de pelo menos 8 caracteres.")
    .max(PASSWORD_MAX, "Senha muito longa.")
    .regex(/[A-Za-z]/, "Inclua pelo menos uma letra na senha.")
    .regex(/\d/, "Inclua pelo menos um número na senha."),
});

export type SignupInput = z.infer<typeof SignupSchema>;

export const LoginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(EMAIL_MAX),
  password: z.string().min(1).max(PASSWORD_MAX),
});

export type LoginInput = z.infer<typeof LoginSchema>;

/** Campos que o próprio usuário pode editar em /conta. */
export const AccountUpdateSchema = z.object({
  name: NameSchema,
});

export type AccountUpdateInput = z.infer<typeof AccountUpdateSchema>;
