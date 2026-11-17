export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

const BASE_CSS = `
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;min-height:100vh;min-height:100dvh;display:flex;flex-direction:column;
  font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;line-height:1.5;
  background:var(--bg,#f4f1ea);color:var(--fg,#1d2733)}
main{flex:1;width:100%;max-width:40rem;margin:0 auto;padding:1.5rem 1rem}
footer{padding:1rem;text-align:center;font-size:.8rem;opacity:.8}
a{color:inherit}
`;

export function page(title: string, css: string, body: string): Response {
  const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)}</title>
<meta name="description" content="Está chovendo agora no Campus Samambaia da UFG?">
<style>${BASE_CSS}${css}</style>
</head>
<body>
${body}
</body>
</html>`;
  return new Response(html, {
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
  });
}
