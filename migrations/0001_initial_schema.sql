-- Cloudflare Configurations Table
CREATE TABLE IF NOT EXISTS cloudflare_configs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  api_token TEXT NOT NULL,
  account_id TEXT NOT NULL,
  d1_database TEXT NOT NULL,
  worker_api TEXT NOT NULL,
  kv_storage TEXT NOT NULL,
  destination_emails TEXT DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Email Routing Table
CREATE TABLE IF NOT EXISTS email_routing (
  id TEXT PRIMARY KEY,
  cloudflare_config_id TEXT NOT NULL,
  zone_id TEXT NOT NULL,
  zone_name TEXT NOT NULL,
  alias_part TEXT NOT NULL,
  full_email TEXT NOT NULL,
  rule_id TEXT NOT NULL UNIQUE,
  destination TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cloudflare_config_id) REFERENCES cloudflare_configs(id) ON DELETE CASCADE
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cloudflare_configs_active ON cloudflare_configs(is_active);
CREATE INDEX IF NOT EXISTS idx_email_routing_config ON email_routing(cloudflare_config_id);
CREATE INDEX IF NOT EXISTS idx_email_routing_active ON email_routing(is_active);
CREATE INDEX IF NOT EXISTS idx_email_routing_rule ON email_routing(rule_id);