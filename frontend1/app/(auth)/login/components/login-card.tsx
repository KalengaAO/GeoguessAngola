import { ShieldCheck } from "lucide-react"
import Link from "next/link"

import { AuthBrand } from "./auth-brand"
import { LoginForm } from "./login-form"

export function LoginCard() {
  return (
    <div className="w-full max-w-md">
      <div className="rounded-3xl border border-white/10 bg-white/95 p-8 shadow-[0_24px_60px_rgba(8,25,48,0.45)] backdrop-blur-sm sm:p-10">
        <div className="mb-8 flex items-center gap-3">
          <AuthBrand />
        </div>
        <h2 className="mt-4 text-2xl font-black tracking-[-0.06em] text-slate-900 sm:text-3xl">
          Login
        </h2>
        <LoginForm />
      </div>
    </div>
  )
}
