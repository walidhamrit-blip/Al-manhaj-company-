# Guide déploiement — Next.js + PostgreSQL sur Vercel

Boutique **Al Manhaj Company** : Next.js 16 (App Router) + React 19, PostgreSQL
**Neon**, Drizzle ORM, Tailwind CSS 4.

> L'hébergement Cloudflare Pages du dépôt a été **supprimé** : `wrangler.toml` a
> été retiré et ce guide ne décrit plus que Vercel, qui est le seul environnement
> de déploiement. (La raison historique : `@cloudflare/next-on-pages@1` ne
> supporte pas Next.js 16, donc le build Cloudflare échouait systématiquement et
> le site ne se mettait jamais à jour.)

---

## 1. Ce que Vercel détecte tout seul

| Réglage | Valeur |
|---|---|
| Framework | `Next.js` (auto) |
| Build command | `next build` (défaut — **ne rien saisir**) |
| Output directory | **vide** (Ne pas mettre `.next`, encore moins `.vercel/output/static`) |
| Install command | `npm ci` (respecte `package-lock.json`) |

Un `vercel.json` n'est **pas nécessaire** : l'application est dynamique (routes
`/api/*`), donc pas de `output: export`, et Vercel lance `next start` pour toi.

Conseil de stabilité : dans *Settings → General → Node.js Version*, épingle **22.x**
— c'est la version contre laquelle le dépôt est validé. Le même verrouillage peut
se faire dans `package.json` :

```json
"engines": { "node": "22.x" }
```

Le build est vérifiable en local exactement comme Vercel le fait :

```bash
npm ci && npm run typecheck && npm run lint && npm run build
```

---

## 2. Variables d'environnement — le point qui fait tout échouer silencieusement

*Settings → Environment Variables*. Déclare-les pour **Production ET Preview** :
l'oubli classique est la variable présente en Production et absente en Preview,
auquel cas l'aperçu tourne sur une base… inexistante.

| Variable | Rôle |
|---|---|
| `DATABASE_URL` | Chaîne de connexion Neon. **Obligatoire.** |
| `ADMIN_PASSWORD` | Mot de passe du panneau admin. **À définir absolument** : sans lui, `src/app/api/admin/auth/route.ts` retombe sur son repli de développement `admin2026`, connu et documenté dans l'interface elle-même. |
| `ADMIN_SESSION_TOKEN` | Token de session admin. À définir aussi, sinon repli `atelier-admin-session-2026`. |

### Comment savoir si `DATABASE_URL` est bien branchée sur un environnement

Sans la variable, `src/db/index.ts` utilise une URL factice `127.0.0.1` et
**l'application ne plante pas** : `/api/store` renvoie le catalogue de seed, donc
le site a l'air normal mais montre des données périmées (prix, images, stock), et
le panneau admin refuse d'enregistrer.

Le moyen le plus court de le vérifier : **les journaux de la fonction**
(*Deployments → le déploiement concerné → Runtime Logs / Functions*). Si la
variable manque, une ligne y figure :

```
[db] DATABASE_URL is not set for this environment: /api/store silently falls back to the seed catalog…
```

Pas de ligne `[db]` = la base est bien branchée. Second test, visuel : modifie un
prix ou un texte dans l'admin, enregistre, recharge l'onglet. Si la valeur revient,
la persistance fonctionne.

### Côté Neon

1. *Project → Create* → région proche des visiteurs (**Francfort** pour la Libye, pas
   `us-east`).
2. Copie la chaîne du **pooler** (`ep-…-pooler.eu-central-1.aws.neon.tech`), pas la
   connexion directe : le pooler est ce qu'il faut sous serverless, où chaque
   instance ouvre sa propre connexion.
3. Colle-la dans `DATABASE_URL`, en **Production** et **Preview**.

---

## 3. Schéma de base : aucune commande de migration à lancer

Le projet ne versionne pas de migrations (`drizzle-kit` est présent pour l'inspection,
pas pour `push`). C'est `ensureDatabaseSeeded()` dans `src/db/seed.ts` qui applique,
au premier appel API après un déploiement :

- les `CREATE TABLE IF NOT EXISTS` (y compris `orders` et ses index) ;
- les `ALTER TABLE … ADD COLUMN IF NOT EXISTS` de chaque champ apparu depuis
  (`show_on_home`, `parent_slug`, `is_hidden`, la barre légale, `mid_banners`…) ;
- un **backfill** qui ne remplit que les colonnes vides (`NULL`, `undefined`, `""`),
  donc **jamais** les valeurs qu'un administrateur a délibérément effacées.

