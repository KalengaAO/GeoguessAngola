import { z } from "zod"

export const signInSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Introduza o seu e-mail.")
    .email("Introduza um e-mail válido."),
  password: z.string().min(1, "Introduza a sua palavra-passe."),
  remember: z.boolean().optional(),
})

export type SignInFormData = z.infer<typeof signInSchema>
