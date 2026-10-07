-- Phase 5, step 1 (run once in the Supabase SQL editor): a PRIVATE bucket for exam PDFs.
-- public = false: nobody can open a file by guessing its URL. The site gives entitled users a link that works for
-- 5 minutes (server env SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY as in phase 3; SUPABASE_EXAMS_BUCKET optional).
--
-- How to publish an exam file:
--   1) upload the PDF to the dz-exams bucket in the Supabase dashboard (e.g. analyse1/emd-2024.pdf)
--   2) point the exam at it:  UPDATE "Exam" SET "fileUrl" = 'storage:analyse1/emd-2024.pdf' WHERE id = '...';
--      (same for "solutionUrl"). Exams whose fileUrl is a normal URL keep working as before.
-- Undo: delete from storage.buckets where id = 'dz-exams';  (after emptying it in the dashboard)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('dz-exams', 'dz-exams', false, 26214400, array['application/pdf'])
on conflict (id) do update
  set public = false,
      file_size_limit = 26214400,
      allowed_mime_types = array['application/pdf'];
