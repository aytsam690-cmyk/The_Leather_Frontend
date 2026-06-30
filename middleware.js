export const config = {
  // Only run middleware on document requests, skip static assets (js, css, images)
  matcher: [
    '/((?!api|_next/static|_next/image|assets|favicon.ico|favicon.png|favicon.svg|sitemap.xml|robots.txt).*)',
  ],
};

export default function middleware(request) {
  const url = new URL(request.url);
  const userAgent = request.headers.get('user-agent') || '';

  // List of search engine bots we want to serve dynamic HTML to
  const isBot = /bot|crawler|spider|crawling|googlebot|bingbot|yandexbot|duckduckbot|slurp|facebookexternalhit|twitterbot|whatsapp/i.test(userAgent);

  if (isBot) {
    // Exclude admin routes from bot indexing
    if (url.pathname.startsWith('/admin') || url.pathname.startsWith('/aytsam-abdullah')) {
      return Response.redirect(new URL('/', request.url), 302);
    }

    // Rewrite the request to the backend's dynamic rendering endpoint using Vercel's native rewrite header
    const backendUrl = 'http://20.244.38.147';
    const path = url.pathname.replace(/^\/+/, ''); 
    
    return new Response(null, {
      headers: {
        'x-middleware-rewrite': `${backendUrl}/bot-render/${path}`
      }
    });
  }
}
