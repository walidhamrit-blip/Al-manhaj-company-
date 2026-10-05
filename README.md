# Mon Store Arena - Prêt pour Github + Cloudflare

## Déploiement en 3 étapes
1. `git init && git add . && git commit -m "init" && git push`
2. Sur Cloudflare Pages > Connect to Git > Build: `npm run build` | Output: `.next`
3. Ajouter la variable `DATABASE_URL` dans Cloudflare > Settings > Environment variables

Voir GUIDE_DEPLOIEMENT_GITHUB_CLOUDFLARE.md pour le détail.

## Suivi des commandes
- À la validation du panier, le site enregistre la commande dans PostgreSQL puis ouvre WhatsApp avec sa référence de suivi.
- Le client consulte **Suivre ma commande** avec cette référence et le numéro de téléphone saisi au panier.
- Depuis **Admin → Commandes**, l’équipe filtre les demandes, ouvre le détail et met à jour leur statut (à confirmer, confirmée, préparation, en livraison, livrée ou annulée).
- La table `orders` et ses index sont créés automatiquement au premier appel API. La variable `DATABASE_URL` doit donc être configurée pour activer le suivi persistant.
- Sur Vercel, vérifie que `DATABASE_URL` est disponible dans **Preview** et **Production** (l’intégration Neon peut déjà l’avoir créée).

Les variables d’administration optionnelles sont documentées dans `env.example`.
