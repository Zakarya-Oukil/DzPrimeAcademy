-- Phase 3, step 3 (run in the Supabase SQL editor, once): the public image bucket the uploader writes to.
-- THIS IS A DEPLOY REQUIREMENT, not a nicety: a signed upload URL cannot enforce file type or size, so the
-- bucket itself must (2 MB, WebP only). Without these two limits anyone allowed to upload could store any file.
-- Also set these server env vars (Vercel / .env, never in git):
--   SUPABASE_URL=https://<project-ref>.supabase.co
--   SUPABASE_SERVICE_ROLE_KEY=<service role key>      (server only; never NEXT_PUBLIC_)
--   SUPABASE_STORAGE_BUCKET=dz-images                  (optional, this is the default)
-- and rebuild, so next.config.mjs allows the storage host for next/image.
-- Undo: delete from storage.buckets where id = 'dz-images';  (after emptying it in the dashboard)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('dz-images', 'dz-images', true, 2097152, array['image/webp'])
on conflict (id) do update
  set public = true,
      file_size_limit = 2097152,
      allowed_mime_types = array['image/webp'];
