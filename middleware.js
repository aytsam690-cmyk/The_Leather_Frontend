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

    // Rewrite the request to the backend's dynamic rendering endpoint
    const backendUrl = 'http://20.244.38.147';
    // Remove leading slash for the param
    const path = url.pathname.replace(/^\/+/, ''); 
    
    return fetch(`${backendUrl}/bot-render/${path}`, {
      headers: {
        'x-forwarded-for': request.headers.get('x-forwarded-for') || '',
        'user-agent': userAgent,
      }
    });
  }
}
