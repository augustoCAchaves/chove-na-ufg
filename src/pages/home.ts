import { STALE_AFTER_S, TIME_ZONE } from "../config";
import type { LatestReading } from "../db";
import { page } from "./layout";

const THEMES = {
  rain: { bg: "#17456e", fg: "#f2f8fd", headline: "Chove na UFG" },
  dry: { bg: "#f6e7b4", fg: "#3a2c05", headline: "Não chove na UFG" },
  nodata: { bg: "#e3e5e8", fg: "#2b3138", headline: "Sem dados no momento" },
};

const CSS = `
main{display:flex;flex-direction:column;justify-content:center;text-align:center;gap:1.25rem}
h1{margin:0;font-size:clamp(2.6rem,13vw,5.5rem);line-height:1.05;letter-spacing:-.02em;text-wrap:balance}
.meta{margin:0;font-size:.95rem;opacity:.85}
.vote{margin-top:1.5rem;display:flex;flex-direction:column;align-items:center;gap:.75rem}
.options{display:flex;flex-wrap:wrap;justify-content:center;gap:.75rem}
button{font:inherit;font-weight:600;color:inherit;background:transparent;border:2px solid currentColor;
  border-radius:999px;padding:.7rem 1.3rem;min-height:3rem;cursor:pointer}
button:hover:not(:disabled){background:color-mix(in srgb,currentColor 12%,transparent)}
button:disabled{opacity:.5;cursor:default}
[hidden]{display:none!important}
#feedback{margin:0;min-height:1.5em}
`;

const SCRIPT = `
const open = document.getElementById("open");
const options = document.getElementById("options");
const feedback = document.getElementById("feedback");
open.addEventListener("click", () => { open.hidden = true; options.hidden = false; });
options.addEventListener("click", async (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  const buttons = options.querySelectorAll("button");
  buttons.forEach((b) => (b.disabled = true));
  try {
    const res = await fetch("/api/vote", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ raining: button.dataset.raining === "1" }),
    });
    if (res.ok) {
      options.hidden = true;
      feedback.textContent = "Voto registrado. Obrigado!";
    } else {
      const data = await res.json().catch(() => ({}));
      feedback.textContent = data.error || "Não foi possível registrar o voto.";
      if (res.status === 429) options.hidden = true;
      else buttons.forEach((b) => (b.disabled = false));
    }
  } catch {
    feedback.textContent = "Sem conexão. Tente de novo.";
    buttons.forEach((b) => (b.disabled = false));
  }
});
`;

function formatTime(epochS: number): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(epochS * 1000));
}

export function renderHome(reading: LatestReading | null, nowS: number): Response {
  const fresh = reading !== null && nowS - reading.fetched_at <= STALE_AFTER_S;
  const theme = !fresh ? THEMES.nodata : reading.is_raining ? THEMES.rain : THEMES.dry;
  const meta = reading
    ? `Última leitura: ${formatTime(reading.fetched_at)}`
    : "Nenhuma leitura registrada ainda";

  const body = `<main>
  <h1>${theme.headline}</h1>
  <p class="meta">${meta} · Campus Samambaia</p>
  <div class="vote">
    <button id="open" type="button">Estou no campus</button>
    <div id="options" class="options" hidden>
      <button type="button" data-raining="1">Está chovendo</button>
      <button type="button" data-raining="0">Não está chovendo</button>
    </div>
    <p id="feedback" role="status"></p>
  </div>
</main>
<footer>
  Estimativa de modelo meteorológico, pode errar.
  Dados: <a href="https://open-meteo.com/">Open-Meteo</a> (CC BY 4.0) ·
  <a href="/stats">Estatísticas</a>
</footer>
<script>${SCRIPT}</script>`;

  return page(theme.headline, `:root{--bg:${theme.bg};--fg:${theme.fg}}${CSS}`, body);
}
