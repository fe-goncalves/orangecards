-- Código interno do card é identidade permanente (não depende da numeração pública).
-- Claims já usam cards.id (UUID). Este trigger impede trocar o code depois de criado.

create or replace function public.cards_freeze_code()
returns trigger
language plpgsql
as $$
begin
  if new.code is distinct from old.code then
    raise exception 'ORANGE CARDS: o código interno do card é permanente e não pode ser alterado. Crie um card novo para nova identidade.';
  end if;
  return new;
end;
$$;

drop trigger if exists cards_freeze_code on public.cards;
create trigger cards_freeze_code
  before update on public.cards
  for each row
  execute function public.cards_freeze_code();

comment on column public.cards.id is 'UUID definitivo do card. Claims referenciam este ID — nunca a numeração pública.';
comment on column public.cards.code is 'Código interno permanente único. Independente do number. Não reutilizar entre cards.';
comment on column public.cards.number is 'Numeração pública exibida (#01). Pode se repetir em cards aposentados; não identifica o claim.';
