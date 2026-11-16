export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(250,204,21,0.14),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(127,29,29,0.42),_transparent_28%),linear-gradient(135deg,#2b0a0e_0%,#5b1017_48%,#120b0c_100%)] px-4 py-10">
      {children}
    </main>   
  )
}
