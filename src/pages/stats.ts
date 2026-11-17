import type { Stats } from "../db";
import { escapeHtml, page } from "./layout";

const CSS = `
h1{font-size:1.6rem;margin:0 0 .5rem}
h2{font-size:1.1rem;margin:2rem 0 .5rem}
p{margin:.25rem 0;font-size:.9rem;opacity:.85}
.scroll{overflow-x:auto}
table{border-collapse:collapse;width:100%;font-variant-numeric:tabular-nums}
th,td{padding:.4rem .6rem;border-bottom:1px solid #0002;text-align:right;white-space:nowrap}
th:first-child,td:first-child{text-align:left}
`;

function table(headers: string[], rows: (string | number)[][]): string {
  if (rows.length === 0) return "<p>Sem dados ainda.</p>";
  const head = headers.map((h) => `<th>${h}</th>`).join("");
  const body = rows
    .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(String(cell))}</td>`).join("")}</tr>`)
    .join("");
  return `<div class="scroll"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
}

export function renderStats(stats: Stats): Response {
  const body = `<main>
  <h1>Estatísticas</h1>
  <p><a href="/">← Voltar</a></p>

  <h2>Voto × API, por fonte</h2>
  <p>Cada voto é comparado com a primeira leitura da fonte coletada depois dele (até 15 min).</p>
  ${table(
    ["Fonte", "Concordaram", "Discordaram"],
    stats.agreement.map((a) => [a.source, a.agree, a.disagree]),
  )}

  <h2>Votos por dia</h2>
  ${table(
    ["Dia", "Chovendo", "Não chovendo", "Total"],
    stats.votes.map((v) => [v.day, v.raining, v.not_raining, v.raining + v.not_raining]),
  )}

  <h2>Acessos por dia</h2>
  ${table(
    ["Dia", "Acessos"],
    stats.visits.map((v) => [v.day, v.count]),
  )}
</main>`;
  return page("Estatísticas · Chove na UFG", CSS, body);
}
