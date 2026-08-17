// Umumiy formatlash yordamchilari — barcha sahifalar shu yerdagi REAL ma'lumot ishlatadi.

export const UZ_MONTHS = [
  'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
  'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr',
];

export const UZ_WEEKDAYS = [
  'Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba',
];

/** Bugungi sana — haqiqiy, har lahzada yangilanadi */
export function getToday(date = new Date()) {
  return {
    day: String(date.getDate()).padStart(2, '0'),
    month: UZ_MONTHS[date.getMonth()],
    weekday: UZ_WEEKDAYS[date.getDay()],
  };
}

/** 490000 -> "490 000 so'm" */
export function formatPrice(price?: number | null): string {
  if (price == null || isNaN(price)) return '—';
  return price.toLocaleString('ru-RU').replace(/\u00A0/g, ' ') + " so'm";
}

/** 490000 -> "490 000" (faqat raqam) */
export function formatNumber(n?: number | null): string {
  if (n == null || isNaN(n)) return '0';
  return n.toLocaleString('ru-RU').replace(/\u00A0/g, ' ');
}

/** 1250000 -> "1.25 m" (admin statistikasi uchun) */
export function formatMln(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1).replace(/\.0$/, '') + ' mln';
  if (n >= 1_000) return (n / 1_000).toFixed(0) + ' ming';
  return String(n);
}

/** ISO sana yoki timestamp -> "5 daq oldin", "2 soat oldin", "Kecha", "12 May" */
export function relativeTime(raw?: string | null): string {
  if (!raw) return '';
  const then = new Date(raw).getTime();
  if (isNaN(then)) return String(raw);
  const diff = Date.now() - then;
  const min = Math.floor(diff / 60_000);
  if (min < 1) return 'hozir';
  if (min < 60) return `${min} daq oldin`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `${hours} soat oldin`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'kecha';
  if (days < 7) return `${days} kun oldin`;
  const d = new Date(then);
  return `${d.getDate()} ${UZ_MONTHS[d.getMonth()].toLowerCase()}`;
}

/** "2026-05-01T..." -> "01.05.2026" */
export function formatDate(raw?: string | null): string {
  if (!raw) return '';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return String(raw).slice(0, 10);
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
}
