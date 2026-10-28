import logging
from smtplib import SMTPException
from django.conf import settings
from django.core.mail import EmailMessage
from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.http import require_GET, require_POST
from .forms import ContactForm
from .content import CONTACT_DETAILS, GALLERY, SERVICES

logger = logging.getLogger(__name__)

@require_GET
def home(request):
    return render(request, 'index.html', {
        'contacts': {key: item for key, item in CONTACT_DETAILS.items() if item['verified']},
        'gallery': GALLERY,
        'services': SERVICES,
        'contact_ready': bool(settings.EMAIL_HOST and settings.DEFAULT_FROM_EMAIL and settings.CONTACT_EMAIL),
    })

def csrf_failure(request, reason=''):
    return JsonResponse({'ok': False, 'message': 'Obnovte stránku a skúste to znova.'}, status=403)

@require_POST
def contact(request):
    form = ContactForm(request.POST)
    if not form.is_valid():
        return JsonResponse({'ok': False, 'message': 'Skontrolujte vyplnené údaje.', 'errors': form.errors.get_json_data()}, status=400)
    if not all([settings.EMAIL_HOST, settings.DEFAULT_FROM_EMAIL, settings.CONTACT_EMAIL]):
        return JsonResponse({'ok': False, 'message': 'Odosielanie momentálne nie je dostupné. Kontaktujte nás telefonicky.'}, status=503)
    data = form.cleaned_data
    mail = EmailMessage(
        subject='Nová požiadavka zo stránky SpiritusVenti',
        body=f"Meno: {data['name']}\nTelefón: {data['phone']}\nEmail: {data['email']}\n\nSpráva:\n{data['message']}",
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[settings.CONTACT_EMAIL],
        reply_to=[data['email']] if data['email'] else [],
    )
    try:
        if mail.send() != 1:
            raise SMTPException('Message not accepted')
    except (SMTPException, OSError):
        logger.warning('Contact email delivery failed')
        return JsonResponse({'ok': False, 'message': 'Správu sa nepodarilo odoslať. Skúste to neskôr alebo nám zavolajte.'}, status=502)
    return JsonResponse({'ok': True, 'message': 'Ďakujeme! Vaša správa bola odoslaná.'})
