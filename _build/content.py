"""Content for the Summit Studios site: projects, services, industries, reasons, FAQ.
Copy lives here; layout lives in build.py. All copy is location-neutral (worldwide clients)."""

PROJECTS = [
    # Real client work: 'url' links to the live site, 'shots' are captures in assets/img/work/
    # (<key>-1 desktop home, <key>-2 a second desktop section, <key>-3 the phone view framed on
    # paper; all 960x600). The first six show on the Projects page; the rest sit behind
    # "Show all". An entry without 'url' renders as a "Coming soon" row.
    dict(sector='Industrial &amp; engineering', slug='industrial', type='Corporate website', name='Eagle Electricals',
         url='https://eagle-electricals.vercel.app/', key='eagle',
         line='A corporate site for a high-voltage contractor that has powered coastal and southern Karnataka since 1970: five engineering disciplines, predictive thermal inspection and the utilities that trust them, in one scroll.',
         shots=['home page', 'capability section']),
    dict(sector='Technology', slug='technology', type='Corporate website', name='Semnox',
         url='https://semnoxrevamp.vercel.app/', key='semnox',
         line='A corporate site for the entertainment-technology company behind 2,800+ venues in 60+ countries: three product suites, one platform, and a demo a click away.',
         shots=['home page', 'industries section']),
    dict(sector='Healthcare', slug='healthcare', type='Dental clinic website', name='Studio Dental',
         url='https://www.drvivekamin.com/', key='vivek',
         line='A site for an orthodontic and dental speciality clinic, two decades in practice: the clinic room by room, a full treatment index, and booking on every screen.',
         shots=['home page', 'treatment index']),
    dict(sector='Construction &amp; real estate', slug='property', type='Developer website', name='Pranava Builders',
         url='https://www.pranavabuilders.in/', key='pranava',
         line='A developer site for nine residential and commercial projects, each with its own page carrying the full brochure, floor plans and saleable areas.',
         shots=['home page', 'company section']),
    dict(sector='Interior &amp; exterior design', slug='interiors', type='Studio website', name='Creative Concepts',
         url='https://1414mishal.github.io/creative-concepts/index.html', key='cc', visit='Visit the live site',
         line='A studio site for an interior and exterior design firm with fifteen years of homes and workplaces behind it: services, featured projects and a portfolio that does the talking.',
         shots=['home page', 'services section']),
    dict(sector='Food &amp; e-commerce', slug='food', type='Online store', name='Niks Masala',
         url='https://niksmasala.com/', key='niks',
         line='An online store for a family masala brand: stone-ground blends by category, bestsellers with prices, recipe videos and delivery across India.',
         shots=['home page', 'shop by category']),
    dict(sector='Hospitality &amp; travel', slug='hospitality', type='Service website', name='Shetty&rsquo;s Hospitality',
         url='https://shettys-hospitality.vercel.app/', key='shettys',
         line='A site for a hospitality firm that runs homestays, home celebrations, rides and temple journeys, with one person arranging the whole trip.',
         shots=['home page', 'things to do']),
    dict(sector='Automotive &amp; industrial supply', slug='industrial', type='Business website', name='Deepa Traders',
         url='https://www.deepatradersmlr.com/', key='deepa',
         line='A site for a parts, lubricants, tyres and battery distributor with sixty-five years in the trade: thirty-plus authorised brand lines, how an order reaches your gate, and an enquiry one tap away.',
         shots=['home page', 'product range']),
    dict(sector='Healthcare', slug='healthcare', type='Doctor portfolio', name='Dr. Mahesh Santhraya G',
         url='https://www.drmaheshent.in/', key='doctor',
         line="A portfolio for an ENT surgeon: 20+ years of credentials, every condition he treats explained in plain language, and a way to book on every screen.",
         shots=['home page', 'about section']),
    dict(sector='Healthcare', slug='healthcare', type='Doctor portfolio', name='Dr. Swathi Rao',
         url='https://www.drswathirao.com/', key='swathi',
         line='A portfolio for a pediatrician and pediatric intensivist: what her clinic looks after, her intensive-care expertise and research, and WhatsApp booking for evening consults.',
         shots=['home page', 'research section']),
    dict(sector='Healthcare', slug='healthcare', type='Doctor portfolio', name='Dr. Mariam Anjum Ifthikar',
         url='https://www.drmariamanjumifthikar.com/', key='maria',
         line='A portfolio for a gynaecologic oncologist and robotic surgeon: her specialties explained in plain language, two decades of training and service, and press, videos and publications in one place.',
         shots=['home page', 'training timeline']),
]


