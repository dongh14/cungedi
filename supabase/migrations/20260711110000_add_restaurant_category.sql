begin;

alter table public.restaurants
  add column if not exists category text;

update public.restaurants
set category = '美食'
where category is null;

alter table public.restaurants
  alter column category set default '美食',
  alter column category set not null;

alter table public.restaurants
  drop constraint if exists restaurants_category_check;

alter table public.restaurants
  add constraint restaurants_category_check
  check (category in ('美食', '购物', '玩乐', '景点', '住宿', '其他'));

commit;
