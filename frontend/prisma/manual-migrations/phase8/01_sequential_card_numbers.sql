-- Phase 8, step 1 (run once in the Supabase SQL editor, AFTER a backup): sequential, locked card numbers.
--  * "CardCounter": one running number per card type and wilaya (key like 'FND-16').
--  * Every existing card is renumbered DZ-<TYPE>-<wilaya>-0001, 0002, ... in sign-up order.
--    Founders (role OWNER, or a job title with "founder"/"fondateur"/"مؤسس") get the FND type.
--    The old HR type (2 letters, never matched the verify pattern) becomes HRM.
--  * "User"."publicToken": random 32-hex key (default from the database) used in QR codes and public URLs, because sequential
--    card numbers can be enumerated. Existing users get one; the card number is display-only.
--  * A trigger refuses any later change of "studentCardId" once it is set.
-- Printed or shared QR codes of the old random IDs stop working: run this before launch.
-- Undo: 01_rollback.sql (drops the trigger and the counter; it cannot restore the old random IDs, so keep the backup).
begin;

alter table "User" add column "publicToken" text unique default replace(gen_random_uuid()::text, '-', '');
update "User" set "publicToken" = replace(gen_random_uuid()::text, '-', '') where "publicToken" is null;

create table "CardCounter" (
  "key" text primary key,
  "value" integer not null default 0
);

with typed as (
  select u."id",
    case
      when u."role" = 'OWNER' or u."jobTitle" ~* '(founder|fondateur|مؤسس)' then 'FND'
      when split_part(u."studentCardId", '-', 2) = 'HR' then 'HRM'
      else split_part(u."studentCardId", '-', 2)
    end as t,
    coalesce(u."wilayaCode", nullif(split_part(u."studentCardId", '-', 3), '')::int, 16) as w,
    u."createdAt"
  from "User" u
  where u."studentCardId" is not null
), numbered as (
  select id, t, w, row_number() over (partition by t, w order by "createdAt", id) as n from typed
)
update "User" u
set "studentCardId" = 'DZ-' || numbered.t || '-' || numbered.w || '-' || lpad(numbered.n::text, 4, '0')
from numbered
where u."id" = numbered.id;

insert into "CardCounter" ("key", "value")
select split_part("studentCardId", '-', 2) || '-' || split_part("studentCardId", '-', 3),
       max(split_part("studentCardId", '-', 4)::int)
from "User"
where "studentCardId" ~ '^DZ-[A-Z]{3}-[0-9]{1,3}-[0-9]{4,}$'
group by 1;

create function "lock_student_card_id"() returns trigger language plpgsql as $$
begin
  if old."studentCardId" is not null and new."studentCardId" is distinct from old."studentCardId" then
    raise exception 'studentCardId is locked once issued';
  end if;
  return new;
end $$;

create trigger "User_lock_card_id" before update of "studentCardId" on "User"
for each row execute function "lock_student_card_id"();

commit;
