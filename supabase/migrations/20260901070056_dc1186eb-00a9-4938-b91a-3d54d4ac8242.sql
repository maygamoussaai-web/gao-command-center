create or replace function public.admin_stats_restaurant(p_token text, p_restaurant_id uuid)
returns json
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_prix_promo integer;
  v_prix_cmd integer;
  v_solde numeric;
  v_debut_jour timestamptz := date_trunc('day', now());
  v_debut_semaine timestamptz := date_trunc('week', now());
  v_debut_mois timestamptz := date_trunc('month', now());
  v_res json;
begin
  if not exists (
    select 1 from public.sessions_admin s
    where s.token = p_token and s.expires_at > now()
  ) then
    raise exception 'Session expirée.';
  end if;

  select prix_promotion, prix_par_commande_payee
    into v_prix_promo, v_prix_cmd
  from public.parametres_admin where id = 1;

  v_prix_promo := coalesce(v_prix_promo, 0);
  v_prix_cmd := coalesce(v_prix_cmd, 0);

  select solde_admin into v_solde from public.restaurants where id = p_restaurant_id;

  with c as (
    select
      count(*) filter (where created_at >= v_debut_jour) as jour,
      count(*) filter (where created_at >= v_debut_semaine) as semaine,
      count(*) filter (where created_at >= v_debut_mois) as mois,
      count(*) as tout
    from public.commandes
    where restaurant_id = p_restaurant_id and statut = 'payee'
  ), p as (
    select
      count(*) filter (where created_at >= v_debut_jour) as jour,
      count(*) filter (where created_at >= v_debut_semaine) as semaine,
      count(*) filter (where created_at >= v_debut_mois) as mois,
      count(*) as tout
    from public.promotions
    where restaurant_id = p_restaurant_id
  )
  select json_build_object(
    'stats', json_build_object(
      'jour', json_build_object('commandes_validees', c.jour, 'promotions', p.jour,
        'montant_du', c.jour * v_prix_cmd + p.jour * v_prix_promo),
      'semaine', json_build_object('commandes_validees', c.semaine, 'promotions', p.semaine,
        'montant_du', c.semaine * v_prix_cmd + p.semaine * v_prix_promo),
      'mois', json_build_object('commandes_validees', c.mois, 'promotions', p.mois,
        'montant_du', c.mois * v_prix_cmd + p.mois * v_prix_promo),
      'tout', json_build_object('commandes_validees', c.tout, 'promotions', p.tout,
        'montant_du', c.tout * v_prix_cmd + p.tout * v_prix_promo)
    ),
    'solde_admin', coalesce(v_solde, 0),
    'parametres', json_build_object('prix_promotion', v_prix_promo, 'prix_par_commande_payee', v_prix_cmd)
  ) into v_res
  from c, p;

  return v_res;
end;
$$;

revoke all on function public.admin_stats_restaurant(text, uuid) from public;
grant execute on function public.admin_stats_restaurant(text, uuid) to anon, authenticated, service_role;