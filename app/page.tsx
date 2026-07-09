export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-950 px-6 py-16 text-stone-50">
      <section className="w-full max-w-4xl rounded-3xl border border-white/10 bg-white/6 p-8 shadow-2xl shadow-black/20 backdrop-blur sm:p-12">
        <div className="max-w-2xl space-y-6">
          <span className="inline-flex rounded-full border border-amber-300/40 bg-amber-300/12 px-4 py-1 text-sm font-medium tracking-[0.18em] text-amber-100">
            第一步占位页
          </span>
          <div className="space-y-4">
            <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
              Restaurant Information Collector 餐厅信息收集器
            </h1>
            <p className="text-lg leading-8 text-stone-300 sm:text-xl">
              一个简单的起点，帮助你保存旅行中发现的餐厅链接，确认整理信息，并在之后轻松找回。
            </p>
          </div>
          <div className="grid gap-3 text-sm text-stone-300 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              支持保存来自小红书、抖音、Google Maps 和公开网页的餐厅线索。
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              保存前先检查并编辑提取出的餐厅信息，不会自动入库。
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              之后可以在列表和世界地图中回看你收藏的餐厅。
            </div>
          </div>
          <p className="text-sm text-stone-400">
            当前只是产品外壳。登录、数据配置和保存流程会在后续步骤中继续完成。
          </p>
        </div>
      </section>
    </main>
  );
}
