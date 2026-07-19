import { startRestaurantReviewAction } from "@/app/restaurants/actions";
import { AppIcon } from "@/components/app-icon";
import { FormSubmitButton } from "@/components/form-submit-button";
import {
  RestaurantFormFields,
  type RestaurantFormFieldValues,
} from "@/components/restaurant-form-fields";
import { SurfaceCard } from "@/components/surface-card";
import { resolvePlaceArea } from "@/lib/location";
type RestaurantFormCardProps = {
  searchParams: Partial<RestaurantFormFieldValues> & {
    error?: string;
    message?: string;
  };
};

export function RestaurantFormCard({ searchParams }: RestaurantFormCardProps) {
  const values: RestaurantFormFieldValues = {
    name: searchParams.name ?? "",
    city: searchParams.city ?? "",
    country: searchParams.country ?? resolvePlaceArea({ city: searchParams.city }).country ?? "",
    district: searchParams.district ?? "",
    source_input: searchParams.source_input ?? "",
    category: searchParams.category ?? "",
    address: searchParams.address ?? "",
    cuisine: searchParams.cuisine ?? "",
    note: searchParams.note ?? "",
  };

  return (
    <SurfaceCard className="form-surface p-4 sm:p-5">
      <div className="space-y-5">
        <div className="space-y-3">
          <div>
            <div className="form-card-title"><span className="form-card-icon form-card-icon-green"><AppIcon name="edit" size={17} /></span><h2>手动添加</h2></div>
            <p className="form-card-subtitle">已有信息？直接填写，保存前还会有一次确认。</p>
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

        <form action={startRestaurantReviewAction} className="space-y-5">
          <RestaurantFormFields values={values} persistToUrl />

          <FormSubmitButton idleLabel="进入保存前确认" pendingLabel="处理中…" />
        </form>
      </div>
    </SurfaceCard>
  );
}
