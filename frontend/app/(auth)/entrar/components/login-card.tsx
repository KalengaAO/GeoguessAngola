import { ShieldCheck } from "lucide-react"
import Link from "next/link"

import { AuthBrand } from "./auth-brand"
import { AuthFooter } from "./auth-footer"
import { LoginForm } from "./login-form"

export function LoginCard() {
  return (
    <div className="w-full max-w-md">
      <div className="rounded-3xl border border-white/10 bg-white/95 p-8 shadow-[0_24px_60px_rgba(8,25,48,0.45)] backdrop-blur-sm sm:p-10">
        <div className="mb-8 flex items-center gap-3">
          <AuthBrand />
        </div>

        <span className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[11px] font-semibold tracking-[0.08em] text-sky-700 uppercase">
          <ShieldCheck className="h-4 w-4" />
          Plataforma segura
        </span>

        <h2 className="mt-4 text-2xl font-black tracking-[-0.06em] text-slate-900 sm:text-3xl">
          Entrar na sua conta
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Use as suas credenciais para aceder ao painel.
        </p>

        <LoginForm />

        <p className="mt-6 text-center text-sm text-slate-500">
          Precisa de ajuda?{" "}
          <Link
            href="/"
            className="font-medium text-sky-600 hover:text-sky-700"
          >
            Fale com o administrador
          </Link>
        </p>
      </div>

      <AuthFooter />
    </div>
  )
}
