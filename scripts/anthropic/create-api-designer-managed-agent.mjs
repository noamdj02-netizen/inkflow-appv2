/**
 * Crée un Managed Agent Anthropic « API Designer » via l’API REST (équivalent au CLI `ant beta:agents create`).
 *
 * Prérequis : Node 18+, variable d’environnement ANTHROPIC_API_KEY.
 *
 * Usage (PowerShell) :
 *   $env:ANTHROPIC_API_KEY = "sk-ant-..."
 *   node scripts/anthropic/create-api-designer-managed-agent.mjs
 *
 * Équivalent CLI (macOS / Linux avec `ant` — brew install anthropics/tap/ant) :
 *   ant beta:agents create \
 *     --name "API Designer" \
 *     --model "{\"id\":\"claude-sonnet-4-6\"}" \
 *     --system "<coller le SYSTEM_PROMPT ci-dessus>" \
 *     --tool "{\"type\":\"agent_toolset_20260401\"}"
 *
 * Doc : https://platform.claude.com/docs/en/managed-agents/quickstart
 */

const SYSTEM_PROMPT = `You are a senior API designer specializing in REST and GraphQL architectures. When given a task, analyze business domain models and client requirements, then design APIs following API-first principles: resource-oriented architecture, proper HTTP semantics, consistent naming, and comprehensive OpenAPI 3.1 specifications.

Cover authentication patterns (OAuth 2.0, JWT, API keys), versioning strategies (URI, header, content-type), pagination (cursor, page-based, limit/offset), webhooks, bulk operations, and error handling with consistent formats and actionable messages. Optimize for developer experience — generate request/response examples, error catalogs, and SDK guidance.

For GraphQL, address type system design, query complexity, mutation patterns, subscriptions, and federation. Always ensure backward compatibility, define deprecation policies, and include rate limiting and cache control headers. Deliver complete OpenAPI specs, Postman collections, and migration guides.`;

async function main() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key || !key.trim()) {
    console.error(
      "Missing ANTHROPIC_API_KEY. Set it, then rerun:\n" +
        '  PowerShell: $env:ANTHROPIC_API_KEY = "sk-ant-..."\n' +
        "  bash:       export ANTHROPIC_API_KEY=sk-ant-..."
    );
    process.exit(1);
  }

  const res = await fetch("https://api.anthropic.com/v1/agents", {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "anthropic-beta": "managed-agents-2026-04-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      name: "API Designer",
      model: "claude-sonnet-4-6",
      system: SYSTEM_PROMPT,
      tools: [{ type: "agent_toolset_20260401" }],
    }),
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    console.error("Non-JSON response:", text);
    process.exit(1);
  }

  if (!res.ok) {
    console.error("HTTP", res.status, JSON.stringify(data, null, 2));
    process.exit(1);
  }

  console.log("Agent created successfully:\n");
  console.log(JSON.stringify(data, null, 2));
  if (data.id != null) {
    console.log("\n---\nAgent ID:", data.id);
    if (data.version != null) console.log("Version:", data.version);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
