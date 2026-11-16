import { z } from "zod";

const username = z
    .string()
    .trim()
    .min(1, "Introduz o nome de utilizador.")
    .max(150, "O nome de utilizador não pode exceder 150 caracteres.");

export const loginSchema = z.object({
    username,
    password: z.string().min(1, "Introduz a palavra-passe."),
});

export const registerSchema = z.object({
    username,
    password: z
        .string()
        .min(8, "A palavra-passe deve ter pelo menos 8 caracteres."),
});
