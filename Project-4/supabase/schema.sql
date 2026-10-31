-- ============================================================================
--  « On bouffe où ? » : schéma Supabase
--  À exécuter UNE FOIS dans Supabase → SQL Editor → New query → Run.
--  Peut être relancé sans danger (mises à jour des fonctions et des règles).
--
--  Sécurité : aucun accès direct en écriture aux tables. Toutes les actions passent
--  par les fonctions ci-dessous, qui vérifient qui appelle (auth.uid()) et ce qu'il a le droit de faire.
--  Chaque téléphone obtient un identifiant anonyme (Authentication → Sign In / Providers → Anonymous).
-- ============================================================================

-- ------------------------------------------------------------------ tables

create table if not exists public.groups (
  code               text primary key check (code ~ '^[0-9]{4}$'),
  host_id            uuid not null,
  location           jsonb not null,
  budget             text not null check (budget in ('lt10', '10-20', '20-30', 'gt30')),
  cuisines           text[] not null default '{}',
  -- Liste de restos figée par le premier qui la charge : les votes s'y réfèrent par identifiant.
  restaurants        jsonb,
  restaurants_source text check (restaurants_source in ('google', 'demo')),
  status             text not null default 'lobby' check (status in ('lobby', 'swiping')),
  -- Dernier resto approuvé par tous les membres.
  match_id           text,
  created_at         timestamptz not null default now(),
  expires_at         timestamptz not null default now() + interval '24 hours'
);

create table if not exists public.members (
  id          uuid primary key default gen_random_uuid(),
  group_code  text not null references public.groups (code) on delete cascade,
  user_id     uuid not null,
  name        text not null check (char_length(name) between 1 and 20),
  emoji       text not null check (char_length(emoji) between 1 and 8),
  is_host     boolean not null default false,
  voted_count int not null default 0,
  joined_at   timestamptz not null default now(),
  unique (group_code, user_id)
);

create table if not exists public.votes (
  group_code    text not null references public.groups (code) on delete cascade,
  user_id       uuid not null,
  restaurant_id text not null,
  liked         boolean not null,
  created_at    timestamptz not null default now(),
  primary key (group_code, user_id, restaurant_id)
);

create index if not exists members_user_idx on public.members (user_id);
create index if not exists groups_expires_idx on public.groups (expires_at);

-- ------------------------------------------------- règles d'accès (RLS)

alter table public.groups  enable row level security;
alter table public.members enable row level security;
alter table public.votes   enable row level security;

-- Lecture seule, et uniquement pour les membres du groupe. `security definer` évite
-- que la règle sur `members` s'appelle elle-même en boucle.
create or replace function public.is_member(p_code text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.members m where m.group_code = p_code and m.user_id = auth.uid()
  );
$$;

drop policy if exists groups_select  on public.groups;
drop policy if exists members_select on public.members;
drop policy if exists votes_select   on public.votes;

create policy groups_select  on public.groups  for select to authenticated using (public.is_member(code));
create policy members_select on public.members for select to authenticated using (public.is_member(group_code));
-- Chacun ne voit que ses propres votes ; le match est calculé côté serveur.
create policy votes_select   on public.votes   for select to authenticated using (user_id = auth.uid());

-- Aucune écriture directe, même pour un utilisateur connecté.
revoke all on public.groups, public.members, public.votes from anon, authenticated;
grant select on public.groups, public.members, public.votes to authenticated;

-- ---------------------------------------------------------------- fonctions

-- Crée un groupe et inscrit son créateur comme hôte. Renvoie le code à 4 chiffres.
create or replace function public.create_group(
  p_location jsonb,
  p_budget   text,
  p_cuisines text[],
  p_name     text,
  p_emoji    text
)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid  uuid := auth.uid();
  v_code text;
  v_try  int := 0;
  v_name text := btrim(coalesce(p_name, ''));
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  if p_budget is null or p_budget not in ('lt10', '10-20', '20-30', 'gt30') then raise exception 'bad_budget'; end if;
  if coalesce(array_length(p_cuisines, 1), 0) > 12 then raise exception 'bad_cuisines'; end if;
  if p_location is null or jsonb_typeof(p_location) <> 'object' or pg_column_size(p_location) > 2000 then
    raise exception 'bad_location';
  end if;
  if char_length(v_name) not between 1 and 20 then raise exception 'bad_name'; end if;

  -- Ménage des groupes expirés, et plafond de groupes actifs par personne.
  delete from public.groups where expires_at < now();
  if (select count(*) from public.groups where host_id = v_uid) >= 5 then raise exception 'too_many_groups'; end if;

  loop
    v_code := (1000 + floor(random() * 9000))::int::text;
    begin
      insert into public.groups (code, host_id, location, budget, cuisines)
      values (v_code, v_uid, p_location, p_budget, coalesce(p_cuisines, '{}'));
      exit;
    exception when unique_violation then
      v_try := v_try + 1;
      if v_try > 50 then raise exception 'no_code_available'; end if;
    end;
  end loop;

  insert into public.members (group_code, user_id, name, emoji, is_host)
  values (v_code, v_uid, v_name, p_emoji, true);

  return v_code;
end;
$$;

