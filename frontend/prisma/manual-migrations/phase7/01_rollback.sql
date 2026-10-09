-- Undo of 01_teacher_landing.sql. Landing teacher cards (switch, order, public bio, photo link) are lost.
begin;
alter table "TeacherProfile" drop column "photoUrl";
alter table "TeacherProfile" drop column "publicBio";
alter table "TeacherProfile" drop column "landingOrder";
alter table "TeacherProfile" drop column "showOnLanding";
commit;
