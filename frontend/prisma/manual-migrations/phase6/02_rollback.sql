-- Undo of 02_media_bucket_limits.sql: images only, 2 MB.
update storage.buckets
   set file_size_limit = 2097152,
       allowed_mime_types = array['image/webp']
 where id = 'dz-images';
