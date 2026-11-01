import type { JsonLdObject } from "@/lib/seo";

/**
 * Injecte un bloc JSON-LD dans une page rendue côté serveur.
 *
 * `JSON.stringify` échappe les `<` : un titre produit contenant `</script>`
 * (ou un `<`) ne peut donc pas fermer la balise et casser la page — c'est le
 * seul risque réel de `dangerouslySetInnerHTML` avec des données issues de la
 * base.
 */
export function JsonLd({ data }: { data: JsonLdObject | JsonLdObject[] }) {
  const payload = Array.isArray(data)
    ? { "@context": "https://schema.org", "@graph": data.map(stripContext) }
    : data;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(payload).replace(/</g, "\\u003c"),
      }}
    />
  );
}

/** Un `@graph` ne doit pas répéter `@context` sur chaque nœud. */
function stripContext(node: JsonLdObject): JsonLdObject {
  const { "@context": _ignored, ...rest } = node;
  void _ignored;
  return rest;
}
