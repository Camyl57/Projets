// Teste le schéma Supabase (RLS + fonctions) sur un vrai Postgres (PGlite) avec un faux « auth.uid() ».
// Lancer : npm run test:db
import { PGlite } from '@electric-sql/pglite';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const schema = fs.readFileSync(fileURLToPath(new URL('../schema.sql', import.meta.url)), 'utf8');
const db = new PGlite();

// --- Ce que Supabase fournit d'office
await db.exec(`
  create role anon nologin; create role authenticated nologin;
  grant usage on schema public to anon, authenticated;
  create schema auth;
  create function auth.uid() returns uuid language sql stable
    as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema auth to anon, authenticated;
  create publication supabase_realtime;
`);

let pass = 0, fail = 0;
const ok = (cond, label) => { if (cond) pass++; else fail++; console.log((cond ? '  ✓ ' : '  ✗ ') + label); };
const U = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const as = async (n) => { await db.exec(`reset role; select set_config('request.jwt.claim.sub', '${n ? U(n) : ''}', false); set role authenticated;`); };
const admin = async () => db.exec('reset role');
const q = async (sql, params) => (await db.query(sql, params)).rows;
const fails = async (fn, expected) => { try { await fn(); return false; } catch (e) { return expected ? String(e.message).includes(expected) : true; } };
const loc = JSON.stringify({ label: 'Troyes', source: 'manual', coords: { lat: 48.3, lng: 4.07 } });
const create = (name = 'Camyl') => q('select public.create_group($1::jsonb, $2, $3::text[], $4, $5) as code', [loc, '10-20', ['burger', 'sushi'], name, '🦊']);
const RESTOS = JSON.stringify([{ id: 'r1', name: 'A' }, { id: 'r2', name: 'B' }, { id: 'r3', name: 'C' }]);

console.log('Application du schéma (1re fois puis 2e fois pour vérifier qu\'il est rejouable)…');
await db.exec(schema); await db.exec(schema); ok(true, 'schéma appliqué deux fois sans erreur');
ok((await q("select count(*)::int n from pg_publication_tables where pubname='supabase_realtime'"))[0].n === 2, 'groups et members sont publiés pour le temps réel');

console.log('\n1. Création');
await as(0); ok(await fails(() => create(), 'not_authenticated'), 'refusé sans identité');
await as(1);
const code = (await create())[0].code;
ok(/^[0-9]{4}$/.test(code) && Number(code) >= 1000, `code à 4 chiffres généré (${code})`);
ok((await q('select count(*)::int n from members where group_code=$1', [code]))[0].n === 1, "l'hôte est inscrit comme membre");
ok((await q('select is_host from members where group_code=$1', [code]))[0].is_host === true, "il est marqué hôte");
ok(await fails(() => q("select public.create_group($1::jsonb,'gratuit','{}','x','🦊')", [loc]), 'bad_budget'), 'budget invalide refusé');
ok(await fails(() => q("select public.create_group($1::jsonb,'10-20','{}','','🦊')", [loc]), 'bad_name'), 'prénom vide refusé');
ok(await fails(() => q("select public.create_group('[]'::jsonb,'10-20','{}','x','🦊')"), 'bad_location'), 'localisation non-objet refusée');

console.log('\n2. Confidentialité');
await as(2); ok((await q('select * from groups')).length === 0, "un inconnu ne voit aucun groupe");
ok((await q('select * from members')).length === 0, "ni aucun membre");
ok(await fails(() => q("insert into groups(code,host_id,location,budget) values ('9999',$1,'{}','10-20')", [U(2)])), "écriture directe dans groups refusée");
await as(1); ok(await fails(() => q("update members set voted_count=99 where group_code=$1", [code])), "écriture directe dans members refusée");
ok(await fails(() => q("insert into votes values ($1,$2,'r1',true)", [code, U(1)])), "écriture directe dans votes refusée");
await db.exec('reset role; set role anon;'); ok(await fails(() => q('select * from groups'), 'permission denied'), "visiteur non connecté (rôle anon) : accès aux tables refusé"); ok(await fails(() => q("select public.create_group('{}'::jsonb,'10-20','{}','x','🦊')"), 'permission denied'), 'et fonctions refusées');

console.log('\n3. Rejoindre');
await as(2); ok((await q('select public.join_group($1,$2,$3) as c', [code, 'Lina', '🐻']))[0].c === code, 'un inconnu rejoint avec le code');
ok((await q('select * from groups')).length === 1, 'il voit maintenant le groupe');
ok((await q('select * from members')).length === 2, 'et les 2 membres');
await q('select public.join_group($1,$2,$3)', [code, 'Lina2', '🐼']); ok((await q("select count(*)::int n from members where group_code=$1", [code]))[0].n === 2 && (await q("select name from members where user_id=$1", [U(2)]))[0].name === 'Lina2', 'rejoindre deux fois ne duplique pas (met le prénom à jour)');
ok(await fails(() => q("select public.join_group('0000','x','🦊')"), 'group_not_found'), 'code inconnu refusé');
for (let i = 3; i <= 12; i++) { await as(i); await q('select public.join_group($1,$2,$3)', [code, 'Ami' + i, '🐸']); }
await as(13); ok(await fails(() => q('select public.join_group($1,$2,$3)', [code, 'Trop', '🐸']), 'group_full'), 'le 13e membre est refusé (limite 12)');

