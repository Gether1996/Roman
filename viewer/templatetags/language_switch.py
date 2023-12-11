from django import template
from django.urls import reverse

register = template.Library()


@register.simple_tag(takes_context=True)
def switch_language_url(context, language_code):
    current_path = context['request'].path
    return reverse('switch_language', args=[language_code]) + f'?next={current_path}'