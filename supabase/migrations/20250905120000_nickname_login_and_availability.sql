-- Nickname availability + login por nickname/email

create or replace function public.is_nickname_available(p_nickname text)
returns json
language plpgsql
stable
security definer
set search_path = public, auth
as $$
declare
  v_nick text := lower(trim(coalesce(p_nickname, '')));
  v_taken boolean := false;
begin
  if length(v_nick) < 2 or length(v_nick) > 32 then
    return json_build_object('ok', false, 'available', false, 'error', 'invalid');
  end if;

  if v_nick !~ '^[a-z0-9_-]+$' then
    return json_build_object('ok', false, 'available', false, 'error', 'invalid');
  end if;

  if right(v_nick, 1) = '.' then
    return json_build_object('ok', false, 'available', false, 'error', 'invalid');
  end if;

  select exists (
    select 1
    from auth.users u
    where lower(trim(coalesce(u.raw_user_meta_data->>'nickname', ''))) = v_nick
  ) into v_taken;

  return json_build_object(
    'ok', true,
    'available', not v_taken,
    'nickname', v_nick
  );
end;
$$;

revoke all on function public.is_nickname_available(text) from public;
grant execute on function public.is_nickname_available(text) to anon, authenticated;

-- Resolve e-mail a partir de e-mail OU nickname (para login)
create or replace function public.resolve_login_identifier(p_identifier text)
returns json
language plpgsql
stable
security definer
set search_path = public, auth
as $$
declare
  v_raw text := trim(coalesce(p_identifier, ''));
  v_email text;
begin
  if length(v_raw) < 2 then
    return json_build_object('ok', false, 'error', 'invalid');
  end if;

  -- Parece e-mail
  if position('@' in v_raw) > 1 then
    select u.email into v_email
    from auth.users u
    where lower(u.email) = lower(v_raw)
    limit 1;

    if v_email is null then
      -- Não revelar se existe ou não: devolve o próprio e-mail para o sign-in tentar
      return json_build_object('ok', true, 'email', lower(v_raw));
    end if;

    return json_build_object('ok', true, 'email', v_email);
  end if;

  -- Nickname
  if lower(v_raw) !~ '^[a-z0-9_-]{2,32}$' then
    return json_build_object('ok', false, 'error', 'invalid_nickname');
  end if;

  select u.email into v_email
  from auth.users u
  where lower(trim(coalesce(u.raw_user_meta_data->>'nickname', ''))) = lower(v_raw)
  limit 1;

  if v_email is null then
    return json_build_object('ok', false, 'error', 'not_found');
  end if;

  return json_build_object('ok', true, 'email', v_email);
end;
$$;

revoke all on function public.resolve_login_identifier(text) from public;
grant execute on function public.resolve_login_identifier(text) to anon, authenticated;