SERVICES = [
    dict(id='websites', short='Websites', name='Websites that bring in customers', tag='Fast, clean, mobile-first. Built to do a job.',
         desc="Not just a good-looking site, but one that does a job. We build fast, clean, mobile-first sites that turn a visitor into a booked appointment or a paying customer, and that actually show up when people search on Google. We've shipped 30+ of them for clinics, brands and businesses.",
         chips=['Clinic & practice sites', 'Business & brand sites', 'E-commerce stores', 'SEO & Google setup']),
    dict(id='ai-receptionists', short='AI receptionists', name='AI receptionists', tag='Answers the phone and the chat, 24/7.',
         desc="A smart assistant that answers your phone and chats around the clock. It books appointments, answers the questions you get asked a hundred times a day, captures every lead, and hands off to a real person when it matters. It never sleeps and never puts anyone on hold, so you stop losing customers after hours or when the line's busy.",
         chips=['24/7 call & chat answering', 'Appointment booking', 'Answers to common questions', 'Lead capture', 'Human handoff']),
    dict(id='whatsapp', short='WhatsApp automation', name='WhatsApp automation', tag='On the app your customers already use every day.',
         desc='Automatic appointment reminders that cut no-shows, instant replies to enquiries, broadcasts for offers and updates, order and payment flows, and chatbots that qualify leads before they ever reach you. All of it set up end to end.',
         chips=['Appointment reminders', 'Auto-replies & chatbots', 'Broadcasts & campaigns', 'Order & payment flows', 'Lead qualification']),
    dict(id='crm', short='Custom CRMs & software', name='Custom CRMs &amp; software', tag='Shaped around how you actually work.',
         desc='Not an off-the-shelf tool you have to bend to fit. Track leads and patients, automate the repetitive admin, see everything in one dashboard, and connect the tools you already use. Built to save you hours every single week.',
         chips=['Lead & patient management', 'Dashboards & reporting', 'Workflow automation', 'Integrations', 'Role-based access']),
    dict(id='web-apps', short='Web apps & dashboards', name='Web apps &amp; dashboards', tag="A clean foundation that won't fall apart as you grow.",
         desc="Fast, dependable web apps built on a clean foundation. We sweat the architecture so you don't have to think about it later.",
         chips=['Dashboards & portals', 'Internal tools', 'Marketplaces', 'SaaS products']),
    dict(id='backend', short='Backend & maintenance', name='Backend, maintenance &amp; growth', tag="The engine room and the upkeep. We don't vanish once it's live.",
         desc='Secure APIs and databases that handle real traffic, plus ongoing fixes, tuning and new features over time.',
         chips=['APIs & databases', 'Integrations & cloud', 'Monitoring & performance', 'Ongoing support']),
]


INDUSTRIES = [
    dict(id='industrial', num='01', focus='Main focus', name='Industrial &amp; engineering', visual='Industrial',
         pitch='Engineering firms win on credibility. Your website is the first inspection.',
         p='Procurement teams and facilities managers check you out before they call. We build corporate sites that show capability, accreditations and scale, present your work like the serious operation it is, and make requesting a quote a one-step job.',
         case='Case study: Eagle Electricals',
         build=['Corporate websites', 'Capability &amp; case-study pages', 'Quote request flows', 'SEO for contractor searches by region', 'CRM for enquiries and tenders'],
         art=('bars', 'teal', 'cream')),
    dict(id='clinics', num='02', focus='Dentists, physios, aesthetics clinics, private GPs', name='Healthcare &amp; clinics', visual='Clinics',
         pitch='Clinics live on bookings. Your website should make them while the front desk is busy.',
         p='Patients compare three clinics in five minutes on their phone. We build clinic sites that look trustworthy, load fast, rank locally and book the appointment. Then we add an AI receptionist and WhatsApp reminders so no enquiry goes unanswered and fewer patients no-show.',
         case='Care plans available',
         build=['Clinic &amp; practice sites', 'Doctor portfolios', 'Online booking', 'AI receptionists', 'WhatsApp reminders', 'Care plans'],
         art=('arch', 'cream', 'orange')),
    dict(id='trades', num='03', focus='Builders, electricians, architects, accountants, consultants', name='Trades, property &amp; professional services', visual='Trades',
         pitch='Word of mouth gets you the call. The website is what they check before they make it.',
         p='Most trades and professional firms run on referrals, then lose the lead to a dated site. We build clean, mobile-first sites that back up the recommendation, show the work and make it easy to get in touch, with automation to answer the calls you miss while you are on site.',
         case='Mobile-first by default',
         build=['Business &amp; brand sites', 'Portfolio &amp; project pages', 'Quote &amp; enquiry forms', 'Google Business setup', 'AI receptionist for missed calls'],
         art=('tri', 'rust', 'cream')),
]


