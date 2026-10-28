"""Editable content. Confirm company details before publishing them.

Unverified legacy values are preserved here for the owner, never as public facts.
Mark individual contact entries as verified only after checking them with the owner.
Keep numerical claims out of the template until their scope and evidence are agreed.
"""

CONTACT_DETAILS = {
    'phone': {'value': '+421 900 123 456', 'href': 'tel:+421900123456', 'verified': False},
    'email': {'value': 'info@spiritusventi.sk', 'href': 'mailto:info@spiritusventi.sk', 'verified': False},
    'address': {'value': 'Žilina, Priemyselná 10', 'verified': False},
    'instagram': {'value': '@spiritusventi', 'href': 'https://instagram.com/spiritusventi', 'verified': False},
}

# TODO(owner): verify every value and the associated conditions; these are NOT published.
UNVERIFIED_COMPANY_DETAILS = {
    'completed_projects': '240+',
    'years_in_business': '12',
    'installation_warranty_years': '5',
    'on_time_completion_percent': '99',
    'team_size': '15+',
    'emergency_response_hours': '24',
    'problem_resolution_hours': '72',
    'team_claim': 'Vlastný montážny tím — bez subdodávateľov',
    'warranty_claim': 'Po montáži ručíme za výsledok v dokumentácii.',
    'project_scope': 'Od jednoizbového bytu po výrobnú halu s plochou niekoľko tisíc m².',
    'callback_claim': 'Zavoláme vám počas pracovného dňa a navrhneme termín návštevy technika.',
}

SERVICES = [
    {'number': '01', 'title': 'Vetranie a rekuperácia', 'description': 'Návrh a montáž vetrania pre domov aj pracovný priestor.'},
    {'number': '02', 'title': 'Vzduchovody a izolácie', 'description': 'Rozvody vzduchu, utesnenie spojov a tepelná izolácia.'},
    {'number': '03', 'title': 'Technológie a montáž', 'description': 'Ventilátory, vetracie jednotky a priemyselné systémy.'},
    {'number': '04', 'title': 'Servis a údržba', 'description': 'Čistenie, výmena filtrov a diagnostika zariadení.'},
]

# Existing images are illustrative: there is no verified project/client attribution.
GALLERY = [
    {'image': 'rooftop-hvac', 'title': 'Strešná vzduchotechnika', 'alt': 'Vzduchotechnické jednotky a potrubia na streche budovy'},
    {'image': 'commercial-installation', 'title': 'Rozvody vzduchu', 'alt': 'Kovové rozvody vzduchotechniky v interiéri budovy'},
    {'image': 'service-maintenance', 'title': 'Servis zariadení', 'alt': 'Servisný zásah na vzduchotechnickom zariadení'},
    {'image': 'system-commissioning', 'title': 'Kontrola systému', 'alt': 'Kontrola technického vybavenia vetracieho systému'},
]

for item in GALLERY:
    item['image_width'] = 536 if item['image'] == 'system-commissioning' else 1280
    item['thumbnail'] = f"gallery/optimized/{item['image']}-640.webp"
    item['image'] = f"gallery/optimized/{item['image']}.webp"
