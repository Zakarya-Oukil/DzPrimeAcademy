begin;
drop trigger if exists "User_lock_card_id" on "User";
drop function if exists "lock_student_card_id"();
drop table if exists "CardCounter";
alter table "User" drop column if exists "publicToken";
commit;
