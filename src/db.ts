import { CAMPUS, MATCH_WINDOW_S, TZ_OFFSET_S, VOTE_COOLDOWN_S, localDay, type Env } from "./config";
import { SOURCES } from "./sources";

const nowS = () => Math.floor(Date.now() / 1000);

/** Consulta todas as fontes configuradas e grava uma linha por fonte. */
export async function collectReadings(env: Env): Promise<void> {
  const sources = SOURCES.filter((s) => s.isConfigured(env));
  const results = await Promise.allSettled(sources.map((s) => s.fetchReading(CAMPUS.lat, CAMPUS.lon, env)));
  const fetchedAt = nowS();

  const insert = env.DB.prepare(
    `INSERT INTO readings (source, fetched_at, observed_at, precipitation_mm, weather_code, is_raining, raw, error)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  // Cada linha é gravada separadamente: um erro em uma não derruba as outras.
  const writes = await Promise.allSettled(
    results.map((result, i) => {
      const source = sources[i].id;
      if (result.status === "fulfilled") {
        const r = result.value;
        return insert
          .bind(source, fetchedAt, r.observedAt, r.precipitationMm, r.weatherCode, r.isRaining ? 1 : 0, r.raw, null)
          .run();
      }
      const message = result.reason instanceof Error ? result.reason.message : String(result.reason);
      console.error(`fonte ${source} falhou: ${message}`);
      return insert.bind(source, fetchedAt, null, null, null, null, null, message).run();
    }),
  );
  for (const w of writes) {
    if (w.status === "rejected") console.error("falha ao gravar leitura:", w.reason);
  }
}

export interface LatestReading {
  fetched_at: number;
  is_raining: number;
}

export function latestReading(env: Env, source: string): Promise<LatestReading | null> {
  return env.DB.prepare(
    `SELECT fetched_at, is_raining FROM readings
     WHERE source = ? AND error IS NULL
     ORDER BY fetched_at DESC LIMIT 1`,
  )
    .bind(source)
    .first<LatestReading>();
}

export async function countVisit(env: Env): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO daily_visits (day, count) VALUES (?, 1)
     ON CONFLICT (day) DO UPDATE SET count = count + 1`,
  )
    .bind(localDay(nowS()))
    .run();
}

/** Grava o voto, a menos que o visitante tenha votado há pouco. Devolve se gravou. */
export async function insertVote(env: Env, visitorHash: string, raining: boolean): Promise<boolean> {
  const now = nowS();
  // Verificação e gravação no mesmo comando, para dois cliques simultâneos não passarem.
  const result = await env.DB.prepare(
    `INSERT INTO votes (voted_at, raining, visitor_hash)
     SELECT ?1, ?2, ?3
     WHERE NOT EXISTS (SELECT 1 FROM votes WHERE visitor_hash = ?3 AND voted_at > ?4)`,
  )
    .bind(now, raining ? 1 : 0, visitorHash, now - VOTE_COOLDOWN_S)
    .run();
  return result.meta.changes > 0;
}

export interface Stats {
  visits: { day: string; count: number }[];
  votes: { day: string; raining: number; not_raining: number }[];
  agreement: { source: string; agree: number; disagree: number }[];
}

export async function loadStats(env: Env): Promise<Stats> {
  const [visits, votes, agreement] = await env.DB.batch([
    env.DB.prepare(`SELECT day, count FROM daily_visits ORDER BY day DESC LIMIT 60`),
    env.DB.prepare(
      `SELECT strftime('%Y-%m-%d', voted_at + ?, 'unixepoch') AS day,
              SUM(raining) AS raining,
              SUM(1 - raining) AS not_raining
       FROM votes GROUP BY day ORDER BY day DESC LIMIT 60`,
    ).bind(TZ_OFFSET_S),
    // Cada voto é comparado, por fonte, com a primeira leitura coletada depois
    // dele (até MATCH_WINDOW_S). Votos sem leitura nessa janela ficam de fora.
    env.DB.prepare(
      `SELECT r.source AS source,
              SUM(r.is_raining = v.raining) AS agree,
              SUM(r.is_raining <> v.raining) AS disagree
       FROM votes v
       CROSS JOIN (SELECT DISTINCT source FROM readings) s
       JOIN readings r ON r.id = (
         SELECT r2.id FROM readings r2
         WHERE r2.source = s.source AND r2.error IS NULL
           AND r2.fetched_at >= v.voted_at AND r2.fetched_at <= v.voted_at + ?
         ORDER BY r2.fetched_at LIMIT 1
       )
       GROUP BY r.source ORDER BY r.source`,
    ).bind(MATCH_WINDOW_S),
  ]);
  return {
    visits: visits.results as Stats["visits"],
    votes: votes.results as Stats["votes"],
    agreement: agreement.results as Stats["agreement"],
  };
}