console.log('\n4. Liste de restos');
await as(5); ok(await fails(() => q("select public.set_restaurants($1,'[]'::jsonb,'google')", [code]), 'bad_restaurants'), 'liste vide refusée');
ok(await fails(() => q("select public.set_restaurants($1,$2::jsonb,'osm')", [code, RESTOS]), 'bad_source'), 'source inconnue refusée');
await as(14); ok(await fails(() => q("select public.set_restaurants($1,$2::jsonb,'google')", [code, RESTOS]), 'not_a_member'), 'un non-membre ne peut pas écrire la liste');
await as(5); await q("select public.set_restaurants($1,$2::jsonb,'google')", [code, RESTOS]);
await as(6); await q("select public.set_restaurants($1,$2::jsonb,'demo')", [code, JSON.stringify([{ id: 'zzz' }])]);
ok((await q('select restaurants_source s, jsonb_array_length(restaurants) n from groups where code=$1', [code]))[0].s === 'google', 'le premier arrivé gagne : un 2e appel ne remplace pas la liste');

console.log('\n5. Lancement');
await as(1); ok(await fails(() => q('select public.cast_vote($1,$2,true)', [code, 'r1']), 'not_started'), 'on ne peut pas voter avant le lancement');
await as(2); ok(await fails(() => q('select public.start_swiping($1)', [code]), 'not_host'), "seul l'hôte lance");
await as(1);
const code2 = (await create('Solo'))[0].code;
ok(await fails(() => q('select public.start_swiping($1)', [code2]), 'no_restaurants'), 'impossible de lancer sans liste de restos');
await q('select public.start_swiping($1)', [code]);
ok((await q('select status from groups where code=$1', [code]))[0].status === 'swiping', "l'hôte lance le swipe");
await as(20); ok(await fails(() => q('select public.join_group($1,$2,$3)', [code, 'Tard', '🐸']), 'already_started'), 'plus personne ne peut rejoindre après le lancement');
await as(2); ok((await q('select public.join_group($1,$2,$3) as c', [code, 'Lina', '🐻']))[0].c === code, 'mais un membre existant peut se reconnecter');

console.log('\n6. Votes et match (groupe de 12, on garde 3 votants pour lisibilité en retirant les autres)');
await admin(); await db.query("delete from members where group_code=$1 and user_id not in ($2,$3,$4)", [code, U(1), U(2), U(3)]);
await as(1); ok(await fails(() => q("select public.cast_vote($1,'inconnu',true)", [code]), 'bad_restaurant'), 'resto inexistant refusé');
await as(14); ok(await fails(() => q("select public.cast_vote($1,'r1',true)", [code]), 'not_a_member'), 'non-membre ne vote pas');
await as(1); await q("select public.cast_vote($1,'r1',true)", [code]);
await as(2); await q("select public.cast_vote($1,'r1',true)", [code]);
ok((await q('select match_id m from groups where code=$1', [code]))[0].m === null, 'pas de match à 2 « oui » sur 3');
await as(3); await q("select public.cast_vote($1,'r2',false)", [code]);
ok((await q('select match_id m from groups where code=$1', [code]))[0].m === null, 'un « non » ne crée pas de match');
await q("select public.cast_vote($1,'r1',true)", [code]);
ok((await q('select match_id m from groups where code=$1', [code]))[0].m === 'r1', 'le 3e « oui » déclenche le match sur r1');
ok((await q('select user_id from votes')).every(v => v.user_id === U(3)), 'chacun ne voit que ses propres votes');
await as(1); ok((await q("select voted_count c from members where user_id=$1", [U(1)]))[0].c === 1, 'compteur de votes à jour');
await q("select public.cast_vote($1,'r1',true)", [code]); ok((await q("select voted_count c from members where user_id=$1", [U(1)]))[0].c === 1, 'revoter ne double pas le compteur');
ok((await q('select user_id, voted_count from members where group_code=$1 order by voted_count desc', [code])).length === 3, 'la progression des 3 membres est visible pour chacun');
// changer d'avis : r2 → tous oui
await q("select public.cast_vote($1,'r2',true)", [code]); await as(2); await q("select public.cast_vote($1,'r2',true)", [code]); await as(3); await q("select public.cast_vote($1,'r2',true)", [code]);
ok((await q('select match_id m from groups where code=$1', [code]))[0].m === 'r2', 'changer son vote en « oui » peut créer un nouveau match (r2)');

console.log('\n7. Recommencer');
await as(2); ok(await fails(() => q('select public.reset_group($1)', [code]), 'not_host'), "seul l'hôte recommence");
await as(1); await q('select public.reset_group($1)', [code]);
await admin();
ok((await q('select count(*)::int n from votes')).length && (await q('select count(*)::int n from votes'))[0].n === 0, 'tous les votes sont effacés');
ok((await q('select match_id m from groups where code=$1', [code]))[0].m === null && (await q('select sum(voted_count)::int s from members'))[0].s === 0, 'match et compteurs remis à zéro');

console.log('\n8. Expiration et limites');
await db.query("update groups set expires_at = now() - interval '1 minute' where code=$1", [code]);
await as(30); ok(await fails(() => q('select public.join_group($1,$2,$3)', [code, 'x', '🐸']), 'group_not_found'), 'un groupe expiré ne peut plus être rejoint');
await as(1); await q("select public.create_group($1::jsonb,'10-20','{}','Hote','🦊')", [loc]);
ok((await q('select count(*)::int n from groups where code=$1', [code]))[0].n === 0 || true, 'groupes expirés supprimés à la prochaine création');
await admin(); ok((await q('select count(*)::int n from groups where code=$1', [code]))[0].n === 0, '→ confirmé : le groupe expiré a bien été supprimé (et ses membres/votes avec)');
await as(40); for (let i = 0; i < 5; i++) await create('H' + i);
ok(await fails(() => create('H6'), 'too_many_groups'), 'plafond de 5 groupes actifs par personne');

console.log(`\nRésultat : ${pass} réussis, ${fail} échoués`);
process.exit(fail ? 1 : 0);
