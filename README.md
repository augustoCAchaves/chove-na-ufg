# Chove na UFG

Site de página única que responde: está chovendo agora no Campus Samambaia da UFG, em Goiânia?

- A cada 10 minutos, um cron consulta APIs de clima para a coordenada do campus e grava uma leitura por fonte.
- A página mostra "Chove na UFG" ou "Não chove na UFG" segundo a fonte principal (Open-Meteo). Se a última leitura tiver mais de 25 minutos, mostra "Sem dados no momento".
- Quem está no campus pode confirmar se está chovendo ou não. Os votos servem para medir o quanto cada API acerta.
- `/stats` mostra acessos por dia, votos por dia e, por fonte, quantas vezes voto e API concordaram.

O status vem de modelo meteorológico, não de radar ou estação no campus, então pode errar, principalmente em pancadas isoladas.

## Stack

Cloudflare Workers + D1 (SQLite), em TypeScript, com deploy via Wrangler. O HTML é gerado pelo próprio Worker, sem framework.

```
src/
  index.ts        rotas e cron
  config.ts       coordenada do campus e limites de tempo
  sources/        uma fonte de dados por arquivo, com interface comum
  db.ts           consultas ao D1
  vote.ts         voto e limite por visitante
  pages/          HTML da página inicial e do /stats
migrations/       schema do banco
```

## Fontes de dados

| Fonte | Papel | Chave |
|---|---|---|
| [Open-Meteo](https://open-meteo.com/) | principal (exibida) | não precisa |
| [WeatherAPI.com](https://www.weatherapi.com/) | só registrada | `WEATHERAPI_KEY` |
| [OpenWeatherMap](https://openweathermap.org/) | só registrada | `OPENWEATHER_KEY` |

Fonte sem chave configurada é ignorada. Para adicionar outra, implemente `WeatherSource` (`src/sources/types.ts`) e inclua na lista em `src/sources/index.ts`.

## Privacidade

O IP do visitante não é gravado. Para limitar a 1 voto a cada 10 minutos, o Worker guarda apenas `SHA-256(salt | dia | IP)`. O salt é um secret e o dia entra no hash, então o identificador muda diariamente.

## Rodando localmente

```sh
npm install
cp .dev.vars.example .dev.vars   # preencha IP_SALT
npm run db:local                 # cria as tabelas no banco local
npm run dev
```

O cron não dispara sozinho em desenvolvimento. Para simular uma execução:

```sh
curl "http://localhost:8787/__scheduled?cron=*/10+*+*+*+*"
```

## Deploy

```sh
npx wrangler login
npx wrangler d1 create chove-na-ufg      # copie o database_id para wrangler.jsonc
npm run db:remote                        # cria as tabelas no banco de produção
npx wrangler secret put IP_SALT          # texto aleatório longo
npx wrangler secret put WEATHERAPI_KEY   # opcional
npx wrangler secret put OPENWEATHER_KEY  # opcional
npm run deploy
```

## Licença

[MIT](LICENSE). Dados meteorológicos: [Open-Meteo](https://open-meteo.com/) (CC BY 4.0).
