export default {
  async fetch(request) {
    const url = new URL(request.url);

    // 🔧 CONFIGURAÇÃO
    const TARGET = "http://137.131.176.224"; // ⚠️ use HTTP se SSL for inválido

    const targetUrl = TARGET + url.pathname + url.search;

    // 🔁 Copia headers sem quebrar
    const headers = new Headers(request.headers);

    // Remove só o mínimo necessário
    headers.delete("host");

    try {
      const response = await fetch(targetUrl, {
        method: request.method,
        headers,
        body: request.body,
        redirect: "manual"
      });

      // 🔥 RETORNA EXATAMENTE O STATUS DO SERVIDOR
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      });

    } catch (err) {
      // Só erro real de conexão
      return new Response("Bad Gateway", { status: 502 });
    }
  }
};
