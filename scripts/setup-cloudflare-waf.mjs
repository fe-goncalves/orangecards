#!/usr/bin/env node
/**
 * Tenta criar regra de Rate Limiting no Cloudflare WAF para o domínio.
 * Requer token OAuth do wrangler (já logado) ou CLOUDFLARE_API_TOKEN com Zone WAF Edit.
 *
 * Uso: node scripts/setup-cloudflare-waf.mjs
 */

const ZONE_NAME = process.env.CF_ZONE_NAME || "copaorange.com.br";
const RULE_NAME = "Orange Cards Drop Protection";

async function getApiToken() {
  if (process.env.CLOUDFLARE_API_TOKEN) {
    return process.env.CLOUDFLARE_API_TOKEN;
  }

  // Wrangler OAuth token from config (fallback — pode não ter permissão WAF)
  const { readFileSync } = await import("node:fs");
  const { homedir } = await import("node:os");
  const { join } = await import("node:path");

  const configPath = join(
    homedir(),
    "AppData/Roaming/xdg.config/.wrangler/config/default.toml"
  );

  try {
    const raw = readFileSync(configPath, "utf8");
    const match = raw.match(/oauth_token\s*=\s*"([^"]+)"/);
    if (match) return match[1];
  } catch {
    /* ignore */
  }

  throw new Error(
    "Defina CLOUDFLARE_API_TOKEN ou faça wrangler login antes de rodar este script."
  );
}

async function cfFetch(token, path, options = {}) {
  const res = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const data = await res.json();
  if (!data.success) {
    const err = data.errors?.[0]?.message || JSON.stringify(data.errors);
    throw new Error(err);
  }
  return data;
}

async function main() {
  console.log(`\nCloudflare WAF — ${ZONE_NAME}\n`);

  const token = await getApiToken();

  const zones = await cfFetch(
    token,
    `/zones?name=${encodeURIComponent(ZONE_NAME)}`
  );
  const zone = zones.result?.[0];
  if (!zone) {
    throw new Error(`Zona não encontrada: ${ZONE_NAME}`);
  }

  console.log(`Zona: ${zone.name} (${zone.id})`);

  // Lista regras existentes (Rate Limiting rules API v4)
  let existing = [];
  try {
    const rules = await cfFetch(token, `/zones/${zone.id}/rulesets`);
    existing = rules.result || [];
  } catch (e) {
    console.warn("Não foi possível listar rulesets:", e.message);
  }

  const already = existing.find(
    (r) =>
      r.name?.includes("Orange Cards") ||
      r.description?.includes("Orange Cards")
  );

  if (already) {
    console.log("Regra já existe ou ruleset similar encontrado — nada a fazer.");
    return;
  }

  // Cria ruleset de rate limit (HTTP DDoS / WAF custom rules — depende do plano)
  // Fallback: instruções manuais se API falhar
  try {
    const body = {
      name: RULE_NAME,
      description: "Limita requisições por IP durante drops ao vivo",
      kind: "zone",
      phase: "http_ratelimit",
      rules: [
        {
          description: "15 requests per 10 seconds per IP",
          expression: "(http.host eq \"cards.copaorange.com.br\")",
          action: "block",
          ratelimit: {
            characteristics: ["ip.src"],
            period: 10,
            requests_per_period: 15,
            mitigation_timeout: 60,
          },
        },
      ],
    };

    await cfFetch(token, `/zones/${zone.id}/rulesets`, {
      method: "POST",
      body: JSON.stringify(body),
    });

    console.log("✓ Regra de rate limiting criada com sucesso.");
  } catch (e) {
    console.error("\n✗ API não conseguiu criar a regra automaticamente.");
    console.error(`  Motivo: ${e.message}\n`);
    console.log("Configure manualmente no Cloudflare Dashboard:");
    console.log("  1. Security → WAF → Rate limiting rules → Create rule");
    console.log(`  2. Hostname: cards.copaorange.com.br`);
    console.log("  3. Requests: 15 per 10 seconds per IP");
    console.log("  4. Action: Block por 60 segundos");
    console.log("  5. Nome: Orange Cards Drop Protection\n");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