-- Rejoint un groupe encore dans le salon d'attente. Rejouable sans effet (met juste le prénom à jour).
create or replace function public.join_group(p_code text, p_name text, p_emoji text)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid  uuid := auth.uid();
  g      public.groups;
  v_name text := btrim(coalesce(p_name, ''));
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  if char_length(v_name) not between 1 and 20 then raise exception 'bad_name'; end if;

  select * into g from public.groups where code = p_code and expires_at > now();
  if not found then raise exception 'group_not_found'; end if;

  if exists (select 1 from public.members where group_code = p_code and user_id = v_uid) then
    update public.members set name = v_name, emoji = p_emoji where group_code = p_code and user_id = v_uid;
    return p_code;
  end if;

  if g.status <> 'lobby' then raise exception 'already_started'; end if;
  if (select count(*) from public.members where group_code = p_code) >= 12 then raise exception 'group_full'; end if;

  insert into public.members (group_code, user_id, name, emoji) values (p_code, v_uid, v_name, p_emoji);
  return p_code;
end;
$$;

-- Enregistre la liste de restos du groupe. Le premier arrivé gagne : un second appel ne l'écrase pas.
create or replace function public.set_restaurants(p_code text, p_restaurants jsonb, p_source text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_member(p_code) then raise exception 'not_a_member'; end if;
  if p_source is null or p_source not in ('google', 'demo') then raise exception 'bad_source'; end if;
  if p_restaurants is null or jsonb_typeof(p_restaurants) <> 'array'
     or jsonb_array_length(p_restaurants) not between 1 and 30
     or pg_column_size(p_restaurants) > 200000 then
    raise exception 'bad_restaurants';
  end if;

  update public.groups
     set restaurants = p_restaurants, restaurants_source = p_source
   where code = p_code and restaurants is null and expires_at > now();
end;
$$;

-- L'hôte lance le swipe : plus personne ne peut rejoindre ensuite.
create or replace function public.start_swiping(p_code text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  g public.groups;
begin
  select * into g from public.groups where code = p_code and expires_at > now() for update;
  if not found then raise exception 'group_not_found'; end if;
  if g.host_id <> auth.uid() then raise exception 'not_host'; end if;
  if g.restaurants is null then raise exception 'no_restaurants'; end if;
  update public.groups set status = 'swiping' where code = p_code;
end;
$$;

-- Enregistre un vote (modifiable) et détecte le match : tous les membres ont dit oui au même resto.
create or replace function public.cast_vote(p_code text, p_restaurant_id text, p_liked boolean)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  g     public.groups;
  v_members int;
  v_likes   int;
begin
  -- Verrou sur le groupe : deux votes simultanés sont traités l'un après l'autre,
  -- sinon deux « oui » en même temps pourraient chacun ne pas voir celui de l'autre.
  select * into g from public.groups where code = p_code and expires_at > now() for update;
  if not found then raise exception 'group_not_found'; end if;
  if not exists (select 1 from public.members where group_code = p_code and user_id = v_uid) then
    raise exception 'not_a_member';
  end if;
  if g.status <> 'swiping' then raise exception 'not_started'; end if;
  if p_liked is null or not exists (
    select 1 from jsonb_array_elements(g.restaurants) e where e ->> 'id' = p_restaurant_id
  ) then
    raise exception 'bad_restaurant';
  end if;

  insert into public.votes (group_code, user_id, restaurant_id, liked)
  values (p_code, v_uid, p_restaurant_id, p_liked)
  on conflict (group_code, user_id, restaurant_id) do update set liked = excluded.liked, created_at = now();

  update public.members
     set voted_count = (select count(*) from public.votes where group_code = p_code and user_id = v_uid)
   where group_code = p_code and user_id = v_uid;

  if p_liked then
    select count(*) into v_members from public.members where group_code = p_code;
    select count(*) into v_likes from public.votes
     where group_code = p_code and restaurant_id = p_restaurant_id and liked;
    if v_likes = v_members then
      update public.groups set match_id = p_restaurant_id where code = p_code;
    end if;
  end if;
end;
$$;

-- L'hôte efface tous les votes et le match pour recommencer.
create or replace function public.reset_group(p_code text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  g public.groups;
begin
  select * into g from public.groups where code = p_code and expires_at > now() for update;
  if not found then raise exception 'group_not_found'; end if;
  if g.host_id <> auth.uid() then raise exception 'not_host'; end if;
  delete from public.votes where group_code = p_code;
  update public.members set voted_count = 0 where group_code = p_code;
  update public.groups set match_id = null where code = p_code;
end;
$$;

-- Seuls les utilisateurs connectés (y compris anonymes) peuvent appeler ces fonctions.
revoke all on function public.create_group(jsonb, text, text[], text, text) from public, anon;
revoke all on function public.join_group(text, text, text) from public, anon;
revoke all on function public.set_restaurants(text, jsonb, text) from public, anon;
revoke all on function public.start_swiping(text) from public, anon;
revoke all on function public.cast_vote(text, text, boolean) from public, anon;
revoke all on function public.reset_group(text) from public, anon;
grant execute on function public.create_group(jsonb, text, text[], text, text) to authenticated;
grant execute on function public.join_group(text, text, text) to authenticated;
grant execute on function public.set_restaurants(text, jsonb, text) to authenticated;
grant execute on function public.start_swiping(text) to authenticated;
grant execute on function public.cast_vote(text, text, boolean) to authenticated;
grant execute on function public.reset_group(text) to authenticated;

-- ------------------------------------------------------------- temps réel
-- Les téléphones reçoivent en direct les changements du groupe (match, statut) et des membres (arrivées, progression).
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'groups') then
      alter publication supabase_realtime add table public.groups;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'members') then
      alter publication supabase_realtime add table public.members;
    end if;
  end if;
end
$$;
