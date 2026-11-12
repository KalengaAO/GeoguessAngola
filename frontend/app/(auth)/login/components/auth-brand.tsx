import Link from "next/link"

export function AuthBrand() {
  return (
    <Link href="/" className="flex items-center gap-3 text-slate-900">
      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-100 text-xl font-black text-red-900 shadow-sm ring-1 ring-amber-300">
        O
      </span>
      <span>
        <span className="block text-lg font-extrabold tracking-[-0.06em]">
          Geo <span className="text-red-800">Angola</span>
        </span>
        <span className="block text-[10px] tracking-[0.18em] text-slate-400 uppercase">
          Baseado no jogo geoguessr
        </span>
      </span>
    </Link>
  )
}
