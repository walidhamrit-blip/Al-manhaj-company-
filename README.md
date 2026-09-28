# Mon Store Arena - Prêt pour Github + Cloudflare

## Déploiement en 3 étapes
1. `git init && git add . && git commit -m "init" && git push`
2. Sur Cloudflare Pages > Connect to Git > Build: `npm run build` | Output: `.next`
3. Ajouter la variable `DATABASE_URL` dans Cloudflare > Settings > Environment variables

Voir GUIDE_DEPLOIEMENT_GITHUB_CLOUDFLARE.md pour le détail. 
