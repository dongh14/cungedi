import { startSourceIntakeAction } from "@/app/restaurants/actions";
import { AppIcon } from "@/components/app-icon";
import { SurfaceCard } from "@/components/surface-card";

type SourceIntakeCardProps = {
  searchParams: {
    source_error?: string;
    source_message?: string;
    intake_input?: string;
  };
};
export function SourceIntakeCard({ searchParams }: SourceIntakeCardProps) {

  return (
    <SurfaceCard className="form-surface p-4 sm:p-5">
      <div className="space-y-5">
        <div className="space-y-3">
          <div>
            <div className="form-card-title"><span className="form-card-icon"><AppIcon name="link" size={17} /></span><h2>粘贴链接</h2></div>
          </div>
        </div>

        {searchParams.source_message ? (
          <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {searchParams.source_message}
          </div>
        ) : null}

        {searchParams.source_error ? (
          <div className="rounded-[24px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {searchParams.source_error}
          </div>
        ) : null}

        <form action={startSourceIntakeAction} className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="source_input"
              className="form-label"
            >
              请粘贴地点链接
              <span className="ml-1 text-[var(--accent)]">*</span>
            </label>
            <textarea
              id="source_input"
              name="source_input"
              rows={5}
              required
              defaultValue={searchParams.intake_input ?? ""}
              className="form-control w-full"
              placeholder="支持小红书、抖音、官方网站或其他网页"
            />
          </div>

          <button
            type="submit"
            className="primary-button w-full"
          >
            开始分析
          </button>
        </form>
      </div>
    </SurfaceCard>
  );
}
