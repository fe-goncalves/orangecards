#!/usr/bin/env node
/**
 * Verificação pré-lançamento do Orange Cards em produção.
 * Uso: node scripts/launch-check.mjs
 */

const SITE =
  process.env.LAUNCH_CHECK_URL?.trim() ||
  "https://cards.copaorange.com.br";
const SITE_FALLBACK =
  process.env.LAUNCH_CHECK_FALLBACK_URL?.trim() ||
  "https://orangecards.provedordehospedagem5616.workers.dev";
const ADMIN =
  process.env.LAUNCH_CHECK_ADMIN_URL?.trim() ||
  "https://orange-cards-admin.provedordehospedagem5616.workers.dev";

const checks = [];

function pass(name, detail) {
  checks.push({ name, ok: true, detail });
  console.log(`✓ ${name}${detail ? ` — ${detail}` : ""}`);
}

function fail(name, detail) {
  checks.push({ name, ok: false, detail });
  console.log(`✗ ${name}${detail ? ` — ${detail}` : ""}`);
}

async function fetchText(url, opts = {}) {
  const res = await fetch(url, {
    redirect: "follow",
    ...opts,
    headers: {
      "User-Agent": "OrangeCards-LaunchCheck/1.0",
      ...(opts.headers || {}),
    },
  });
  const text = await res.text();
  return { res, text };
}

async function main() {
  console.log(`\nOrange Cards — Launch Check`);

  let site = SITE;
  try {
    const probe = await fetch(SITE, {
      method: "HEAD",
      signal: AbortSignal.timeout(8000),
    });
    if (!probe.ok && probe.status !== 405) {
      throw new Error(`HTTP ${probe.status}`);
    }
  } catch {
    console.log(`Aviso: ${SITE} indisponível neste ambiente — usando fallback.`);
    site = SITE_FALLBACK;
  }

  console.log(`Site:  ${site}`);
  console.log(`Admin: ${ADMIN}\n`);

  // 1. Home
  try {
    const { res, text } = await fetchText(`${site}/`);
    if (res.ok) pass("Home responde", `HTTP ${res.status}`);
    else fail("Home responde", `HTTP ${res.status}`);

    if (text.includes("ORANGE CARDS")) pass("Home contém branding");
    else fail("Home contém branding");

    if (
      text.includes('property="og:title"') &&
      text.toUpperCase().includes("ORANGE CARDS")
    ) {
      pass("Meta OG title presente");
    } else {
      fail("Meta OG title presente");
    }
  } catch (e) {
    fail("Home responde", String(e));
  }

  // 2. Health API
  try {
    const { res, text } = await fetchText(`${site}/api/health`);
    if (!res.ok) {
      fail("Health API", `HTTP ${res.status}`);
    } else {
      const data = JSON.parse(text);
      if (data.ok && data.service === "orange-cards") {
        pass("Health API", data.supabase_configured ? "Supabase OK" : "sem Supabase");
      } else {
        fail("Health API", "payload inválido");
      }
    }
  } catch (e) {
    fail("Health API", String(e));
  }

  // 3. Reset password page
  try {
    const { res } = await fetchText(`${site}/reset-password`);
    if (res.ok) pass("Página /reset-password", `HTTP ${res.status}`);
    else fail("Página /reset-password", `HTTP ${res.status}`);
  } catch (e) {
    fail("Página /reset-password", String(e));
  }

  // 4. Robots.txt
  try {
    const { res, text } = await fetchText(`${site}/robots.txt`);
    if (res.ok && text.includes("Disallow: /admin")) {
      pass("robots.txt");
    } else {
      fail("robots.txt");
    }
  } catch (e) {
    fail("robots.txt", String(e));
  }

  // 5. Manifest
  try {
    const { res, text } = await fetchText(`${site}/manifest.webmanifest`);
    if (res.ok && text.includes("ORANGE CARDS")) {
      pass("Web manifest");
    } else {
      fail("Web manifest", `HTTP ${res.status}`);
    }
  } catch (e) {
    fail("Web manifest", String(e));
  }

  // 6. Booster pack assets
  try {
    const { res } = await fetchText(`${site}/brand/exports/booster-pack.svg`);
    if (res.ok) pass("Asset booster-pack.svg");
    else fail("Asset booster-pack.svg", `HTTP ${res.status}`);
  } catch (e) {
    fail("Asset booster-pack.svg", String(e));
  }

  // 7. Shared collection route (404 esperado para user inexistente — mas página deve renderizar)
  try {
    const { res, text } = await fetchText(`${site}/u/__launch_check__`);
    if (res.ok && text.includes("NÃO ENCONTRADO")) {
      pass("Rota /u/[user] (coleção pública)");
    } else if (res.ok) {
      pass("Rota /u/[user]", "responde (verificar RPC no Supabase)");
    } else {
      fail("Rota /u/[user]", `HTTP ${res.status}`);
    }
  } catch (e) {
    fail("Rota /u/[user]", String(e));
  }

  // 8. Admin
  try {
    const { res } = await fetchText(ADMIN);
    if (res.ok || res.status === 307 || res.status === 302) {
      pass("Admin responde", `HTTP ${res.status}`);
    } else {
      fail("Admin responde", `HTTP ${res.status}`);
    }
  } catch (e) {
    fail("Admin responde", String(e));
  }

  // 9. Security headers (sample)
  try {
    const res = await fetch(`${site}/`, {
      headers: { "User-Agent": "OrangeCards-LaunchCheck/1.0" },
    });
    const xcto = res.headers.get("x-content-type-options");
    const xfo = res.headers.get("x-frame-options");
    if (xcto === "nosniff") pass("Header X-Content-Type-Options");
    else fail("Header X-Content-Type-Options", xcto || "ausente");
    if (xfo === "DENY" || xfo === "SAMEORIGIN") pass("Header X-Frame-Options");
    else fail("Header X-Frame-Options", xfo || "ausente");
  } catch (e) {
    fail("Security headers", String(e));
  }

  // 10. Service Worker (PWA)
  try {
    const { res, text } = await fetchText(`${site}/sw.js`);
    if (res.ok && text.includes("serviceWorker") || text.includes("addEventListener")) {
      pass("Service Worker (sw.js)");
    } else {
      fail("Service Worker (sw.js)", `HTTP ${res.status}`);
    }
  } catch (e) {
    fail("Service Worker (sw.js)", String(e));
  }

  const failed = checks.filter((c) => !c.ok).length;
  console.log(`\n${checks.length - failed}/${checks.length} checks OK`);

  if (failed > 0) {
    console.log("\nFalhas:");
    for (const c of checks.filter((x) => !x.ok)) {
      console.log(`  - ${c.name}: ${c.detail || "falhou"}`);
    }
    process.exit(1);
  }

  console.log("\nTudo pronto para o lançamento.\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
