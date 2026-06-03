export default function AuthLayout({ title, children }) {
  return <main className="mx-auto flex min-h-screen max-w-md items-center px-4"><section className="w-full rounded border border-slate-200 bg-white p-6 shadow-sm"><h1 className="mb-5 text-2xl font-semibold text-slate-950">{title}</h1>{children}</section></main>
}
