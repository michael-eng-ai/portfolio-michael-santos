export default function NotFound() {
  return (
    <main className="container-shell py-24">
      <div className="section-card rounded-3xl p-10">
        <p className="text-sm uppercase tracking-[0.3em] text-slate-400">404</p>
        <h1 className="mt-3 text-4xl font-semibold text-white">Page not found</h1>
        <p className="mt-4 max-w-xl text-slate-400">
          The requested content does not exist or is no longer available.
        </p>
      </div>
    </main>
  );
}
