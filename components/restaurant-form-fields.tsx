import { privacyOptions } from "@/lib/restaurants/constants";
import { CuisineField } from "@/components/cuisine-field";

export type RestaurantFormFieldValues = {
  name: string;
  city: string;
  source_input: string;
  privacy: string;
  address: string;
  cuisine: string;
  note: string;
};

export function FieldLabel({
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

export function RestaurantFormFields({
  values,
  sourceLabel = "来源链接或分享文案",
  sourceHint = "支持直接链接，也支持包含链接的整段分享文字。系统会自动提取并保存其中第一个有效的 http 或 https 链接。",
}: {
  values: RestaurantFormFieldValues;
  sourceLabel?: string;
  sourceHint?: string;
}) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <FieldLabel htmlFor="name" label="餐厅名称" required />
          <input
            id="name"
            name="name"
            required
            defaultValue={values.name}
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
            defaultValue={values.city}
            className="w-full rounded-[22px] border border-[var(--border-soft)] bg-[var(--surface-muted)] px-4 py-3.5 text-sm text-[var(--ink-strong)] outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-glow)]"
            placeholder="例如：上海"
          />
        </div>
      </div>

      <div className="space-y-2">
        <FieldLabel htmlFor="source_url" label={sourceLabel} required />
        <input
          id="source_url"
          name="source_url"
          required
          defaultValue={values.source_input}
          className="w-full rounded-[22px] border border-[var(--border-soft)] bg-[var(--surface-muted)] px-4 py-3.5 text-sm text-[var(--ink-strong)] outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-glow)]"
          placeholder="可以直接粘贴链接，或粘贴一整段小红书 / 抖音分享文案"
        />
        <p className="text-xs leading-6 text-[var(--ink-muted)]">{sourceHint}</p>
      </div>

      <div className="space-y-2">
        <FieldLabel htmlFor="address" label="地址" />
        <input
          id="address"
          name="address"
          defaultValue={values.address}
          className="w-full rounded-[22px] border border-[var(--border-soft)] bg-[var(--surface-muted)] px-4 py-3.5 text-sm text-[var(--ink-strong)] outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-glow)]"
          placeholder="例如：上海市黄浦区示例路 88 号"
        />
      </div>

      <div className="space-y-2">
        <FieldLabel htmlFor="cuisine" label="菜系或类型" />
        <CuisineField
          id="cuisine"
          name="cuisine"
          initialValue={values.cuisine}
          placeholder="例如：川菜、火锅、咖啡馆"
        />
        <p className="text-xs leading-6 text-[var(--ink-muted)]">
          可以直接输入，也可以从建议里选择，支持中文录入。
        </p>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium text-[var(--ink-strong)]">
          可见范围<span className="ml-1 text-[var(--accent)]">*</span>
        </p>
        <div className="grid gap-3">
          {privacyOptions.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer gap-3 rounded-[24px] border border-[var(--border-soft)] bg-[var(--surface-muted)] p-4 transition hover:border-[var(--accent)]/45"
            >
              <input
                type="radio"
                name="privacy"
                value={option.value}
                defaultChecked={values.privacy === option.value}
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
          defaultValue={values.note}
          className="w-full rounded-[22px] border border-[var(--border-soft)] bg-[var(--surface-muted)] px-4 py-3.5 text-sm text-[var(--ink-strong)] outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-glow)]"
          placeholder="例如：想试招牌蟹粉拌面，适合周末去。"
        />
      </div>
    </>
  );
}
