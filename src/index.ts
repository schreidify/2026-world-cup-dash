import { handleApi } from "./api/router";
import { runHourlySync } from "./sync/sync";

export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  APIFOOTBALL_KEY: string;
  TEST_MIGRATIONS?: unknown;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) {
      return handleApi(request, env);
    }
    return env.ASSETS.fetch(request);
  },

  async scheduled(_event: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(runHourlySync(env));
  },
};
