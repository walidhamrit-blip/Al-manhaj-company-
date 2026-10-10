import { healthResponse } from "@/lib/health";

export const dynamic = "force-dynamic";

/**
 * Database probe.
 *
 * Returns `200 {"ok":true,...}` when `select 1` succeeds and `503`
 * `{"ok":false,...}` when it does not. Append `?detail` to include the failure
 * reason with credentials scrubbed.
 *
 * Every response carries `Cache-Control: no-store` so no edge can freeze a
 * verdict in place — see the redirect in `../route.ts` for why that matters.
 */
export async function GET(request: Request) {
  return healthResponse(request.url);
}
