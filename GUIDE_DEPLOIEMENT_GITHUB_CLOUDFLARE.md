# Guide Déploiement Store Arena - Next.js + PostgreSQL vers Github + Cloudflare

## 🚨 ÉTAT ACTUEL DU DÉPLOIEMENT (à lire en premier)

Le projet Cloudflare Pages lié à ce dépôt **échoue à chaque build** : le check
« Cloudflare Pages » est en échec sur `main` et sur toutes les pull requests
(le rapport GitHub indique `Status: 🚫 Build failed`).

**Pourquoi :** le projet Cloudflare est configuré avec la chaîne documentée plus
bas (`npx @cloudflare/next-on-pages@1` → `.vercel/output/static`), or
`@cloudflare/next-on-pages` ne supporte pas **Next.js 16** (utilisé par ce
dépôt, `next@16.4.0`) et l'adaptateur n'est pas installé dans `package.json`.
**Conséquence :** le site Cloudflare ne se met jamais à jour — il affiche
l'ancienne version du store, même quand `main` contient des correctifs.

**Vercel, en revanche, build correctement** (`Vercel` = pass sur chaque commit) :
c'est aujourd'hui le seul déploiement à jour.

### Deux options

**Option A — garder Vercel comme seul déploiement (recommandé, 2 min)**
1. Cloudflare dashboard > Workers & Pages > `al-manhaj-company` > Settings >
   *Builds & deployments* : désactivez le déploiement automatique du dépôt
   (ou supprimez le projet), pour ne plus avoir de check en échec.
2. Vérifiez sur Vercel que la variable `DATABASE_URL` (Neon) est bien définie en
   Production **et** en Preview, puis redéployez `main`.

**Option B — rester sur Cloudflare (migration à faire)**
`@opennextjs/cloudflare` supporte Next.js 16 (`peerDependencies: next >=16.3.8`) :
1. `npm i -D @opennextjs/cloudflare wrangler` + `open-next.config.ts`,
   `wrangler.jsonc` avec `main = ".open-next/worker.js"` et
   `compatibility_flags = ["nodejs_compat"]`.
2. Passer le projet Cloudflare en **Worker** (et non Pages) avec la commande
   `npx opennextjs-cloudflare build && npx opennextjs-cloudflare deploy`.
3. La base `pg` (node-postgres) ne peut pas ouvrir de connexion TCP telle quelle
   depuis un Worker : il faut **Hyperdrive** (pooler Cloudflare) et utiliser sa
   chaîne de connexion comme `DATABASE_URL` (ou le driver Neon HTTP).
Tant que ces 3 points ne sont pas faits côté dashboard, gardez l'option A.

---

## ⚠️ DIAGNOSTIC DE TON PROJET

Ton `package.json` indique :
- **Next.js 16.2.6** (React 19)
- **PostgreSQL + Drizzle ORM** (`pg`, `drizzle-orm`)
- **Tailwind CSS 4**

**Fichiers que tu as envoyé :** 6 fichiers de config seulement
**Fichiers MANQUANTS pour déployer :** Le dossier `src/` complet

```
src/
 ├── app/ (ou pages/) -> tes pages boutique
 ├── components/ -> composants
 ├── db/schema.ts -> ta base de données
 └── ... 
next.config.mjs
.env
```

**=> Sans le dossier `src`, le build va échouer sur Cloudflare.**

---

## CE QUE TU DOIS FAIRE MAINTENANT

### Option 1 : Tu as le projet complet sur ton PC
Fais un ZIP de **TOUT** le dossier (pas seulement les configs) et glisse-le ici dans le workspace. Je le déploie pour toi immédiatement.

### Option 2 : Tu n'as que ce que tu as envoyé
Je peux te reconstruire un store complet prêt à déployer à partir de ces configs. Dis-moi juste ce que tu vends.

---

## PROCÉDURE COMPLÈTE UNE FOIS LE PROJET COMPLET ICI

