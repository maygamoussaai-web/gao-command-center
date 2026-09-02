ALTER TYPE public.statut_restaurant ADD VALUE IF NOT EXISTS 'en_attente';
ALTER TYPE public.statut_restaurant ADD VALUE IF NOT EXISTS 'refuse';

ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS motif_refus text;

CREATE OR REPLACE FUNCTION public.admin_restaurants_en_attente(p_token text)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
declare
  v_res json;
begin
  if not exists (
    select 1 from public.sessions_admin s
    where s.token = p_token and s.expires_at > now()
  ) then
    raise exception 'Session expirée.';
  end if;

  select coalesce(json_agg(x order by x.created_at desc), '[]'::json) into v_res
  from (
    select r.id, r.nom, r.logo_url, r.quartier, r.prix_livraison,
           r.horaire_ouverture, r.horaire_fermeture,
           r.delai_livraison_min_min, r.delai_livraison_max_min,
           r.statut, r.motif_refus, r.created_at,
           json_build_object('prenom', t.prenom, 'nom', t.nom, 'numero', t.numero) as restaurateur
    from public.restaurants r
    left join public.restaurateurs t on t.id = r.restaurateur_id
    where r.statut in ('en_attente', 'refuse')
  ) x;

  return v_res;
end;
$$;

CREATE OR REPLACE FUNCTION public.admin_valider_restaurant(p_token text, p_restaurant_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
begin
  if not exists (
    select 1 from public.sessions_admin s
    where s.token = p_token and s.expires_at > now()
  ) then
    raise exception 'Session expirée.';
  end if;

  update public.restaurants
  set statut = 'actif', motif_refus = null, motif_suspension = null
  where id = p_restaurant_id and statut in ('en_attente', 'refuse');

  if not found then
    raise exception 'Ce restaurant n''est pas en attente de validation.';
  end if;
end;
$$;

CREATE OR REPLACE FUNCTION public.admin_refuser_restaurant(p_token text, p_restaurant_id uuid, p_motif text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
begin
  if not exists (
    select 1 from public.sessions_admin s
    where s.token = p_token and s.expires_at > now()
  ) then
    raise exception 'Session expirée.';
  end if;

  if p_motif is null or length(btrim(p_motif)) = 0 then
    raise exception 'Le motif du refus est obligatoire.';
  end if;

  update public.restaurants
  set statut = 'refuse', motif_refus = btrim(p_motif)
  where id = p_restaurant_id and statut = 'en_attente';

  if not found then
    raise exception 'Ce restaurant n''est pas en attente de validation.';
  end if;
end;
$$;

GRANT EXECUTE ON FUNCTION public.admin_restaurants_en_attente(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_valider_restaurant(text, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_refuser_restaurant(text, uuid, text) TO anon, authenticated;