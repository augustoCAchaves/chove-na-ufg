/** Campus Samambaia da UFG, Goiânia. Quatro casas decimais (~11 m) bastam. */
export const CAMPUS = { lat: -16.606, lon: -49.2611 };

/** Fonte exibida na página. As demais são só registradas. */
export const PRIMARY_SOURCE = "open-meteo";

/** Leitura mais velha que isso vira "Sem dados no momento". */
export const STALE_AFTER_S = 25 * 60;

/** Intervalo mínimo entre votos do mesmo visitante. */
export const VOTE_COOLDOWN_S = 10 * 60;

/**
 * No /stats, cada voto é comparado com a primeira leitura coletada DEPOIS dele,
 * desde que ela chegue dentro desta janela. As APIs informam a chuva acumulada
 * no período anterior à leitura, então é a leitura seguinte que cobre o momento
 * do voto.
 */
export const MATCH_WINDOW_S = 15 * 60;

/** Goiânia é UTC-3 o ano todo (sem horário de verão). */
export const TZ_OFFSET_S = -3 * 60 * 60;
export const TIME_ZONE = "America/Sao_Paulo";

/** Tempo máximo de espera por uma API de clima. */
export const FETCH_TIMEOUT_MS = 8000;

export interface Env {
  DB: D1Database;
  /** Secret: salt do hash de visitante. */
  IP_SALT: string;
  /** Secrets opcionais: sem a chave, a fonte é ignorada. */
  WEATHERAPI_KEY?: string;
  OPENWEATHER_KEY?: string;
}

/** Dia 'YYYY-MM-DD' no fuso de Goiânia. */
export function localDay(epochS: number): string {
  return new Date((epochS + TZ_OFFSET_S) * 1000).toISOString().slice(0, 10);
}
