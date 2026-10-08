-- Phase 6, step 1 (run once in the Supabase SQL editor, AFTER a backup): real course ratings, course video,
-- several images per post, admin-managed registration officers.
--  * "Course"."rating" (a stored 5.0 on every course) is dropped; ratings now come from "CourseReview" rows.
--  * "Course"."videoUrl": optional cover video (YouTube/Vimeo link or an uploaded mp4/webm).
--  * "Post"."imageUrls" (up to 4) replaces "Post"."imageUrl"; existing single images are copied over first.
--  * "PlatformSettings"."officers": JSON list of { name, whatsapp, telegram, active } edited in the admin settings.
-- Undo: 01_rollback.sql (the dropped rating values come back as 5.0, the real ones live in "CourseReview").
begin;

alter table "Course" add column "videoUrl" text;
alter table "Course" drop column "rating";

create table "CourseReview" (
  "id"        text primary key,
  "courseId"  text not null references "Course"("id") on delete cascade on update cascade,
  "studentId" text not null references "User"("id") on delete cascade on update cascade,
  "stars"     integer not null check ("stars" between 1 and 5),
  "createdAt" timestamp(3) not null default current_timestamp,
  "updatedAt" timestamp(3) not null
);
create unique index "CourseReview_courseId_studentId_key" on "CourseReview"("courseId", "studentId");

alter table "Post" add column "imageUrls" text[] not null default array[]::text[];
update "Post" set "imageUrls" = array["imageUrl"] where "imageUrl" is not null;
alter table "Post" drop column "imageUrl";

alter table "PlatformSettings" add column "officers" jsonb;

commit;
