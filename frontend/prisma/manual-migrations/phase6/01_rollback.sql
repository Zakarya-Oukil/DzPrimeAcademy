-- Undo of 01_reviews_media_officers.sql. Reviews, course videos and extra post images beyond the first are lost.
begin;
alter table "PlatformSettings" drop column "officers";
alter table "Post" add column "imageUrl" text;
update "Post" set "imageUrl" = "imageUrls"[1] where cardinality("imageUrls") > 0;
alter table "Post" drop column "imageUrls";
drop table "CourseReview";
alter table "Course" add column "rating" double precision not null default 5.0;
alter table "Course" drop column "videoUrl";
commit;
