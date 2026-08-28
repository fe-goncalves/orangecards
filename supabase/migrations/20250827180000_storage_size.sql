-- Aumenta limite do bucket cards (arte HD > 1MB). Default do projeto às vezes fica 1MB.
update storage.buckets
set file_size_limit = 20971520 -- 20 MB
where id = 'cards';
