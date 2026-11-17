import { PRIMARY_SOURCE, type Env } from "./config";
import { collectReadings, countVisit, latestReading, loadStats } from "./db";
import { renderHome } from "./pages/home";
import { renderStats } from "./pages/stats";
import { handleVote } from "./vote";

export default {
  async fetch(request, env, ctx): Promise<Response> {
    const { pathname } = new URL(request.url);
    const route = `${request.method} ${pathname}`;

    if (route === "GET /") {
      // A contagem roda depois da resposta e não atrasa nem derruba a página.
      ctx.waitUntil(countVisit(env).catch((e) => console.error("falha ao contar acesso:", e)));
      const reading = await latestReading(env, PRIMARY_SOURCE);
      return renderHome(reading, Math.floor(Date.now() / 1000));
    }
    if (route === "POST /api/vote") return handleVote(request, env);
    if (route === "GET /stats") return renderStats(await loadStats(env));

    return new Response("Página não encontrada", { status: 404 });
  },

  async scheduled(_controller, env, ctx): Promise<void> {
    ctx.waitUntil(collectReadings(env));
  },
} satisfies ExportedHandler<Env>;
