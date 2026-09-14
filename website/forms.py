import re
from django import forms

class ContactForm(forms.Form):
    name = forms.CharField(min_length=2, max_length=100)
    phone = forms.CharField(max_length=30)
    email = forms.EmailField(required=False, max_length=254)
    message = forms.CharField(required=False, max_length=5000)

    def clean_phone(self):
        value = self.cleaned_data['phone']
        if not re.fullmatch(r'\+?[\d\s().-]+', value) or not 7 <= len(re.sub(r'\D', '', value)) <= 15:
            raise forms.ValidationError('Zadajte platné telefónne číslo.')
        return value
