import { z } from "zod"

export const signInSchema = z.object({
  // email: z
  //   .string()
  //   .trim()
  //   .min(1, "Introduza o seu e-mail.")
  //   .email("Introduza um e-mail válido."),
  username: z.string().min(5, "Introduza o seu nome de utilizador."),
  password: z.string("Introduza a sua palavra-passe.").min(8, "A sua palavra-passe deve ter pelo menos 8 caracteres."),
  // remember: z.boolean().optional(),
})

export const signUpSchema = z.object({
  // email: z
  //   .string()
  //   .trim()
  //   .min(1, "Introduza o seu e-mail.")
  //   .email("Introduza um e-mail válido."),
  username: z.string().min(5, "Introduza o seu nome de utilizador."),
  password: z.string("Introduza a sua palavra-passe.").min(8, "A sua palavra-passe deve ter pelo menos 8 caracteres."),
  // remember: z.boolean().optional(),
})

export type SignInFormData = z.infer<typeof signInSchema>
export type SignUpFormData = z.infer<typeof signUpSchema>
