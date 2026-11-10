export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(147,197,253,0.22),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.16),_transparent_25%),linear-gradient(135deg,#102a43_0%,#163d61_52%,#2b5f9b_100%)] px-4 py-10">
      {children}
    </main>
  )
}
