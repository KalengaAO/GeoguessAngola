"use client"

import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, User } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { useAppForm } from "@/hooks"
import { type SignInFormData, signInSchema } from "@/schemas"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { useMutation } from "@tanstack/react-query"
import { loginService } from "@/services/auth"

export function LoginForm() {
  //
  const router  = useRouter()
  const {setSession} = useAuth()
  const loginMutation = useMutation({mutationFn: loginService})
  //
  const [showPassword, setShowPassword] = useState(false)
  const { form, handleSubmit, fieldError, isSubmitting } =
    useAppForm<SignInFormData>({
      schema: signInSchema,
      defaultValues: { username: "", password: ""},
      onSubmit: async ({username, password}) => {
        const result = await loginMutation.mutateAsync({username,password})
        const {access, refresh} = result
        setSession({token: access, refresh: refresh, user: null} )
        router.replace("/")
      },
      successMessage:
        "Credenciais recebidas. A autenticação está pronta para ser ligada ao servidor.",
    })

  const userError = fieldError("username")
  const passwordError = fieldError("password")

  return (
    <form method="post" onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
      <label className="block text-sm font-medium text-slate-700">
        username
        <div className="relative mt-2">
          <User className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            {...form.register("username")}
            required
            autoComplete="username"
            aria-describedby={userError ? "email-error" : undefined}
            aria-invalid={Boolean(userError)}
            placeholder="akalenga"
            type="text"
            className="h-12 rounded-xl border-stone-200 bg-white pl-10 text-sm text-slate-800 placeholder:text-slate-400 focus-visible:ring-amber-500"
          />
        </div>
        {userError && (
          <p
            id="email-error"
            className="mt-1 text-xs text-red-600"
            role="alert"
          >
            {userError}
          </p>
        )}
      </label>

      <label className="block text-sm font-medium text-slate-700">
        Palavra-passe
        <div className="relative mt-2">
          <LockKeyhole className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            {...form.register("password")}
            required
            autoComplete="current-password"
            aria-describedby={passwordError ? "password-error" : undefined}
            aria-invalid={Boolean(passwordError)}
            placeholder="Introduza a sua palavra-passe"
            type={showPassword ? "text" : "password"}
            className="h-12 rounded-xl border-stone-200 bg-white pr-11 pl-10 text-sm text-slate-800 placeholder:text-slate-400 focus-visible:ring-amber-500"
          />
          <button
            type="button"
            aria-label={
              showPassword ? "Ocultar palavra-passe" : "Mostrar palavra-passe"
            }
            className="absolute top-1/2 right-3 -translate-y-1/2 rounded-md p-1 text-slate-400 transition hover:text-slate-600"
            onClick={() => setShowPassword((value) => !value)}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {passwordError && (
          <p
            id="password-error"
            className="mt-1 text-xs text-red-600"
            role="alert"
          >
            {passwordError}
          </p>
        )}
      </label>

      <div className="flex items-center justify-between gap-3 text-xs text-slate-500">

        <Link
          href="/repor-palavra-passe"
          className="font-medium text-red-800 transition hover:text-red-950"
        >
          Esqueceu a palavra-passe?
        </Link>
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="h-12 w-full rounded-xl bg-red-800 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(127,29,29,0.24)] hover:bg-red-950"
      >
        {isSubmitting && (
          <>
            <Spinner className="mr-2" />A carregar...
          </>
        )}
        {!isSubmitting && (
          <>
            Entrar <ArrowRight className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>
    </form>
  )
}