WHY = [
    ('Custom, never a template.', 'Designed for your brand, not downloaded.',
     "No generic themes or one-size-fits-all builds. Every site is designed around your brand, your buyers and what you need it to do."),
    ('Premium quality, delivered faster.', 'Sophisticated design, efficient build.',
     'We combine a high design bar with an efficient development process, so you get a premium site in significantly less time, without cutting corners.'),
    ('A direct line to the people building it.', 'No account managers in between.',
     'You talk to the designers and developers doing the work. Faster answers, fewer misunderstandings, and your ideas survive the journey.'),
    ("We don't vanish at launch.", 'Maintenance, tuning and new features over time.',
     'Launch is the start. We keep sites secure, fast and growing with ongoing support and care plans.'),
]


FAQ_ALL = [
    ('What does Summit Studios do?',
     'We design and build premium websites, then make them work harder: AI receptionists that answer calls and chats, WhatsApp automation for reminders and enquiries, and custom CRMs, web apps and dashboards. One team, end to end.'),
    ('Who do you work with?',
     'Established businesses worldwide: industrial and engineering firms, healthcare clinics, and trades, property and professional services.'),
    ('How much does a website cost?',
     "It depends on what the site has to do. Pricing guidance is on the way for each type of project. In the meantime, book a free 15-minute call and we'll give you a straight answer and a clear quote."),
    ('How long does it take?',
     "Faster than most agencies, because we design and build in-house with no hand-offs. You'll get a delivery date in the proposal, and we keep to it."),
    ('Can I update the site myself after launch?',
     "Yes. We either set you up to edit content yourself, or handle updates for you under a care plan. Either way, you're never stuck waiting on a developer to change a line of text."),
    ('Do you only build websites?',
     "No. Websites are where most clients start, but the biggest gains often come after: an AI receptionist that stops missed calls, WhatsApp reminders that cut no-shows, or a CRM built around how you actually work."),
    ('Can you work with us remotely?',
     "Yes. We work with clients worldwide and run every project remotely: calls at a time that suits you, clear written updates, and reviews at every stage."),
]


# Client voices on the home page: real reviews, carried over from the studio's previous site.
# (quote, name, role)
VOICES = [
    ('They understood what we needed without much back and forth. Clean, professional, and our patients find it easy to use.',
     'Dr. Dheeraj', 'Founder, Rivelin Aligners'),
    ('Quick, reliable, and they didn’t make me chase them for updates. The final result looked better than I expected.',
     'Dr. Mariam Anjum Iftikhar', 'Gynaec-Oncologist &amp; Robotic Surgeon'),
    ('We needed a team that could keep up with our pace and actually deliver. They did, no drama.',
     'Prasanna Technologies', 'Software firm'),
    ('Really appreciate the effort and patience your team showed, especially with all the revisions. Professional throughout.',
     'Dr. Shravan Shetty', 'Orthodontist'),
    ('Got exactly what I asked for, no unnecessary complications. Easy to work with and delivered on time.',
     'Dr. Joylene D’Almeida', 'Obstetrician &amp; Gynaecologist'),
    ('Clean work, fast turnaround. They kept things simple and the end result speaks for itself.',
     'Dr. Vivian R D’Almeida', 'Orthopaedic Surgeon'),
]
