import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * `robots.txt` — un seul fichier, deux publics.
 *
 * 1. **Moteurs de recherche classiques** : tout est ouvert sauf `/api/`
 *    (endpoints JSON sans contenu indexable) et `/admin` au cas où une route
 *    d'administration apparaîtrait plus tard.
 * 2. **Robots des moteurs génératifs** : GPTBot, OAI-SearchBot, ChatGPT-User,
 *    ClaudeBot, Claude-Web, PerplexityBot, Google-Extended, Applebot-Extended,
 *    CCBot, Bingbot. La stratégie GEO retenue est l'**ouverture** : le site est
 *    une boutique de quartier qui gagne à être citée par les assistants, et les
 *    pages produit sont rendues côté serveur (donc lisibles sans JavaScript).
 *    Un blocage ici reviendrait à disparaître des réponses IA.
 *
 * Le sitemap est déclaré en absolu, comme l'exige la spécification.
 */
export default function robots(): MetadataRoute.Robots {
  const shared = {
    disallow: ["/api/", "/admin"],
  };

  const aiAgents = [
    "GPTBot",
    "OAI-SearchBot",
    "ChatGPT-User",
    "ClaudeBot",
    "Claude-Web",
    "anthropic-ai",
    "PerplexityBot",
    "Perplexity-User",
    "Google-Extended",
    "Applebot-Extended",
    "CCBot",
    "Bingbot",
    "DuckDuckBot",
    "YandexBot",
  ];

  return {
    rules: [
      { userAgent: "*", allow: "/", ...shared },
      ...aiAgents.map((userAgent) => ({ userAgent, allow: "/", ...shared })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
