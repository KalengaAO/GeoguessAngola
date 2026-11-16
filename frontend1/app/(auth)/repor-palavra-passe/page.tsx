export default function ResetPasswordPage() {
  return (
    <section className="bg-background w-full max-w-md space-y-6 rounded-xl border p-8 shadow-sm">
      <h1 className="text-2xl font-semibold">Definir nova palavra-passe</h1>
      <form className="space-y-4">
        <input
          className="bg-background w-full rounded-md border px-3 py-2"
          type="password"
          placeholder="Nova palavra-passe"
        />
        <input
          className="bg-background w-full rounded-md border px-3 py-2"
          type="password"
          placeholder="Confirmar palavra-passe"
        />
        <button
          className="bg-primary text-primary-foreground w-full rounded-md px-4 py-2"
          type="submit"
        >
          Guardar palavra-passe
        </button>
      </form>
    </section>
  )
}
