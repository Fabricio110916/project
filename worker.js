export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 🔥 CONFIG
    const TARGET_HOST = "137.131.176.224";
    const TARGET_PROTO = "http"; // ⚠️ use http se SSL for inválido

    const targetUrl = `${TARGET_PROTO}://${TARGET_HOST}${url.pathname}${url.search}`;

    // 🔁 WebSocket support
    if (request.headers.get("upgrade") === "websocket") {
      return handleWebSocket(request, targetUrl);
    }

    // 🧠 Headers camuflados
    const headers = new Headers(request.headers);

    // Remove headers problemáticos
    const blocked = [
      "host",
      "cf-connecting-ip",
      "x-forwarded-for",
      "x-forwarded-host",
      "x-forwarded-proto",
      "via",
      "cdn-loop"
    ];

    blocked.forEach(h => headers.delete(h));

    // Simula browser real
    headers.set("user-agent", randomUA());
    headers.set("accept", "*/*");
    headers.set("connection", "keep-alive");

    try {
      const response = await fetch(targetUrl, {
        method: request.method,
        headers,
        body: request.body,
        redirect: "manual"
      });

      // 🧼 Sanitiza resposta
      const respHeaders = new Headers(response.headers);
      respHeaders.delete("content-security-policy");
      respHeaders.delete("x-frame-options");

      return new Response(response.body, {
        status: response.status,
        headers: respHeaders
      });

    } catch (err) {
      return new Response("Bad Gateway", { status: 502 });
    }
  }
};

// 🔌 WebSocket tunneling (básico)
async function handleWebSocket(request, targetUrl) {
  const pair = new WebSocketPair();
  const [client, server] = Object.values(pair);

  server.accept();

  try {
    const target = await fetch(targetUrl, {
      headers: { "upgrade": "websocket" }
    });

    const targetSocket = target.webSocket;
    targetSocket.accept();

    // 🔁 Pipe bidirecional
    server.addEventListener("message", msg => {
      targetSocket.send(msg.data);
    });

    targetSocket.addEventListener("message", msg => {
      server.send(msg.data);
    });

    server.addEventListener("close", () => targetSocket.close());
    targetSocket.addEventListener("close", () => server.close());

  } catch (e) {
    server.close();
  }

  return new Response(null, {
    status: 101,
    webSocket: client
  });
}

// 🎭 User-Agent rotativo
function randomUA() {
  const list = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    "Mozilla/5.0 (Linux; Android 13)",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)"
  ];
  return list[Math.floor(Math.random() * list.length)];
}
