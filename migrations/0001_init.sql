-- Uma linha por fonte a cada execução do cron.
CREATE TABLE readings (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  source           TEXT    NOT NULL,   -- ex.: 'open-meteo'
  fetched_at       INTEGER NOT NULL,   -- quando o cron coletou (epoch s, UTC)
  observed_at      INTEGER,            -- horário informado pela API
  precipitation_mm REAL,
  weather_code     INTEGER,            -- código original da fonte
  is_raining       INTEGER,            -- 0/1, normalizado; NULL se falhou
  raw              TEXT,               -- resposta bruta (JSON)
  error            TEXT                -- NULL se deu certo
);
CREATE INDEX idx_readings_source_time ON readings (source, fetched_at);

-- Votos de quem está no campus.
CREATE TABLE votes (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  voted_at     INTEGER NOT NULL,       -- epoch s, UTC
  raining      INTEGER NOT NULL,       -- 0/1
  visitor_hash TEXT    NOT NULL        -- hash com salt; nunca o IP puro
);
CREATE INDEX idx_votes_visitor ON votes (visitor_hash, voted_at);
CREATE INDEX idx_votes_time ON votes (voted_at);

-- Contador de acessos à página por dia.
CREATE TABLE daily_visits (
  day   TEXT PRIMARY KEY,              -- 'YYYY-MM-DD' no fuso de Goiânia (UTC-3)
  count INTEGER NOT NULL DEFAULT 0
);
