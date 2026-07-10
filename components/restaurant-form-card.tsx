import { createRestaurantAction } from "@/app/restaurants/actions";
import { privacyOptions, cuisineSuggestions } from "@/lib/restaurants/constants";
import { SurfaceCard } from "@/components/surface-card";

type RestaurantFormCardProps = {
  searchParams: {
    error?: string;
    message?: string;
    name?: string;
    city?: string;
    source_input?: string;
    privacy?: string;
    address?: string;
    cuisine?: string;
    note?: string;
  };
};

function FieldLabel({
  htmlFor,
  label,
  required = false,
}: {
  htmlFor: string;
  label: string;
  required?: boolean;
}) {
  return (
    <label htmlFor={htmlFor} className="text-sm font-medium text-[var(--ink-strong)]">
      {label}
      {required ? <span className="ml-1 text-[var(--accent)]">*</span> : null}
    </label>
  );
}

export function RestaurantFormCard({ searchParams }: RestaurantFormCardProps) {
  return (
    <SurfaceCard className="p-5 sm:p-6">
      <div className="space-y-5">
        <div className="space-y-3">
          <span className="inline-flex rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold tracking-[0.18em] text-[var(--accent-deep)] uppercase">
            Step 7 手动创建
          </span>
          <div>
            <h2 className="[font-family:var(--font-display)] text-2xl font-semibold tracking-[-0.03em] text-[var(--ink-strong)]">
              手动添加餐厅
            </h2>
            <p className="mt-2 text-sm leading-7 text-[var(--ink-soft)]">
              先把最关键的餐厅信息存下来。当前不会做坐标、地理编码或来源内容提取，只提供最直接的手动保存入口。
            </p>
          </div>
        </div>

        {searchParams.message ? (
          <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {searchParams.message}
          </div>
        ) : null}

        {searchParams.error ? (
          <div className="rounded-[24px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {searchParams.error}
          </div>
        ) : null}

        <form action={createRestaurantAction} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <FieldLabel htmlFor="name" label="餐厅名称" required />
              <input
                id="name"
                name="name"
                required
                defaultValue={searchParams.name ?? ""}
                className="w-full rounded-[22px] border border-[var(--border-soft)] bg-[var(--surface-muted)] px-4 py-3.5 text-sm text-[var(--ink-strong)] outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-glow)]"
                placeholder="例如：阿明海鲜酒家"
              />
            </div>

            <div className="space-y-2">
              <FieldLabel htmlFor="city" label="城市" required />
              <input
                id="city"
                name="city"
                required
                defaultValue={searchParams.city ?? ""}
                className="w-full rounded-[22px] border border-[var(--border-soft)] bg-[var(--surface-muted)] px-4 py-3.5 text-sm text-[var(--ink-strong)] outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-glow)]"
                placeholder="例如：上海"
              />
            </div>
          </div>

          <div className="space-y-2">
            <FieldLabel htmlFor="source_url" label="来源链接或分享文案" required />
            <input
              id="source_url"
              name="source_url"
              required
              defaultValue={searchParams.source_input ?? ""}
              className="w-full rounded-[22px] border border-[var(--border-soft)] bg-[var(--surface-muted)] px-4 py-3.5 text-sm text-[var(--ink-strong)] outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-glow)]"
              placeholder="可以直接粘贴链接，或粘贴一整段小红书 / 抖音分享文案"
            />
            <p className="text-xs leading-6 text-[var(--ink-muted)]">
              支持直接链接，也支持包含链接的整段分享文字。系统会自动提取并保存其中第一个有效的 http 或 https 链接。
            </p>
          </div>

          <div className="space-y-2">
            <FieldLabel htmlFor="address" label="地址" />
            <input
              id="address"
              name="address"
              defaultValue={searchParams.address ?? ""}
              className="w-full rounded-[22px] border border-[var(--border-soft)] bg-[var(--surface-muted)] px-4 py-3.5 text-sm text-[var(--ink-strong)] outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-glow)]"
              placeholder="例如：上海市黄浦区示例路 88 号"
            />
          </div>

          <div className="space-y-2">
            <FieldLabel htmlFor="cuisine" label="菜系或类型" />
            <input
              id="cuisine"
              name="cuisine"
              list="cuisine-suggestions"
              defaultValue={searchParams.cuisine ?? ""}
              className="w-full rounded-[22px] border border-[var(--border-soft)] bg-[var(--surface-muted)] px-4 py-3.5 text-sm text-[var(--ink-strong)] outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-glow)]"
              placeholder="例如：川菜、火锅、咖啡馆"
            />
            <datalist id="cuisine-suggestions">
              {cuisineSuggestions.map((option) => (
                <option key={option} value={option} />
              ))}
            </datalist>
            <p className="text-xs leading-6 text-[var(--ink-muted)]">
              可以直接输入，也可以从建议里选择，支持中文录入。
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-[var(--ink-strong)]">
              可见范围<span className="ml-1 text-[var(--accent)]">*</span>
            </p>
            <div className="grid gap-3">
              {privacyOptions.map((option, index) => (
                <label
                  key={option.value}
                  className="flex cursor-pointer gap-3 rounded-[24px] border border-[var(--border-soft)] bg-[var(--surface-muted)] p-4 transition hover:border-[var(--accent)]/45"
                >
                  <input
                    type="radio"
                    name="privacy"
                    value={option.value}
                    defaultChecked={
                      searchParams.privacy
                        ? searchParams.privacy === option.value
                        : index === 0
                    }
                    className="mt-1 h-4 w-4 accent-[var(--accent)]"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-[var(--ink-strong)]">
                      {option.label}
                    </span>
                    <span className="mt-1 block text-xs leading-6 text-[var(--ink-soft)]">
                      {option.description}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <FieldLabel htmlFor="note" label="备注" />
            <textarea
              id="note"
              name="note"
              rows={4}
              defaultValue={searchParams.note ?? ""}
              className="w-full rounded-[22px] border border-[var(--border-soft)] bg-[var(--surface-muted)] px-4 py-3.5 text-sm text-[var(--ink-strong)] outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-glow)]"
              placeholder="例如：想试招牌蟹粉拌面，适合周末去。"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-full bg-[var(--accent)] px-5 py-3.5 text-sm font-semibold text-white shadow-[0_18px_38px_rgba(255,91,0,0.28)] transition hover:bg-[var(--accent-deep)]"
          >
            保存餐厅
          </button>
        </form>
      </div>
    </SurfaceCard>
  );
}
