-- Limite de upload do bucket cards (artes HD até ~25 MB)
update storage.buckets
set file_size_limit = 26214400 -- 25 MB
where id = 'cards';
