const PING_API_URL = process.env.PING_API_URL;
const PING_API_TOKEN = process.env.PING_API_TOKEN;

if (!PING_API_URL || !PING_API_TOKEN) {
  console.warn(
    "[mcp-server] Skipping startup in dev: set PING_API_URL and PING_API_TOKEN to enable the MCP server.",
  );
  setInterval(() => {}, 1 << 30);
} else {
  await import("./index.ts");
}
