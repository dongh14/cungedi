begin;

-- Add the general-place label without invalidating legacy 玩乐 rows.
alter table public.restaurants
  drop constraint if exists restaurants_category_check;

alter table public.restaurants
  add constraint restaurants_category_check
  check (category in ('美食', '购物', '玩乐', '娱乐', '景点', '住宿', '其他'));

commit;
