-- Phase 6, step 2 (Supabase SQL editor): let the public image bucket also hold short uploaded videos.
-- Files stay capped at 50 MB, the most the Supabase free plan allows per file. If your project is on a paid plan
-- and you want longer videos, raise file_size_limit here AND MAX_VIDEO_BYTES in src/lib/safeUrl.ts together.
-- Undo: 02_rollback.sql
update storage.buckets
   set file_size_limit = 52428800,
       allowed_mime_types = array['image/webp', 'video/mp4', 'video/webm']
 where id = 'dz-images';
