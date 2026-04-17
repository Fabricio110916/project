export default {
  async fetch(request) {
    const url = new URL(request.url);

    const target = "https://my.koom.pp.ua:443" + url.pathname + url.search;

    const newHeaders = new Headers(request.headers);

    // limpa headers problemáticos
    const blocked = [
      'host', 'connection', 'x-forwarded-for',
      'x-forwarded-host', 'x-forwarded-proto',
      'cf-connecting-ip'
    ];

    blocked.forEach(h => newHeaders.delete(h));

    newHeaders.set("host", "my.koom.pp.ua");

    const response = await fetch(target, {
      method: request.method,
      headers: newHeaders,
      body: request.body,
      redirect: "manual"
    });

    return new Response(response.body, {
      status: response.status,
      headers: response.headers
    });
  }
};
