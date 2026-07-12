type ExtractionFixturePageProps = {
  title: string;
  description: string;
  jsonLd: Record<string, unknown> | Array<Record<string, unknown>>;
  body: string[];
};

export function ExtractionFixturePage({
  title,
  description,
  jsonLd,
  body,
}: ExtractionFixturePageProps) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 bg-white px-6 py-10 text-neutral-900">
      <div className="rounded-3xl border border-amber-300 bg-amber-50 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
          Development/Test Only
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em]">{title}</h1>
        <p className="mt-3 text-sm leading-7 text-neutral-700">{description}</p>
        <p className="mt-3 text-sm leading-7 text-neutral-600">
          这个页面只用于本地开发时做确定性提取验证。请把当前 localhost URL 粘贴进地点保存入口，
          继续走真实的 Step 11 / Step 12 提取与确认流程。
        </p>
      </div>

      <section className="space-y-4 rounded-3xl border border-neutral-200 p-6">
        {body.map((paragraph) => (
          <p key={paragraph} className="text-base leading-8 text-neutral-800">
            {paragraph}
          </p>
        ))}
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd),
        }}
      />
    </main>
  );
}