Conséquence pratique : **déployer suffit**, personne ne tape `npx drizzle-kit push`.
Et si tu ajoutes une colonne, suis ce patron exact — `ALTER TABLE … IF NOT EXISTS`
dans `ensureDatabaseSeeded()`, plus le champ dans `src/db/schema.ts`. Une colonne
susceptible d'être « volontairement vide » se déclare **nullable sans `DEFAULT`**,
pour que le backfill la distingue d'une colonne jamais remplie.

---

## 4. Preview par pull request

Vercel construit une URL de prévisualisation pour **chaque commit de chaque branche**,
et la publie sur la PR. Récupérer cette URL sans ouvrir Vercel :

```bash
gh pr view <numéro> --json headRefOid                  # le SHA déployé
gh pr checks <numéro>                                   # doit être "Vercel  pass"
gh api repos/:owner/:repo/issues/<numéro>/comments \
  --jq '.[].body' | grep -o 'https://[^)]*vercel\.app'  # l'URL publique
```

Circuit de travail utilisé sur ce dépôt : une branche par session → PR → check Vercel
vert sur la preview → relecture → fusion sur `main`, qui déclenche le déploiement de
**production**.

---

## 5. Pièges connus, déjà corrigés ou à surveiller

- **Cold start et connexion à Neon.** `connectionTimeoutMillis` est à **8000 ms** dans
  `src/db/index.ts`. À la valeur précédente (1000 ms), un premier appel qui met plus
  d'une seconde à ouvrir la connexion et négocier TLS faisait échouer la requête, et
  `/api/store` retombait **en silence** sur le seed : store faussement peuplé, zéro
  erreur dans les journaux. Le plafond reste sous les 10 s d'une fonction Hobby pour
  qu'un vrai retard remonte en erreur plutôt qu'en repli. `idleTimeoutMillis` est
  volontairement court (1000 ms) : les instances serverless sont gelées entre les
  requêtes et gardent chacune leur connexion, sans quoi le budget de connexions du
  pooler s'épuise.
- **Images.** `next.config.ts` ne fixe `images.unoptimized` qu'**en développement** ;
  les visuels passent par `StoreImage` (un `<img>` natif), donc l'optimiseur
  d'images Vercel n'est pas sollicité. Les visuels de la boutique sont dans
  `public/images/` (~1,5 Mo au total pour les illustrations de catégories) : si tu
  ajoutes des bannières, vise un ratio large (≈ 1760×420 pour la range entre
  sections) et compresse, sinon l'image LCP de la page d'accueil en prend un coup.
- **Enregistrement de l'admin muet en cas d'échec.** `handleSaveSettings` ne traite
  que `res.ok` : un `PUT` qui échoue (base injoignable, fonction tuquée) ne déclenche
  **aucun message**, ce qui ressemble à une sauvegarde réussie. À corriger si ce
  comportement te gêne en pratique.
- **`DATABASE_URL` en dur dans une variable d'environnement de build** : inutile et
  trompeuse, le build n'a pas besoin de la base (`next build` ne fait que *créer* le
  pool `pg`, jamais se connecter).

---

## 6. Domaine

*Project → Settings → Domains* : ajoute ton domaine, Vercel fournit
les enregistrements DNS à créer chez ton registrar (`A` `76.76.21.21` ou `CNAME`
`cname.vercel-dns.com`) et gère le certificat tout seul.

Tu peux garder **Cloudflare uniquement comme DNS/CDN devant Vercel** : chez le registrar,
les nameservers Cloudflare, puis dans Cloudflare un enregistrement `CNAME` (proxy actif)
vers le domaine Vercel, et *SSL/TLS → Full (strict)*. Le calcul ne se fait alors plus
chez Cloudflare, seulement le cache et la protection.

---

## 7. Après un déploiement

- La page d'accueil, les filtres de catalogue et le panneau admin interrogent la **même**
  base : si la preview affiche le même catalogue que la production, c'est bon signe ;
  si l'un des deux n'affiche que le seed, reviens au point 2.
- Suivi des commandes : la table `orders` et ses index sont créés au premier appel API,
  `DATABASE_URL` doit donc être configurée pour activer la persistance du suivi.
- Le client consulte **Suivre ma commande** avec la référence générée au panier et le
  numéro de téléphone saisi ; l'équipe ajuste le statut depuis **Admin → Commandes**
  (à confirmer, confirmée, préparation, en livraison, livrée, annulée).

Les variables optionnelles sont également documentées dans `env.example`.
