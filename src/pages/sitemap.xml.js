import { COUNTRIES, cityKeys, SITE_URL } from '../lib/seo.mjs';

export function GET() {
  const today = new Date().toISOString().slice(0, 10);
  const urls = ['/', ...COUNTRIES.map((c) => `/${c.slug}/`), ...cityKeys.map((k) => `/plan/${k}/`)];
  const body = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.map((u) => `  <url><loc>${SITE_URL}${u}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>${u === '/' ? '1.0' : u.startsWith('/plan/') ? '0.7' : '0.8'}</priority></url>`).join('\n') +
    '\n</urlset>\n';
  return new Response(body, { headers: { 'Content-Type': 'application/xml' } });
}
