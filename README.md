# Mon Store Arena - Next.js + PostgreSQL, déployé sur Vercel

## Déploiement en 3 étapes
1. Importe le dépôt sur Vercel : framework `Next.js` détecté automatiquement, build par défaut, **laisse l'output directory vide**.
2. Déclare `DATABASE_URL` (Neon) en **Production _et_ Preview** — sinon l'aperçu tourne sur le catalogue de seed sans rien te dire.
3. Définis aussi `ADMIN_PASSWORD` et `ADMIN_SESSION_TOKEN` : en leur absence le panneau admin retombe sur son mot de passe de développement.

Voir `GUIDE_DEPLOIEMENT_VERCEL.md` pour le détail, les contrôles à faire après un déploiement et les pièges connus (cold start Neon, enregistrement muet, domaine).

## Suivi des commandes
- À la validation du panier, le site enregistre la commande dans PostgreSQL puis ouvre WhatsApp avec sa référence de suivi.
- Le client consulte **Suivre ma commande** avec cette référence et le numéro de téléphone saisi au panier.
- Depuis **Admin → Commandes**, l’équipe filtre les demandes, ouvre le détail et met à jour leur statut (à confirmer, confirmée, préparation, en livraison, livrée ou annulée).
- La table `orders` et ses index sont créés automatiquement au premier appel API. La variable `DATABASE_URL` doit donc être configurée pour activer le suivi persistant.
- Sur Vercel, vérifie que `DATABASE_URL` est disponible dans **Preview** et **Production** (l’intégration Neon peut déjà l’avoir créée).

Les variables d’administration optionnelles sont documentées dans `env.example`.
