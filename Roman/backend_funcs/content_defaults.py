"""Default (factory) content of the website.

Everything the superadmin can edit in the admin panel (/sprava/) lives here as
the fallback. Saved values from the DB (viewer.SiteContent) are deep-merged on
top of these defaults, so adding a new key here automatically makes it appear
on the web and in the admin panel without a data migration.

Bilingual values are dicts {'sk': ..., 'en': ...}.
"""


def t(sk, en=''):
    return {'sk': sk, 'en': en}


WORKERS = ('Roman', 'Evka')
VALID_DURATIONS = (30, 45, 60, 90, 120)

TECHNIQUE_ICONS = [
    'fa-spa', 'fa-hand-sparkles', 'fa-dumbbell', 'fa-fire-flame-curved', 'fa-gem',
    'fa-screwdriver-wrench', 'fa-stethoscope', 'fa-arrows-spin', 'fa-leaf', 'fa-heart',
    'fa-hands', 'fa-person-walking', 'fa-bone', 'fa-feather', 'fa-droplet', 'fa-sun',
    'fa-moon', 'fa-star', 'fa-gift', 'fa-hand-holding-heart',
]


DEFAULT_CONTENT = {
    # ------------------------------------------------------------------ general
    'general': {
        'site_name': 'Masáže Vlčince',
        'notification_email': '',
        'footer_text': t('Masáže Vlčince', 'Masáže Vlčince'),
        'seo_title': t('Masáže Vlčince – masáže a terapia v Žiline',
                       'Masáže Vlčince – massage and therapy in Žilina'),
        'seo_description': t(
            'Klasická, športová a myofasciálna masáž, bankovanie, lávové kamene a SM systém na Vlčinciach v Žiline. Online rezervácia termínu.',
            'Classic, sports and myofascial massage, cupping, hot stones and SM system in Vlčince, Žilina. Book your appointment online.'),
        'maintenance_notice': t('', ''),
    },

    # --------------------------------------------------------------------- hero
    'hero': {
        'title': t('Masáže Vlčince', 'Masáže Vlčince'),
        'subtitle': t('Priateľský a individuálny prístup pre našich klientov.',
                      'Friendly and personalized approach for our clients.'),
        'cta_primary': t('Rezervovať termín', 'Book appointment'),
        'cta_secondary': t('Pozrieť služby', 'Explore services'),
    },

    # ------------------------------------------------------- promo banner (top)
    'promo': {
        'enabled': True,
        'text': t('Darčeková poukážka alebo permanentka je príjemný darček pre blízkych.',
                  'A gift voucher or pass makes an easy and thoughtful present.'),
        'button': t('Zobraziť poukážky', 'View vouchers'),
        'target': '#vouchers',
        'icon': 'fa-gift',
        'style': 'default',
        # Seasonal campaigns repeat every year between MM-DD dates; the first
        # active one replaces the default banner automatically.
        'campaigns': [
            {
                'id': 'vianoce',
                'name': 'Vianoce',
                'enabled': True,
                'date_from': '11-15',
                'date_to': '12-24',
                'text': t('Hľadáte vianočný darček? Darčeková poukážka na masáž je ideálny darček pre vašich blízkych.',
                          'Looking for a Christmas gift? A massage gift voucher is the perfect present for your loved ones.'),
                'button': t('Vybrať poukážku', 'Choose a voucher'),
                'target': '#vouchers',
                'icon': 'fa-gifts',
                'style': 'festive',
            },
        ],
    },

    # ------------------------------------------------------------ home sections
    'sections': {
        'therapists': {'visible': True},
        'techniques': {
            'visible': True,
            'kicker': t('Naše služby', 'Our services'),
            'title': t('Masážne techniky', 'Massage techniques'),
            'text': t('Vyberte si terapiu, ktorá zapadne do vašej regenerácie aj tempa dňa.',
                      'Choose a therapy that fits your recovery needs and your pace.'),
        },
        'pricing': {
            'visible': True,
            'kicker': t('Cenník', 'Pricing'),
            'title': t('Cenník služieb', 'Price list'),
            'text': t('Aktuálne ceny masáží a permanentiek.', 'Current prices of massages and passes.'),
            'note': t('Ceny sú uvedené vrátane DPH (ak je uplatniteľná).', ''),
        },
        'gallery': {
            'visible': True,
            'title': t('Galéria', 'Gallery'),
            'text': t('', ''),
        },
        'vouchers': {
            'visible': True,
            'title': t('Darčekové poukážky', 'Gift vouchers'),
            'text': t('Poukážku si môžete stiahnuť, alebo si ju vyzdvihnúť priamo u nás.',
                      'Download a voucher or pick one up directly at our salon.'),
            'download_label': t('Stiahnuť poukážku', 'Download voucher'),
        },
        'reviews': {
            'visible': True,
            'title': t('Hodnotenia', 'Reviews'),
            'text': t('Skutočné skúsenosti klientov a ľudské odporúčania.', 'Real feedback from clients.'),
            'allow_new': True,
        },
        'business': {
            'visible': True,
            'title': t('Pre firmy', 'For companies'),
            'text': t(
                'Jedinečná príležitosť dopriať svojim zamestnancom kvalitný relax a regeneráciu priamo vo vašom pracovnom prostredí alebo formou poukážok pripravených na mieru. Spoluprácu nastavíme podľa veľkosti tímu, cieľa aj rozpočtu tak, aby priniesla reálnu pridanú hodnotu, lepší komfort a príjemnejšiu atmosféru vo firme.',
                'A unique opportunity to bring high-quality relaxation and recovery to your employees directly in the workplace or through tailored vouchers. We can adapt the cooperation to the size of your team, your goals, and your budget so that it brings real value, greater comfort, and a more positive atmosphere to your company.'),
            'button': t('Kontaktujte nás', 'Contact us'),
            'button_link': '#contact',
        },
        'contact': {
            'visible': True,
            'title': t('Kontakt', 'Contact'),
            'text': t('', ''),
        },
    },

    # ------------------------------------------------------------------ contact
    'contact': {
        'address': 'Matice Slovenskej 6, Vlčince',
        'city': '010 08 Žilina',
        'maps_url': 'https://maps.google.com/?q=Matice+Slovenskej+6+Vlcince+Zilina',
        'email': 'salonaminask@gmail.com',
        'phones': [
            {'label': 'Roman', 'number': '+421 902 442 280'},
            {'label': 'Evka', 'number': '+421 948 953 841'},
        ],
        'note': t('', ''),
        'instagram': 'https://www.instagram.com/masazevlcince/',
        'facebook': 'https://www.facebook.com/salonAminaSK',
        # Operator identification (shown in footer + legal pages)
        'company_name': '',
        'company_address': '',
        'company_ico': '',
        'company_dic': '',
        'company_register': '',
    },

    # --------------------------------------------------------------- therapists
    'therapists': [
        {
            'key': 'Roman',
            'name': 'Roman Zelník',
            'photo': '/static/images/roman.jpg',
            'photo_small': '/static/images/roman-mini.jpg',
            'instagram': 'https://www.instagram.com/masazevlcince/',
            'color': '#0f7e7a',
            'bio': t('', ''),
            'techniques': ['classic', 'sport', 'myofascial', 'cupping', 'iastm', 'rkt', 'sm'],
            'visible': True,
            'booking_enabled': True,
            'booking_note': t('', ''),
        },
        {
            'key': 'Evka',
            'name': 'Evka Koribská',
            'photo': '/static/images/evka.jpg',
            'photo_small': '/static/images/evka-mini.jpg',
            'instagram': '',
            'color': '#db2777',
            'bio': t('', ''),
            'techniques': ['classic', 'sport', 'myofascial', 'cupping', 'stones'],
            'visible': True,
            'booking_enabled': True,
            'booking_note': t('', ''),
        },
    ],

    # --------------------------------------------------------------- techniques
    'techniques': [
        {
            'id': 'classic', 'icon': 'fa-spa', 'image': '', 'visible': True,
            'title': t('Klasická masáž', 'Classic massage'),
            'short': t('Relaxačná a regeneračná starostlivosť', 'Relaxing and restorative care'),
            'body': t(
                'Klasická masáž pomáha uvoľniť svalové napätie, podporuje prekrvenie a prináša telu aj hlave príjemné spomalenie po náročnom dni. Je vhodná pre klientov, ktorí hľadajú kombináciu oddychu, regenerácie a celkového zlepšenia telesného komfortu.\n\nVeľmi dobre sa hodí pri stuhnutí, únave, psychickom strese aj ako pravidelná starostlivosť o telo. Intenzitu prispôsobujeme tomu, či potrebujete skôr jemné uvoľnenie, alebo dôkladnejšie rozmasírovanie problematických miest.',
                'Classic massage helps release muscular tension, improves circulation, and gives both body and mind a welcome reset after demanding days. It is a great option for clients looking for a balanced combination of relaxation, recovery, and overall physical comfort.\n\nIt works especially well for stiffness, fatigue, and stress, but also as part of regular body maintenance. The intensity is adjusted to whether you need a gentler calming treatment or a more thorough release of tense and overloaded areas.'),
        },
        {
            'id': 'myofascial', 'icon': 'fa-hand-sparkles', 'image': '', 'visible': True,
            'title': t('Myofasciálne techniky', 'Myofascial techniques'),
            'short': t('Uvoľnenie mäkkých tkanív a fascií', 'Soft tissue and fascia release'),
            'body': t(
                'Myofasciálne techniky sa zameriavajú na fascie, svalové obaly a obmedzenia, ktoré môžu znižovať pohyblivosť alebo vytvárať nepríjemné pnutie v tele. Ošetrenie je cielenejšie a často prináša pocit väčšej ľahkosti, voľnejšieho pohybu a lepšieho vnímania vlastného tela.\n\nSú vhodné pri preťažení, lokálnom diskomforte, pocite stiahnutia aj pri dlhodobom sedení alebo jednostrannej záťaži. Technika sa volí citlivo podľa toho, kde je tkanivo skrátené, citlivé alebo menej pružné.',
                'Myofascial techniques focus on fascia, soft tissue layers, and restrictions that can reduce mobility or create uncomfortable tension patterns in the body. This type of work is more targeted and often leads to a feeling of lighter movement, better range, and improved body awareness.\n\nThey are especially useful for overload, local discomfort, a feeling of tightness, and issues related to prolonged sitting or one-sided physical stress. The treatment is adapted carefully to the areas where tissue feels shortened, sensitive, or less elastic.'),
        },
        {
            'id': 'sport', 'icon': 'fa-dumbbell', 'image': '', 'visible': True,
            'title': t('Športová masáž', 'Sports massage'),
            'short': t('Pre aktívnych klientov a športovcov', 'For active clients and athletes'),
            'body': t(
                'Športová masáž je dynamickejšia a cielenejšia technika určená pre aktívnych klientov, športovcov aj ľudí, ktorí svoje telo pravidelne zaťažujú v práci alebo tréningu. Pomáha pripraviť svaly na výkon, ale aj urýchliť regeneráciu po námahe.\n\nJe vhodná pri stuhnutosti, únave, pocite ťažkých nôh alebo pri opakovanom preťažení konkrétnych partií. Cieľom je zlepšiť komfort pri pohybe, podporiť regeneráciu a uľahčiť návrat k ďalšiemu tréningu alebo bežnej aktivite.',
                'Sports massage is a more dynamic and targeted treatment designed for active clients, athletes, and anyone who puts regular physical stress on the body through work or training. It can help prepare muscles for performance as well as support recovery after exertion.\n\nIt is especially useful for stiffness, fatigue, a feeling of heavy legs, or repeated overload in specific muscle groups. The goal is to improve comfort in movement, support recovery, and make the return to training or normal activity feel easier and smoother.'),
        },
        {
            'id': 'cupping', 'icon': 'fa-fire-flame-curved', 'image': '/static/images/cupping.png', 'visible': True,
            'title': t('Bankovanie', 'Cupping therapy'),
            'short': t('Podpora prekrvenia a uvoľnenia', 'Circulation and tissue release support'),
            'body': t(
                'Bankovanie je tradičná technika využívajúca podtlak, ktorý podporuje prekrvenie, uvoľnenie povrchových aj hlbších vrstiev tkaniva a prináša citeľný pocit úľavy v preťažených oblastiach. Často sa používa ako doplnok k manuálnej terapii alebo masáži.\n\nPo ošetrení môžu zostať dočasné kruhové stopy, ktoré sú bežnou reakciou a postupne prirodzene miznú. Technika sa volí podľa citlivosti klienta a stavu tkaniva tak, aby mala zmysluplný efekt a zároveň bola dobre tolerovaná.',
                'Cupping is a traditional suction-based technique that supports circulation, releases both superficial and deeper tissue layers, and often brings noticeable relief in overloaded areas. It is frequently used as a complementary method alongside manual therapy or massage.\n\nTemporary circular marks may remain after treatment, which is a normal response and fades naturally over time. The intensity is always chosen according to the client’s sensitivity and the current condition of the tissue so the treatment stays effective and well tolerated.'),
        },
        {
            'id': 'stones', 'icon': 'fa-gem', 'image': '', 'visible': True,
            'title': t('Lávové kamene', 'Hot stones'),
            'short': t('Teplo a hlboká relaxácia', 'Warmth and deep relaxation'),
            'body': t(
                'Masáž lávovými kameňmi spája príjemné teplo, plynulé ťahy a hlboký relaxačný účinok na telo aj nervový systém. Nahriate kamene pomáhajú uvoľniť stuhnuté partie jemnejším a zároveň veľmi účinným spôsobom.\n\nTáto technika je vhodná najmä vtedy, keď potrebujete vypnúť, znížiť vnútorné napätie a dopriať si pokojnejšiu, hrejivú formu starostlivosti. Výsledkom býva pocit uvoľnenia, oddychu a celkového príjemného zľahčenia tela.',
                'Hot stone massage combines soothing warmth, flowing strokes, and a deeply calming effect on both the body and the nervous system. Heated stones help release tight areas in a gentler yet still very effective way.\n\nThis technique is ideal when you need to slow down, reduce inner tension, and enjoy a warmer, calmer form of care. The usual outcome is a strong sense of relaxation, rest, and an overall lighter feeling in the body.'),
        },
        {
            'id': 'iastm', 'icon': 'fa-screwdriver-wrench', 'image': '/static/images/iastm.png', 'visible': True,
            'title': t('IASTM', 'IASTM'),
            'short': t('Moderná terapia mäkkých tkanív', 'Modern soft tissue therapy'),
            'body': t(
                'IASTM je modernejší prístup k práci s mäkkými tkanivami pomocou špeciálnych nástrojov, ktoré umožňujú presnejšie zacieliť problematické miesta. Využíva sa najmä tam, kde chceme podporiť kvalitu pohybu, pružnosť tkaniva a celkovú funkciu ošetrovanej oblasti.\n\nTechnika môže byť vhodná pri pocite stiahnutia, po preťažení alebo ako doplnok pri riešení dlhodobejších funkčných obmedzení. Ošetrenie vždy prispôsobujeme tak, aby bolo účelné, bezpečné a primerané aktuálnemu stavu klienta.',
                'IASTM is a more modern soft tissue approach using specialized tools that allow more precise work on problematic areas. It is mainly used when the goal is to support movement quality, tissue mobility, and the overall function of the treated region.\n\nThis technique can be helpful for feelings of tightness, overload, or as part of addressing longer-lasting functional restrictions. The treatment is always adapted so that it remains purposeful, safe, and appropriate to the client’s current condition.'),
        },
        {
            'id': 'rkt', 'icon': 'fa-stethoscope', 'image': '', 'visible': True,
            'title': t('RKT techniky', 'RKT techniques'),
            'short': t('Komplexné rehabilitačné postupy', 'Comprehensive rehabilitation approach'),
            'body': t(
                'RKT techniky spájajú manuálnu prácu, mobilizáciu a cielene vedený pohyb do jedného funkčného systému. Ich cieľom nie je len krátkodobá úľava, ale aj lepšie pochopenie toho, ako telo pracuje a kde vzniká zbytočné preťaženie alebo kompenzácia.\n\nVhodné sú pri rôznych pohybových obmedzeniach, asymetriách, bolestivých stereotypoch či po dlhšom preťažení. Terapia sa prispôsobuje konkrétnemu problému klienta a často prepája ošetrenie s jednoduchými odporúčaniami pre bežné fungovanie.',
                'RKT techniques combine manual work, mobilization, and guided movement into one functional system. The goal is not only short-term relief, but also a better understanding of how the body works and where unnecessary overload or compensation patterns develop.\n\nThey are suitable for various movement restrictions, asymmetries, painful movement habits, or prolonged overload. The therapy is always adapted to the client’s specific issue and often connects hands-on treatment with simple recommendations for everyday functioning.'),
        },
        {
            'id': 'sm', 'icon': 'fa-arrows-spin', 'image': '', 'visible': True,
            'title': t('SM systém', 'SM system'),
            'short': t('Stabilizácia chrbtice a držania tela', 'Spinal stability and posture support'),
            'body': t(
                'SM systém je cielená pohybová metóda zameraná na aktiváciu svalových reťazcov, stabilitu chrbtice a kvalitnejšie držanie tela. Pracuje sa plynulo, kontrolovane a s dôrazom na správne zapojenie tela, nie na bezmyšlienkové opakovanie pohybov.\n\nJe vhodný pri sedavom spôsobe života, pri pocite oslabeného stredu tela, pri stuhnutí chrbta aj ako doplnok k terapii alebo pravidelnému cvičeniu. Pomáha budovať lepšie pohybové návyky a podporuje istejší, voľnejší pohyb v bežnom živote.',
                'The SM system is a focused movement method aimed at activating muscle chains, improving spinal stability, and supporting healthier posture. It is performed in a smooth and controlled way with emphasis on correct engagement of the body rather than mindless repetition.\n\nIt is especially useful for sedentary lifestyles, feelings of a weak core, back stiffness, or as a complement to therapy and regular exercise. It helps build better movement habits and supports more confident, freer movement in everyday life.'),
        },
    ],

    # ---------------------------------------------------- services & price list
    # `backend_name` is what gets stored in Reservation.massage_name.
    'services': [
        {'id': '30-basic', 'workers': ['Roman', 'Evka'], 'duration': 30, 'price': '25 €', 'backend_name': '30 min masáž',
         'name': t('30 min masáž', '30 min massage'), 'active': True, 'pass_id': ''},
        {'id': '45-basic', 'workers': ['Roman', 'Evka'], 'duration': 45, 'price': '30 €', 'backend_name': '45 min masáž',
         'name': t('45 min masáž', '45 min massage'), 'active': True, 'pass_id': ''},
        {'id': '45-sm', 'workers': ['Roman'], 'duration': 45, 'price': '20 €', 'backend_name': '45 min SM systém',
         'name': t('45 min SM individuálne cvičenie', '45 min SM individual training'), 'active': True, 'pass_id': 'sm'},
        {'id': '60-basic', 'workers': ['Roman', 'Evka'], 'duration': 60, 'price': '35 €', 'backend_name': '60 min masáž',
         'name': t('60 min masáž', '60 min massage'), 'active': True, 'pass_id': ''},
        {'id': '90-basic', 'workers': ['Roman', 'Evka'], 'duration': 90, 'price': '60 €', 'backend_name': '90 min masáž',
         'name': t('90 min masáž', '90 min massage'), 'active': True, 'pass_id': ''},
        {'id': '90-sm', 'workers': ['Roman'], 'duration': 90, 'price': '60 €', 'backend_name': '90 min masáž + SM systém',
         'name': t('90 min masáž + SM systém', '90 min massage + SM system'), 'active': True, 'pass_id': ''},
        {'id': '120-basic', 'workers': ['Roman', 'Evka'], 'duration': 120, 'price': '80 €', 'backend_name': '120 min masáž',
         'name': t('120 min masáž', '120 min massage'), 'active': True, 'pass_id': ''},
    ],

    # ------------------------------------------------------- passes (permanentky)
    'passes': [
        {
            'id': 'sm',
            'enabled': True,
            'show_on_home': True,
            'icon': 'fa-arrows-spin',
            'title': t('SM systém „permanentka“', 'SM system — pass'),
            'subtitle': t('Aktuálne možnosti permanentky', 'Current pass options'),
            'rows': [
                {'label': t('Jeden vstup', 'Single entry'), 'price': '20 €'},
                {'label': t('3 vstupy', '3 entries'), 'price': '45 €'},
                {'label': t('5 vstupov', '5 entries'), 'price': '75 €'},
            ],
            'notes': [
                t('Pri prvej návšteve Vám vystavíme papierovú permanentku.',
                  'On your first visit we will issue you a physical pass card.'),
                t('Toto oznámenie má informatívny charakter. Podrobnejšie informácie vám radi poskytneme osobne alebo telefonicky.',
                  'This notice is informational. For more details, feel free to contact us in person or by phone.'),
            ],
        },
    ],

    # ------------------------------------------------------------ booking texts
    'booking': {
        'title': t('Rezervácia', 'Reservation'),
        'subtitle': t('Vyberte terapeuta, termín a službu.', 'Pick your therapist, time, and service.'),
        'notice': t('', ''),
        'success_message': t('Ďakujeme! Rezervácia bola prijatá a čaká na potvrdenie. Potvrdenie vám príde e-mailom.',
                             'Thank you! Your reservation was received and is awaiting confirmation. You will receive a confirmation e-mail.'),
        'require_consent': True,
    },

    # -------------------------------------------------------------------- legal
    'legal': {
        'cookie_banner': {
            'enabled': True,
            'text': t('Táto stránka používa iba nevyhnutné cookies potrebné na jej fungovanie (prihlásenie, bezpečnosť formulárov, jazyk). Nepoužívame reklamné ani analytické cookies.',
                      'This website only uses essential cookies required for it to work (login, form security, language). We do not use advertising or analytics cookies.'),
            'button': t('Rozumiem', 'Got it'),
        },
        'terms': {
            'title': t('Obchodné a rezervačné podmienky', 'Terms and booking conditions'),
            'updated': '2026-11-08',
            'body': t(
                '## Úvodné ustanovenia\n'
                'Tieto podmienky upravujú rezerváciu a poskytovanie masážnych a regeneračných služieb prevádzkou Masáže Vlčince (ďalej len „prevádzkovateľ“). Identifikačné údaje prevádzkovateľa sú uvedené vyššie a v sekcii Kontakt.\n\n'
                '## Rezervácia termínu\n'
                '- Termín si môžete rezervovať online cez rezervačný formulár, telefonicky alebo osobne.\n'
                '- Online rezervácia je záväzná až po jej potvrdení prevádzkovateľom. O potvrdení vás budeme informovať e-mailom.\n'
                '- Pri rezervácii je potrebné uviesť pravdivé kontaktné údaje (meno, e-mail, telefón).\n\n'
                '## Zrušenie a zmena termínu\n'
                '- Rezerváciu môžete bezplatne zrušiť alebo zmeniť najneskôr 24 hodín pred dohodnutým termínom – telefonicky alebo cez svoj profil na webe.\n'
                '- Prevádzkovateľ si vyhradzuje právo termín zrušiť alebo presunúť (napr. pre chorobu). V takom prípade vás bude bezodkladne kontaktovať.\n'
                '- Pri opakovanej neúčasti bez ospravedlnenia môže prevádzkovateľ odmietnuť ďalšie online rezervácie.\n\n'
                '## Cena a platba\n'
                '- Platí cena uvedená v aktuálnom cenníku na webe v čase rezervácie.\n'
                '- Platba prebieha na mieste po poskytnutí služby, prípadne darčekovou poukážkou alebo permanentkou.\n\n'
                '## Darčekové poukážky a permanentky\n'
                '- Platnosť poukážky je uvedená priamo na poukážke. Poukážku nie je možné vymeniť za hotovosť.\n'
                '- Permanentka je neprenosná, ak nie je dohodnuté inak.\n\n'
                '## Zdravotný stav\n'
                'Pred masážou nás prosím informujte o svojom zdravotnom stave, tehotenstve, úrazoch či chronických ochoreniach. Masáž nenahrádza lekársku starostlivosť. Prevádzkovateľ môže odmietnuť poskytnutie služby, ak by mohla ohroziť vaše zdravie.\n\n'
                '## Reklamácie\n'
                'Prípadné výhrady k poskytnutej službe nám prosím oznámte bez zbytočného odkladu osobne, telefonicky alebo e-mailom. Reklamáciu vybavíme najneskôr do 30 dní. Spotrebiteľ má právo obrátiť sa na Slovenskú obchodnú inšpekciu alebo využiť alternatívne riešenie sporov.\n\n'
                '## Záverečné ustanovenia\n'
                'Odoslaním rezervácie potvrdzujete, že ste sa s týmito podmienkami oboznámili a súhlasíte s nimi. Prevádzkovateľ môže podmienky meniť; platí verzia zverejnená v čase rezervácie.',
                '## Introduction\n'
                'These terms govern booking and provision of massage and recovery services by Masáže Vlčince (the “operator”). The operator’s identification details are listed above and in the Contact section.\n\n'
                '## Booking\n'
                '- You can book online, by phone or in person.\n'
                '- An online reservation becomes binding once the operator confirms it. You will be notified by e-mail.\n'
                '- Please provide accurate contact details (name, e-mail, phone).\n\n'
                '## Cancellation and changes\n'
                '- You can cancel or change your reservation free of charge at least 24 hours before the appointment – by phone or in your profile on this website.\n'
                '- The operator may cancel or move an appointment (e.g. due to illness) and will contact you without delay.\n'
                '- Repeated no-shows may lead to refusal of further online bookings.\n\n'
                '## Price and payment\n'
                '- The price listed in the current price list at the time of booking applies.\n'
                '- Payment is made on site after the service, or by gift voucher or pass.\n\n'
                '## Gift vouchers and passes\n'
                '- Voucher validity is stated on the voucher. Vouchers cannot be exchanged for cash.\n'
                '- Passes are non-transferable unless agreed otherwise.\n\n'
                '## Health condition\n'
                'Please inform us about your health condition, pregnancy, injuries or chronic illnesses before the massage. Massage does not replace medical care.\n\n'
                '## Complaints\n'
                'Please report any complaints without undue delay in person, by phone or by e-mail. We will resolve them within 30 days.\n\n'
                '## Final provisions\n'
                'By submitting a reservation you confirm you have read and agree to these terms.'),
        },
        'privacy': {
            'title': t('Ochrana osobných údajov', 'Privacy policy'),
            'updated': '2026-11-08',
            'body': t(
                '## Kto spracúva vaše údaje\n'
                'Prevádzkovateľom osobných údajov je prevádzka Masáže Vlčince, ktorej identifikačné a kontaktné údaje sú uvedené vyššie. Osobné údaje spracúvame v súlade s nariadením GDPR (EÚ) 2016/679 a zákonom č. 18/2018 Z. z.\n\n'
                '## Aké údaje spracúvame\n'
                '- meno a priezvisko, e-mail a telefónne číslo,\n'
                '- údaje o rezerváciách (termín, služba, terapeut, poznámka),\n'
                '- pri registrácii aj prihlasovacie údaje (heslo ukladáme iba v zašifrovanej podobe),\n'
                '- pri pridaní hodnotenia meno a text hodnotenia, ktoré sa zverejní na webe.\n\n'
                '## Prečo ich spracúvame\n'
                '- vybavenie rezervácie a poskytnutie služby (plnenie zmluvy, čl. 6 ods. 1 písm. b GDPR),\n'
                '- zasielanie potvrdení a informácií o rezervácii e-mailom,\n'
                '- vedenie používateľského účtu,\n'
                '- zverejnenie hodnotenia (súhlas, ktorý môžete kedykoľvek odvolať).\n\n'
                '## Ako dlho ich uchovávame\n'
                'Údaje o rezerváciách uchovávame po dobu nevyhnutnú na poskytnutie služby a splnenie zákonných povinností, najdlhšie 3 roky od poslednej návštevy. Účet môžete kedykoľvek zrušiť.\n\n'
                '## Komu ich poskytujeme\n'
                'Údaje neposkytujeme tretím stranám na marketingové účely. Prístup k nim majú iba terapeuti prevádzky a poskytovatelia technických služieb (hosting, e-mail), ktorí ich spracúvajú len na náš pokyn.\n\n'
                '## Vaše práva\n'
                'Máte právo na prístup k údajom, ich opravu, vymazanie, obmedzenie spracúvania, prenosnosť, právo namietať a odvolať súhlas. Žiadosť nám môžete poslať e-mailom. Máte tiež právo podať sťažnosť na Úrad na ochranu osobných údajov SR (www.dataprotection.gov.sk).',
                '## Who processes your data\n'
                'The controller is Masáže Vlčince; identification and contact details are listed above. We process personal data in accordance with the GDPR (EU) 2016/679.\n\n'
                '## What data we process\n'
                '- name, e-mail and phone number,\n'
                '- reservation details (date, service, therapist, note),\n'
                '- account credentials when you register (passwords are stored only in hashed form),\n'
                '- your name and review text when you add a public review.\n\n'
                '## Why we process it\n'
                '- to handle your reservation and provide the service (contract, Art. 6(1)(b) GDPR),\n'
                '- to send confirmations and reservation information by e-mail,\n'
                '- to manage your user account,\n'
                '- to publish your review (consent, which you can withdraw at any time).\n\n'
                '## Retention\n'
                'We keep reservation data only as long as necessary, at most 3 years after your last visit. You can delete your account at any time.\n\n'
                '## Recipients\n'
                'We do not share data with third parties for marketing. Only the salon’s therapists and technical providers (hosting, e-mail) acting on our instructions have access.\n\n'
                '## Your rights\n'
                'You have the right to access, rectify, erase, restrict processing, data portability, to object and to withdraw consent. Contact us by e-mail. You may also lodge a complaint with the Slovak Data Protection Authority.'),
        },
        'cookies': {
            'title': t('Zásady používania cookies', 'Cookie policy'),
            'updated': '2026-11-08',
            'body': t(
                '## Čo sú cookies\n'
                'Cookies sú malé textové súbory, ktoré si webová stránka ukladá vo vašom prehliadači.\n\n'
                '## Aké cookies používame\n'
                'Používame výhradne technicky nevyhnutné cookies, bez ktorých by stránka nefungovala. Na ich použitie nie je potrebný súhlas.\n'
                '- sessionid – udržiava prihlásenie a zvolený jazyk (do odhlásenia / max. 2 týždne),\n'
                '- csrftoken – chráni formuláre pred zneužitím (1 rok),\n'
                '- cookie_notice – pamätá si, že ste zatvorili informačnú lištu (ukladá sa v prehliadači).\n\n'
                '## Analytické a reklamné cookies\n'
                'Nepoužívame žiadne analytické, reklamné ani sledovacie cookies.\n\n'
                '## Ako cookies vymazať\n'
                'Cookies môžete kedykoľvek vymazať alebo zablokovať v nastaveniach svojho prehliadača. Zablokovanie nevyhnutných cookies môže obmedziť fungovanie rezervácie a prihlásenia.',
                '## What are cookies\n'
                'Cookies are small text files a website stores in your browser.\n\n'
                '## Cookies we use\n'
                'We use only strictly necessary cookies required for the website to work. No consent is needed for them.\n'
                '- sessionid – keeps you logged in and remembers your language,\n'
                '- csrftoken – protects forms from abuse,\n'
                '- cookie_notice – remembers that you closed the notice bar (stored in your browser).\n\n'
                '## Analytics and advertising\n'
                'We do not use any analytics, advertising or tracking cookies.\n\n'
                '## Deleting cookies\n'
                'You can delete or block cookies in your browser settings at any time.'),
        },
    },

    # ------------------------------------------------- overrides of UI labels
    # {'sk': {'nav.reserve': '...'}, 'en': {...}} – merged into vue-i18n messages.
    'texts': {'sk': {}, 'en': {}},
}

# Sections the admin can edit / that are sent to the public website.
CONTENT_SECTIONS = tuple(DEFAULT_CONTENT.keys())
# Keys never exposed publicly.
PRIVATE_KEYS = {('general', 'notification_email')}
