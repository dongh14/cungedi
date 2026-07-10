import Link from "next/link";
import type { RestaurantExtractionResult } from "@/lib/restaurants/extraction-types";
import { SurfaceCard } from "@/components/surface-card";

type ExtractionPreviewCardProps = {
  result: RestaurantExtractionResult;
};

function buildManualFormHref(result: RestaurantExtractionResult) {
  const searchParams = new URLSearchParams({
    source_input: result.sourceUrl,
  });

  if (result.status === "success") {
    searchParams.set("message", "已带入提取草稿，请继续确认并补全后再保存。");
    searchParams.set("name", result.candidate.fields.name.value ?? "");

    if (result.candidate.fields.city.accepted && result.candidate.fields.city.value) {
      searchParams.set("city", result.candidate.fields.city.value);
    }

    if (result.candidate.fields.address.accepted && result.candidate.fields.address.value) {
      searchParams.set("address", result.candidate.fields.address.value);
    }

    if (result.candidate.fields.cuisine.accepted && result.candidate.fields.cuisine.value) {
      searchParams.set("cuisine", result.candidate.fields.cuisine.value);
    }
  } else {
    searchParams.set("message", "当前没有提取到足够信息，请先手动补全并保存。");
  }

  return `/restaurants/new?${searchParams.toString()}`;
}

function getSupportLabel(result: RestaurantExtractionResult) {
  if (result.supportLevel === "official") {
    return "官方支持来源";
  }

  if (result.supportLevel === "best-effort") {
    return "best-effort 来源";
  }

  return "非主要支持来源";
}

function getPageTypeLabel(result: RestaurantExtractionResult) {
  if (result.pageType === "single_restaurant") {
    return "单餐厅页";
  }

  if (result.pageType === "restaurant_list") {
    return "餐厅目录页";
  }

  if (result.pageType === "generic_page") {
    return "通用页面";
  }

  return "页面类型不明确";
}

export function ExtractionPreviewCard({ result }: ExtractionPreviewCardProps) {
  const nameField = result.status === "success" ? result.candidate.fields.name : null;
  const cityField = result.status === "success" ? result.candidate.fields.city : null;
  const addressField = result.status === "success" ? result.candidate.fields.address : null;
  const cuisineField = result.status === "success" ? result.candidate.fields.cuisine : null;

  return (
    <SurfaceCard className="p-5 sm:p-6">
      <div className="space-y-5">
        <div className="space-y-3">
          <span className="inline-flex rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold tracking-[0.18em] text-[var(--accent-deep)] uppercase">
            Step 11 简单提取
          </span>
          <div>
            <h2 className="[font-family:var(--font-display)] text-2xl font-semibold tracking-[-0.03em] text-[var(--ink-strong)]">
              {result.status === "success" ? "已生成一个餐厅草稿" : "当前改为手动补全更稳妥"}
            </h2>
            <p className="mt-2 text-sm leading-7 text-[var(--ink-soft)]">
              {result.status === "success"
                ? "当前只做 best-effort 提取，不会自动保存。你仍然需要进入手动表单确认或修改所有字段后再保存。"
                : "当前来源没有返回足够稳定的餐厅信息，系统不会强行猜测。你可以保留来源链接，直接进入手动表单继续保存。"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-[var(--surface-muted)] px-3 py-1 text-xs font-medium text-[var(--ink-soft)]">
            {getSupportLabel(result)}
          </span>
          <span className="rounded-full bg-[var(--surface-muted)] px-3 py-1 text-xs font-medium text-[var(--ink-soft)]">
            {getPageTypeLabel(result)}
          </span>
          <span className="rounded-full bg-[var(--surface-muted)] px-3 py-1 text-xs font-medium text-[var(--ink-soft)]">
            {result.status === "success" ? "已生成草稿" : "回退到手动补全"}
          </span>
        </div>

        {result.status === "success" ? (
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[24px] border border-[var(--border-soft)] bg-[var(--surface-muted)] p-4">
                <p className="text-xs font-semibold tracking-[0.16em] text-[var(--accent-deep)] uppercase">
                  餐厅名称
                </p>
                <p className="mt-3 text-sm leading-7 text-[var(--ink-strong)]">
                  {nameField?.value ?? "需要手动补全"}
                </p>
                <p className="mt-2 text-xs leading-6 text-[var(--ink-muted)]">
                  来源：{nameField?.evidenceSource ?? "未提取"}
                </p>
              </div>
              <div className="rounded-[24px] border border-[var(--border-soft)] bg-[var(--surface-muted)] p-4">
                <p className="text-xs font-semibold tracking-[0.16em] text-[var(--accent-deep)] uppercase">
                  城市
                </p>
                <p className="mt-3 text-sm leading-7 text-[var(--ink-strong)]">
                  {cityField?.accepted ? cityField.value : "需要手动补全"}
                </p>
              </div>
            </div>

            <div className="rounded-[24px] border border-[var(--border-soft)] bg-[var(--surface-muted)] p-4">
              <p className="text-xs font-semibold tracking-[0.16em] text-[var(--accent-deep)] uppercase">
                地址
              </p>
              <p className="mt-3 text-sm leading-7 text-[var(--ink-strong)]">
                {addressField?.accepted ? addressField.value : "需要手动补全"}
              </p>
            </div>

            <div className="rounded-[24px] border border-[var(--border-soft)] bg-[var(--surface-muted)] p-4">
              <p className="text-xs font-semibold tracking-[0.16em] text-[var(--accent-deep)] uppercase">
                菜系推断
              </p>
              <p className="mt-3 text-sm leading-7 text-[var(--ink-strong)]">
                {cuisineField?.accepted ? cuisineField.value : "当前保持为空，等你手动确认"}
              </p>
            </div>

            <div className="rounded-[24px] bg-[var(--surface-muted)] p-4">
              <p className="text-sm font-semibold text-[var(--ink-strong)]">草稿通过原因</p>
              <ul className="mt-3 space-y-2 text-sm leading-7 text-[var(--ink-soft)]">
                {result.acceptanceReasons.map((reason) => (
                  <li key={reason}>- {reason}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="rounded-[24px] border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-800">
            {result.reason}
          </div>
        )}

        <div className="rounded-[24px] bg-[var(--surface-muted)] p-4">
          <p className="text-sm font-semibold text-[var(--ink-strong)]">当前提取说明</p>
          <ul className="mt-3 space-y-2 text-sm leading-7 text-[var(--ink-soft)]">
            {result.notes.map((note) => (
              <li key={note}>- {note}</li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href={buildManualFormHref(result)}
            className="inline-flex justify-center rounded-full bg-[var(--accent)] px-5 py-3.5 text-sm font-semibold text-white shadow-[0_18px_38px_rgba(255,91,0,0.28)] transition hover:bg-[var(--accent-deep)]"
          >
            {result.status === "success" ? "把草稿带入手动表单" : "继续手动补全"}
          </Link>
          <a
            href={result.status === "success" ? result.fetchedUrl : result.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex justify-center rounded-full border border-[var(--border-soft)] bg-white px-5 py-3.5 text-sm font-medium text-[var(--ink-strong)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            打开来源链接
          </a>
        </div>
      </div>
    </SurfaceCard>
  );
}
