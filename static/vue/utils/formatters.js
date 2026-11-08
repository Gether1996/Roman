export function formatDateInput(date) {
  // Parse 'YYYY-MM-DD' directly – new Date('YYYY-MM-DD') is UTC and could show
  // the previous day in time zones west of UTC.
  const match = String(date || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return `${match[3]}.${match[2]}.${match[1]}`;
  }
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
