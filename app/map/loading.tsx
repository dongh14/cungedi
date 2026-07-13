export default function MapLoading() {
  return (
    <main className="min-h-screen bg-[var(--page-bg)] px-4 py-6 pb-28 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl animate-pulse space-y-5">
        <div className="h-4 w-28 rounded-full bg-orange-100" />
        <div className="h-10 max-w-md rounded-2xl bg-orange-100" />
        <div className="h-5 max-w-2xl rounded-full bg-stone-100" />
        <section className="rounded-[28px] border border-[var(--border-soft)] bg-white/72 p-5 sm:p-6">
          <div className="h-12 rounded-2xl bg-stone-100" />
          <div className="mt-3 aspect-[4/5] rounded-[24px] bg-[linear-gradient(135deg,rgba(255,211,186,0.5),rgba(255,245,237,0.9))] sm:aspect-[16/10]" />
          <p className="mt-4 text-sm text-[var(--ink-soft)]">正在加载你的地图地点...</p>
        </section>
      </div>
    </main>
  );
}
