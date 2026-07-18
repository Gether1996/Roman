export function formatDateInput(date) {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return date;
  }
  const day = String(parsed.getDate()).padStart(2, '0');
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const year = parsed.getFullYear();
  return `${day}.${month}.${year}`;
}

export function normalizeText(value) {
  return (value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

// Massage names are stored in Slovak (backend). For the EN UI, translate the
// couple of Slovak words that appear in them so customers see English.
export function formatServiceName(name, locale) {
  if (locale !== 'en' || !name) {
    return name || '';
  }
  return name
    .replace(/mas\u00e1\u017e/gi, 'massage')
    .replace(/syst\u00e9m/gi, 'system');
}
