"""Machine-readable layer for search engines and AI assistants (GEO), built from the same content as the pages.

Everything here restates facts that are already on the site, in forms machines read first:
  page_jsonld(file, title, desc)  schema.org @graph for one page (studio, website, page, breadcrumbs, and
                                  per page the services, FAQ, projects or industries shown on it)
  llms_txt()                      /llms.txt, a plain-language summary of the studio with links
  robots_txt()                    /robots.txt, open to search engines and AI assistants, naming them
  sitemap_xml(lastmod)            /sitemap.xml with a last-modified date per page
Never add a claim here that the pages do not make (no invented awards, years, addresses or ratings).
"""
import html
import json
import re

from content import PROJECTS, SERVICES, INDUSTRIES, FAQ_ALL

SITE = 'https://www.summitxstudio.com/'
EMAIL = 'team@summitxstudio.com'
ORG = SITE + '#studio'
WEBSITE = SITE + '#website'
SUMMARY = ('Summit Studios is a small web design and development studio. We design and build custom websites for '
           'clinics and doctors, engineering and industrial firms, construction and property, technology, interiors, '
           'food and hospitality businesses worldwide, and add the AI receptionists, WhatsApp automation and custom '
           'software that sit behind them. 30+ websites shipped. Every enquiry gets a reply within one working day.')

# The services as the home page and footer name them (AI Concierge is our AI receptionist).
OFFERS = [
    ('Websites', 'websites', 'Custom-designed, hand-built websites that turn visitors into calls, bookings and enquiries: clinic and practice sites, business and brand sites, e-commerce stores, with SEO and Google setup.'),
    ('Growth marketing', 'growth', 'SEO foundations, local search and Google Maps, AI search visibility, content that ranks, reviews and monthly reporting on calls, bookings and rankings.'),
    ('AI Concierge (AI receptionist)', 'receptionists', 'An AI receptionist that answers calls and chats 24/7, books appointments, answers common questions, captures every lead and hands off to a person when it matters.'),
    ('WhatsApp automation', 'more', 'Appointment reminders that cut no-shows, instant replies to enquiries, broadcasts, order and payment flows, and chatbots that qualify leads.'),
    ('Custom software', 'more', 'Custom CRMs, web apps and dashboards, backend APIs and integrations, with ongoing maintenance and support.'),
]

PAGE_TYPE = {'index.html': 'WebPage', 'projects.html': 'CollectionPage', 'industries.html': 'CollectionPage',
             'studio.html': 'AboutPage', 'contact.html': 'ContactPage', 'get-started.html': 'WebPage'}
CRUMB = {'projects.html': 'Projects', 'industries.html': 'Industries', 'studio.html': 'Studio',
         'contact.html': 'Contact', 'get-started.html': 'Get started'}
SITEMAP = [('', '1.0'), ('industries', '0.9'), ('get-started', '0.9'), ('projects', '0.8'), ('studio', '0.7'), ('contact', '0.6')]


def plain(s):
    """Page copy carries entities and the odd tag; schema and llms.txt want plain text."""
    return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', '', s))).strip()


def lc(item):
    """Lower-case a list item's first letter for use mid-sentence, leaving names and acronyms alone."""
    return item if item.split()[0] in ('AI', 'SEO', 'CRM', 'WhatsApp', 'Google') else item[:1].lower() + item[1:]


def url_of(file):
    return SITE + ('' if file == 'index.html' else file[:-5])


def studio():
    return {
        '@type': 'ProfessionalService', '@id': ORG, 'name': 'Summit Studios', 'url': SITE, 'email': EMAIL,
        'logo': SITE + 'assets/img/favicon.svg', 'image': SITE + 'assets/img/paint/hero.jpg',
        'description': SUMMARY, 'slogan': 'Websites that win work.', 'areaServed': 'Worldwide',
        'knowsAbout': ['Web design', 'Website development', 'Search engine optimisation', 'Local SEO',
                       'AI search visibility', 'AI receptionists', 'WhatsApp Business automation',
                       'CRM development', 'Web applications', 'Dashboards'],
        'contactPoint': {'@type': 'ContactPoint', 'contactType': 'sales', 'email': EMAIL, 'availableLanguage': 'English'},
        'hasOfferCatalog': {'@type': 'OfferCatalog', 'name': 'Services', 'itemListElement': [
            {'@type': 'Offer', 'itemOffered': {'@type': 'Service', 'name': n, 'description': d, 'url': SITE + '#' + a,
                                               'provider': {'@id': ORG}, 'areaServed': 'Worldwide'}}
            for n, a, d in OFFERS]},
    }


def website():
    return {'@type': 'WebSite', '@id': WEBSITE, 'url': SITE, 'name': 'Summit Studios', 'inLanguage': 'en',
            'publisher': {'@id': ORG}}


def webpage(file, title, desc):
    u = url_of(file)
    node = {'@type': PAGE_TYPE.get(file, 'WebPage'), '@id': u + '#page', 'url': u, 'name': plain(title),
            'description': plain(desc), 'isPartOf': {'@id': WEBSITE}, 'about': {'@id': ORG}, 'inLanguage': 'en'}
    if file in CRUMB:
        node['breadcrumb'] = {'@type': 'BreadcrumbList', 'itemListElement': [
            {'@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': SITE},
            {'@type': 'ListItem', 'position': 2, 'name': CRUMB[file], 'item': u}]}
    if file == 'studio.html' or file == 'contact.html':
        node['mainEntity'] = {'@id': ORG}
    return node