### ETAPE 1 : Préparer pour Cloudflare (1 fois)

Ton projet actuel pointe vers une base locale qui ne marchera pas en ligne :
```json
// drizzle.config.json actuel -> ne marchera pas sur Cloudflare
"url": "postgresql://postgres:postgres@127.0.0.1:5432/app_db"
```

**1. Créer une base PostgreSQL gratuite en ligne (2 min) :**
- Va sur https://neon.tech (ou https://supabase.com)
- Crée un compte > New Project > Copie l'URL `DATABASE_URL` qui ressemble à :
  `postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require`

**2. Adapter ton projet pour Cloudflare :**

Je vais créer les 2 fichiers nécessaires :

**a) `next.config.mjs` manquant :**
```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Important pour Cloudflare
  images: { unoptimized: true },
};
export default nextConfig;
```

**b) Installer l'adaptateur Cloudflare :**
```bash
npm install -D @cloudflare/next-on-pages
```
Et changer le build dans `package.json` :
```json
"scripts": {
  "build": "next-on-pages"
}
```

### ETAPE 2 : Pousser sur Github

Dans le terminal du workspace :

```bash
git init
git add .
git commit -m "store arena pret pour cloudflare"
git branch -M main
# Crée d'abord un repo vide sur github.com (ex: mon-store-arena)
git remote add origin https://github.com/TON_USERNAME/mon-store-arena.git
git push -u origin main
```

Astuce sans terminal : Sur github.com > New repository > Upload files > glisse tout ton dossier > Commit.

### ETAPE 3 : Déployer sur Cloudflare Pages

1. Va sur https://dash.cloudflare.com > **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**
2. Autorise Github et choisis ton repo `mon-store-arena`
3. Paramètres de build :
   - **Framework preset:** `Next.js`
   - **Build command:** `npx @cloudflare/next-on-pages@1`
   - **Build output directory:** `.vercel/output/static`
   - **Node version:** `20`

4. **VARIABLES D'ENVIRONNEMENT (CRITIQUE pour ton store) :**
   Avant de cliquer sur Deploy, va dans `Settings` > `Environment variables` > `Add variable` :
   ```
   DATABASE_URL = postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require
   ```
   Ajoute aussi toutes les variables de ton fichier `.env` (ex: STRIPE_SECRET_KEY, etc.)

5. Clique sur `Save and Deploy`

En 2-3 minutes tu auras : `https://mon-store-arena.pages.dev`

### ETAPE 4 : Domaine personnalisé

Dans ton projet Cloudflare Pages > `Custom domains` > `Set up a custom domain` > entre `www.taboutique.com`

Si ton domaine est chez Cloudflare : automatique.
Sinon : ajoute le CNAME que Cloudflare te donne chez ton registrar (GoDaddy, Namecheap...).

### ETAPE 5 : Mises à jour automatiques

Dès que tu modifies ton store :
```bash
git add .
git commit -m "ajout produit"
git push
```
-> Cloudflare redéploie tout seul en 30s.

---

## ALTERNATIVE PLUS SIMPLE SI TU VEUX ÉVITER CLOUDFLARE

Pour un projet **Next.js + PostgreSQL**, **Vercel** est 10x plus simple (créé par les créateurs de Next.js) :

1. Va sur vercel.com > Add New Project > Import ton repo Github
2. Ajoute la même variable `DATABASE_URL`
3. Deploy -> C'est en ligne.

Tu peux quand même mettre ton domaine derrière Cloudflare (CDN) après.

---

## QUE VEUX-TU QUE JE FASSE MAINTENANT ?

1. **Envoie le ZIP complet** (avec le dossier `src`) en le glissant ici
2. **OU dis-moi** "Reconstruis mon store" + ton type de produits (ex: boutique de vetements streetwear) et je te génère un projet complet déployable immédiatement

Dès que j'ai le `src/`, je te fais le `git push` et la config Cloudflare complète ici.
