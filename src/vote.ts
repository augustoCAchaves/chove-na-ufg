import { localDay, type Env } from "./config";
import { insertVote } from "./db";

/**
 * Identificador anônimo do visitante: SHA-256(salt | dia | IP). O IP não é
 * gravado em lugar nenhum, e como o dia entra no hash, o identificador muda
 * todo dia e não serve para acompanhar alguém ao longo do tempo.
 */
async function visitorHash(salt: string, ip: string): Promise<string> {
  const day = localDay(Math.floor(Date.now() / 1000));
  const bytes = new TextEncoder().encode(`${salt}|${day}|${ip}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

const json = (body: unknown, status: number) => Response.json(body, { status });

export async function handleVote(request: Request, env: Env): Promise<Response> {
  if (!env.IP_SALT) {
    console.error("secret IP_SALT não configurado");
    return json({ error: "Votação indisponível no momento." }, 503);
  }
  // Exigir JSON impede o envio por formulário a partir de outros sites.
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return json({ error: "Requisição inválida." }, 415);
  }
  const body = (await request.json().catch(() => null)) as { raining?: unknown } | null;
  if (typeof body?.raining !== "boolean") {
    return json({ error: "Requisição inválida." }, 400);
  }

  const ip = request.headers.get("cf-connecting-ip") ?? "desconhecido";
  const saved = await insertVote(env, await visitorHash(env.IP_SALT, ip), body.raining);
  if (!saved) {
    return json({ error: "Você já votou há pouco. Tente de novo em alguns minutos." }, 429);
  }
  return json({ ok: true }, 201);
}
