import Link from "next/link";
import type { RestaurantExtractionResult } from "@/lib/restaurants/extraction-types";
import { getPlaceCategoryLabel, getSubtypeFieldConfig } from "@/lib/restaurants/constants";
import { SurfaceCard } from "@/components/surface-card";

type ExtractionPreviewCardProps = {
  result: RestaurantExtractionResult;
};

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
    return "单地点页";
  }

  if (result.pageType === "restaurant_list") {
    return "地点目录页";
  }

  if (result.pageType === "generic_page") {
    return "通用页面";
  }

  return "页面类型不明确";
}

export function ExtractionPreviewCard({ result }: ExtractionPreviewCardProps) {
  const extractedCategory =
    result.status === "success" ? getPlaceCategoryLabel(result.candidate.category) : null;
  const nameField = result.status === "success" ? result.candidate.fields.name : null;
  const cityField = result.status === "success" ? result.candidate.fields.city : null;
  const addressField = result.status === "success" ? result.candidate.fields.address : null;
  const cuisineField = result.status === "success" ? result.candidate.fields.cuisine : null;
  const acceptedFields: Array<{
    key: string;
    label: string;
    value: string;
    evidence: string;
  }> = [];

  if (result.status === "success" && nameField?.value) {
    acceptedFields.push({
      key: "name",
      label: "地点名称",
      value: nameField.value,
      evidence: nameField.evidenceSource ?? "未记录",
    });
  }

  if (result.status === "success" && cityField?.accepted && cityField.value) {
    acceptedFields.push({
      key: "city",
      label: "城市",
      value: cityField.value,
      evidence: cityField.evidenceSource ?? "未记录",
    });
  }

  if (result.status === "success" && addressField?.accepted && addressField.value) {
    acceptedFields.push({
      key: "address",
      label: "地址",
      value: addressField.value,
      evidence: addressField.evidenceSource ?? "未记录",
    });
  }

  if (result.status === "success" && cuisineField?.accepted && cuisineField.value) {
    acceptedFields.push({
      key: "cuisine",
      label:
        extractedCategory === "美食"
          ? "类型推断（美食）"
          : extractedCategory
            ? getSubtypeFieldConfig(extractedCategory).label
            : "类型细分",
      value: cuisineField.value,
      evidence: cuisineField.evidenceSource ?? "未记录",
    });
  }

  const successDescription =
    extractedCategory === "住宿"
      ? "当前只展示已被 Step 11 接受的字段，低置信度或被拒绝的内容不会出现在这里。住宿自动提取目前只在强结构化数据足够明确时才会生成草稿，你仍然需要在下方确认、补全并主动点击保存。"
      : extractedCategory === "景点"
        ? "当前只展示已被 Step 11 接受的字段，低置信度或被拒绝的内容不会出现在这里。景点自动提取目前只在强结构化数据足够明确时才会生成草稿，你仍然需要在下方确认、补全并主动点击保存。"
        : extractedCategory === "娱乐"
          ? "当前只展示已被 Step 11 接受的字段，低置信度或被拒绝的内容不会出现在这里。娱乐地点自动提取目前只在强结构化数据足够明确时才会生成草稿，你仍然需要在下方确认、补全并主动点击保存。"
        : extractedCategory === "购物"
          ? "当前只展示已被 Step 11 接受的字段，低置信度或被拒绝的内容不会出现在这里。购物地点自动提取目前只在强结构化数据足够明确时才会生成草稿，你仍然需要在下方确认、补全并主动点击保存。"
        : extractedCategory === "其他"
          ? "当前只展示已被 Step 11 接受的字段，低置信度或被拒绝的内容不会出现在这里。其他地点自动提取目前只会在单地点页同时具备强通用结构化数据和可靠位置证据时才会生成草稿，你仍然需要在下方确认、补全并主动点击保存。"
          : "当前只展示已被 Step 11 接受的字段，低置信度或被拒绝的内容不会出现在这里。自动提取目前仍以餐厅类页面最稳妥，你仍然需要在下方确认、补全并主动点击保存。";

  return (
    <SurfaceCard className="p-5 sm:p-6">
      <div className="space-y-5">
        <div className="space-y-3">
          <span className="inline-flex rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold tracking-[0.18em] text-[var(--accent-deep)] uppercase">
            Step 11 简单提取
          </span>
          <div>
            <h2 className="[font-family:var(--font-display)] text-2xl font-semibold tracking-[-0.03em] text-[var(--ink-strong)]">
              {result.status === "success" ? "已生成一个可确认的单地点草稿" : "当前改为手动补全更稳妥"}
            </h2>
            <p className="mt-2 text-sm leading-7 text-[var(--ink-soft)]">
              {result.status === "success"
                ? successDescription
                : "当前来源没有返回足够稳定的美食、住宿、景点、购物、娱乐或其他类单地点信息，系统不会强行猜测。你可以保留来源链接，直接进入手动表单继续保存其他地点。"}
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
          {extractedCategory ? (
            <span className="rounded-full bg-[var(--surface-muted)] px-3 py-1 text-xs font-medium text-[var(--ink-soft)]">
              分类：{extractedCategory}
            </span>
          ) : null}
        </div>

        {result.status === "success" ? (
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              {acceptedFields.map((field) => (
                <div
                  key={field.key}
                  className="rounded-[24px] border border-[var(--border-soft)] bg-[var(--surface-muted)] p-4"
                >
                  <p className="text-xs font-semibold tracking-[0.16em] text-[var(--accent-deep)] uppercase">
                    {field.label}
                  </p>
                  <p className="mt-3 text-sm leading-7 text-[var(--ink-strong)]">
                    {field.value}
                  </p>
                  <p className="mt-2 text-xs leading-6 text-[var(--ink-muted)]">
                    来源：{field.evidence}
                  </p>
                </div>
              ))}
            </div>

            <div className="rounded-[24px] bg-[var(--surface-muted)] p-4">
              <p className="text-sm font-semibold text-[var(--ink-strong)]">草稿通过原因</p>
              <ul className="mt-3 space-y-2 text-sm leading-7 text-[var(--ink-soft)]">
                {result.acceptanceReasons.map((reason) => (
                  <li key={reason}>- {reason.replaceAll("玩乐", "娱乐")}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="rounded-[24px] border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-800">
            {result.reason.replaceAll("玩乐", "娱乐")}
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
          <a
            href={result.status === "success" ? result.fetchedUrl : result.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex justify-center rounded-full border border-[var(--border-soft)] bg-white px-5 py-3.5 text-sm font-medium text-[var(--ink-strong)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            打开来源链接
          </a>
          <Link
            href="/restaurants/new"
            className="inline-flex justify-center rounded-full border border-[var(--border-soft)] bg-white px-5 py-3.5 text-sm font-medium text-[var(--ink-strong)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            改回普通手动创建
          </Link>
        </div>
      </div>
    </SurfaceCard>
  );
}