def faq():
    return {'@type': 'FAQPage', '@id': SITE + '#faq', 'mainEntity': [
        {'@type': 'Question', 'name': plain(q), 'acceptedAnswer': {'@type': 'Answer', 'text': plain(a)}} for q, a in FAQ_ALL]}


def projects_list():
    live = [p for p in PROJECTS if p.get('url')]
    return {'@type': 'ItemList', '@id': SITE + 'projects#work', 'name': 'Websites built by Summit Studios',
            'numberOfItems': len(live), 'itemListElement': [
                {'@type': 'ListItem', 'position': i + 1, 'item': {
                    '@type': 'WebSite', 'name': plain(p['name']), 'url': p['url'], 'description': plain(p['line']),
                    'genre': plain(p['sector']), 'creator': {'@id': ORG}}}
                for i, p in enumerate(live)]}


def industries_list():
    return {'@type': 'ItemList', '@id': SITE + 'industries#list', 'name': 'Industries Summit Studios builds websites for',
            'itemListElement': [
                {'@type': 'ListItem', 'position': i + 1, 'item': {
                    '@type': 'Service', 'name': 'Websites for ' + plain(d['name']).lower().replace('&', 'and'),
                    'url': SITE + 'industries#ind-' + d['id'], 'description': plain(d['pitch']),
                    'serviceType': 'Web design and development', 'audience': {'@type': 'BusinessAudience', 'name': plain(d['name'])},
                    'provider': {'@id': ORG}}}
                for i, d in enumerate(INDUSTRIES)]}


def page_jsonld(file, title, desc):
    if file == '404.html':
        return ''
    graph = [studio(), website(), webpage(file, title, desc)]
    if file == 'index.html':
        graph.append(faq())
    if file == 'projects.html':
        graph.append(projects_list())
    if file == 'industries.html':
        graph.append(industries_list())
    data = json.dumps({'@context': 'https://schema.org', '@graph': graph}, ensure_ascii=False, separators=(',', ':'))
    return '<script type="application/ld+json">' + data.replace('</', '<\\/') + '</script>'


def llms_txt(process):
    live = [p for p in PROJECTS if p.get('url')]
    out = ['# Summit Studios', '', '> ' + SUMMARY, '',
           'Summit Studios works with established businesses worldwide and runs every project remotely, with calls at a '
           'time that suits the client, clear written updates and reviews at every stage. Contact ' + EMAIL + '.', '',
           '## Services', '']
    out += [f'- [{n}]({SITE}#{a}): {d}' for n, a, d in OFFERS]
    out += ['', '## Industries', '']
    out += [f'- [{plain(d["name"])}]({SITE}industries#ind-{d["id"]}): {plain(d["pitch"])} We build {", ".join(lc(plain(b)) for b in d["build"])}.'
            for d in INDUSTRIES]
    out += ['', '## Selected work', '']
    out += [f'- [{plain(p["name"])}]({p["url"]}) ({plain(p["sector"])}, {plain(p["type"]).lower()}): {plain(p["line"])}' for p in live]
    out += ['', '## How a website project runs', '']
    out += [f'{i + 1}. {plain(t)}. {plain(d)}' for i, (t, d) in enumerate(process)]
    out += ['', '## Questions people ask', '']
    for q, a in FAQ_ALL:
        out += [f'### {plain(q)}', '', plain(a), '']
    out += ['## Pages', '',
            f'- [Home]({SITE}): services, how we build, client voices and FAQ',
            f'- [Industries]({SITE}industries): what we build for each industry, with our work there',
            f'- [Projects]({SITE}projects): live client websites we designed and built',
            f'- [Studio]({SITE}studio): who we are, our story and what we hold to',
            f'- [Get started]({SITE}get-started): tell us what you need, or ask for a free website review',
            f'- [Contact]({SITE}contact): write to us, reply within one working day', '']
    return '\n'.join(out)


# Crawlers for search and AI answers, named so a firewall rule or a future blanket block is easy to spot.
AI_AGENTS = ['Googlebot', 'Bingbot', 'Google-Extended', 'GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot',
             'Claude-SearchBot', 'Claude-User', 'PerplexityBot', 'Perplexity-User', 'Applebot', 'Applebot-Extended',
             'DuckAssistBot', 'meta-externalagent', 'MistralAI-User', 'CCBot']


def robots_txt():
    return ('# Summit Studios: search engines and AI assistants are welcome to read and cite this site.\n'
            'User-agent: *\nAllow: /\nDisallow: /404\n\n'
            + ''.join(f'User-agent: {a}\n' for a in AI_AGENTS) + 'Allow: /\nDisallow: /404\n\n'
            f'Sitemap: {SITE}sitemap.xml\n')


def sitemap_xml(lastmod):
    rows = ''.join(f'  <url><loc>{SITE}{p}</loc><lastmod>{lastmod.get(p or "index", "")}</lastmod><priority>{pr}</priority></url>\n'
                   for p, pr in SITEMAP)
    return f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{rows}</urlset>\n'
