import { FETCH_TIMEOUT_MS, type Env } from "../config";

export interface Reading {
  /** Horário informado pela API (epoch s), se houver. */
  observedAt: number | null;
  precipitationMm: number | null;
  /** Código do tempo no esquema da própria fonte. */
  weatherCode: number | null;
  /** Interpretação normalizada: está chovendo agora? */
  isRaining: boolean;
  /** Corpo da resposta, como veio. */
  raw: string;
}

export interface WeatherSource {
  id: string;
  /** Falso quando falta a chave da API; a fonte é pulada pelo cron. */
  isConfigured(env: Env): boolean;
  fetchReading(lat: number, lon: number, env: Env): Promise<Reading>;
}

/**
 * Busca a URL e devolve o corpo como texto. As mensagens de erro nunca incluem
 * a URL, porque ela pode conter a chave da API.
 */
export async function fetchText(url: string, headers?: Record<string, string>): Promise<string> {
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  if (!res.ok) {
    // O corpo de erro das APIs explica o motivo (ex.: chave inválida). Só ele
    // entra na mensagem, nunca a URL.
    const detail = (await res.text().catch(() => "")).slice(0, 300);
    throw new Error(`HTTP ${res.status}${detail ? `: ${detail}` : ""}`);
  }
  return res.text();
}

export function num(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
