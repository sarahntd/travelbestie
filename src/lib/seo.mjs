// Builds SEO and answer-engine (AEO) content from the same itinerary data the app uses.
// Runs only at build time (Astro), so the website and its search pages never disagree.
import itinerariesRaw from '../plan/itineraries.html?raw';
import moreRaw from '../plan/more.html?raw';

const SITE = 'https://travelbestie.site';

function loadData() {
  const win = {};
  const blocks = [...(itinerariesRaw + moreRaw).matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  for (const code of blocks) new Function('window', code)(win);
  return win;
}
const W = loadData();
export const IT = W.TB_ITIN || {};
const SEASON = W.TB_SEASON || {};
const BOOK = W.TB_BOOK || [];

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export const COUNTRIES = [
  { slug: 'singapore', name: 'Singapore', flag: '🇸🇬', tag: 'A garden city of hawker food, skyline views and island fun.' },
  { slug: 'malaysia', name: 'Malaysia', flag: '🇲🇾', tag: 'City skylines, heritage streets and some of the best food in Asia.' },
  { slug: 'indonesia', name: 'Indonesia', flag: '🇮🇩', tag: 'Over 17,000 islands: volcanoes, jungle, reefs and beaches.' },
  { slug: 'thailand', name: 'Thailand', flag: '🇹🇭', tag: 'Temples, night markets and island beaches.' },
  { slug: 'vietnam', name: 'Vietnam', flag: '🇻🇳', tag: "From buzzing Saigon to Hanoi's old quarter and the central coast." },
  { slug: 'philippines', name: 'Philippines', flag: '🇵🇭', tag: 'Over 7,000 islands of lagoons, white beaches and warm welcomes.' },
  { slug: 'cambodia', name: 'Cambodia', flag: '🇰🇭', tag: 'The temples of Angkor, riverside cities and quiet coastal towns.' },
  { slug: 'laos', name: 'Laos', flag: '🇱🇦', tag: 'Slow rivers, golden temples, waterfalls and karst mountains.' },
  { slug: 'myanmar', name: 'Myanmar', flag: '🇲🇲', tag: 'Golden pagodas and the temple plains of Bagan. Check travel advice before planning.' },
  { slug: 'brunei', name: 'Brunei', flag: '🇧🇳', tag: 'Golden mosques, a water village and untouched rainforest.' },
  { slug: 'timor-leste', name: 'Timor-Leste', flag: '🇹🇱', tag: "Southeast Asia's newest country: reefs, mountains and very few crowds." },
  { slug: 'china', name: 'China', flag: '🇨🇳', tag: "Imperial palaces, the Great Wall, pandas and some of the world's best food." },
  { slug: 'hong-kong', name: 'Hong Kong', flag: '🇭🇰', tag: 'A harbour skyline, dim sum, island hikes and easy day trips to Macau.' },
  { slug: 'taiwan', name: 'Taiwan', flag: '🇹🇼', tag: 'Night markets, hot springs, mountain views and friendly, easy travel.' },
  { slug: 'japan', name: 'Japan', flag: '🇯🇵', tag: 'Neon cities, quiet temples, bullet trains and some of the best food on earth.' },
  { slug: 'south-korea', name: 'South Korea', flag: '🇰🇷', tag: 'K-culture, palaces, mountain temples, beaches and late-night street food.' },
  { slug: 'sri-lanka', name: 'Sri Lanka', flag: '🇱🇰', tag: 'Ancient rock fortresses, tea hills, scenic trains, wild elephants and golden beaches.' },
  { slug: 'australia', name: 'Australia', flag: '🇦🇺', tag: 'Harbour cities, beaches, wildlife and the Great Barrier Reef.' },
];

const plain = (s) => String(s || '').replace(/\s*\(.*\)$/, '');
const listJoin = (arr) => (arr.length <= 1 ? arr.join('') : arr.slice(0, -1).join(', ') + ' and ' + arr[arr.length - 1]);

function bestMonths(city) {
  const code = SEASON[city];
  if (!code) return null;
  const good = [...code].map((c, i) => (c === 'd' ? i : -1)).filter((i) => i >= 0);
  if (!good.length) return null;
  // turn month numbers into readable ranges, e.g. "December to April"
  const ranges = [];
  let start = good[0], prev = good[0];
  for (let k = 1; k <= good.length; k++) {
    const m = good[k];
    if (m === prev + 1) { prev = m; continue; }
    ranges.push(start === prev ? MONTHS[start] : `${MONTHS[start]} to ${MONTHS[prev]}`);
    start = m; prev = m;
  }
  // join a range that wraps around the new year (e.g. Dec + Jan-Apr)
  if (good.includes(0) && good.includes(11) && ranges.length > 1) {
    const first = ranges.shift(), last = ranges.pop();
    const end = first.includes(' to ') ? first.split(' to ')[1] : first;
    const beg = last.includes(' to ') ? last.split(' to ')[0] : last;
    ranges.unshift(`${beg} to ${end}`);
  }
  return listJoin(ranges);
}

function stopsOf(city) {
  const seen = new Set(), out = [];
  for (const d of IT[city].days) for (const x of d.i) {
    const name = x[1];
    if (/airport|pier|harbour|station|^(District 1|Hanoi|Sapa|Beijing|Shanghai|Chengdu|Manila|Cebu City|El Nido|Seminyak|Senggigi|Sorong|Waisai|Medan|Kumai|Pangkalan Bun|Koh Samui|Ho Chi Minh City)$/i.test(name)) continue;
    if (!seen.has(name)) { seen.add(name); out.push(name); }
  }
  return out;
}

export function cityFaq(city) {
  const c = IT[city], name = plain(c.name), country = COUNTRIES.find((x) => x.slug === c.country);
  const best = bestMonths(city);
  const stops = stopsOf(city);
  const books = BOOK.filter((b) => c.days.some((d) => d.i.some((x) => (x[1] + ' ' + x[2]).includes(b[0])))).map((b) => b[2]);
  const faq = [];
  faq.push({ q: `When is the best time to visit ${name}?`, a: (best ? `The driest, most comfortable months in ${name} are usually ${best}. ` : '') + (c.note || '') + ' Travel Bestie adjusts each day to the season of your dates.' });
  faq.push({ q: `How many days do you need in ${name}?`, a: `${c.days.length} days covers the highlights: ${listJoin(c.days.map((d) => d.t))}. You can plan up to 30 days in one trip and add other cities.` });
  faq.push({ q: `What are the top things to do in ${name}?`, a: `Popular stops include ${listJoin(stops.slice(0, 8))}.` });
  if (books.length) faq.push({ q: `What should I book ahead in ${name}?`, a: `Book these before you go: ${listJoin([...new Set(books)].slice(0, 6))}.` });
  faq.push({ q: `Is there a free ${name} trip planner?`, a: `Yes. Travel Bestie is free: pick your dates, travellers, how you get around and your budget, and it builds a day-by-day ${name} itinerary with maps, entry fees and a budget estimate. Plans are saved on your own device.` });
  return { name, country, faq, stops, best };
}

export function countryFaq(slug) {
  const country = COUNTRIES.find((x) => x.slug === slug);
  const cities = Object.keys(IT).filter((k) => IT[k].country === slug);
  const faq = [];
  faq.push({ q: `Which cities should I visit in ${country.name}?`, a: `Travel Bestie has ready-made plans for ${listJoin(cities.map((k) => plain(IT[k].name)))}.` });
  const bestLines = cities.map((k) => { const b = bestMonths(k); return b ? `${plain(IT[k].name)}: ${b}` : null; }).filter(Boolean);
  if (bestLines.length) faq.push({ q: `When is the best time to visit ${country.name}?`, a: `It depends on the region. Usually the best months are ${bestLines.join('; ')}.` });
  faq.push({ q: `Can I plan a multi-city ${country.name} trip?`, a: `Yes. Add up to 30 days and several cities in one plan; Travel Bestie adds travel days between cities with suggestions for flights, trains or boats.` });
  faq.push({ q: `How do I plan a ${country.name} itinerary for free?`, a: `Open the ${country.name} guide on Travel Bestie, tap a city, choose your dates and budget, and tap Create my plan. You get daily times, places, maps, entry fees, bookings to make and a budget estimate.` });
  return { country, cities, faq };
}

export const HOME_FAQ = [
  { q: 'What is Travel Bestie?', a: 'Travel Bestie (travelbestie.site) is a free day-by-day trip planner. It has ready-made plans for Asia now, with more destinations on the way. Pick a city, set your dates, travellers, transport and budget, and it builds a day-by-day itinerary with maps, entry fees, things to book and a budget estimate.' },
  { q: 'Which countries does Travel Bestie cover?', a: `Ready-made plans and guides for ${listJoin(COUNTRIES.map((c) => c.name))}, plus any other destination you type in yourself.` },
  { q: 'Can I plan a trip to several cities?', a: 'Yes. One plan can be up to 30 days and cover several cities, with travel days between them.' },
  { q: 'Is Travel Bestie free, and where are my plans saved?', a: 'It is free and needs no account. Plans are saved privately on your own phone or computer; you can download a backup, a PDF, or share a copy with friends.' },
  { q: 'Can I share my trip plan and edit it with my friends?', a: 'Yes. Open your plan and tap "Share with friends". Send the edit link to your travel buddies so you can all change the plan together, and everyone sees the updates on their own phone. Send the view-only link to people who just want to follow along. You can also download the whole plan as a PDF or share your trip as an Instagram story.' },
  { q: 'Does Travel Bestie work in Bahasa Indonesia?', a: 'Yes. Switch between English and Bahasa Indonesia with the language menu at the top.' },
];

export function faqJsonLd(faq) {
  return { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) };
}
export function breadcrumbs(items) {
  return { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: SITE + it.path })) };
}
export const SITE_URL = SITE;
export const cityKeys = Object.keys(IT);
