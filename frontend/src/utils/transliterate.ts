// O'zbek lotin alifbosidan kirill alifbosiga qoida asosida o'tkazish.
// Lug'at emas, deterministik transkripsiya: interfeys matnlari uchun yetarli.
// Raqamlar, tinish belgilari va lotincha brendlar (AI, SMM, Telegram...) o'zgarishsiz qoladi.

const SINGLE: Record<string, string> = {
  a: 'а', b: 'б', d: 'д', e: 'е', f: 'ф', g: 'г', h: 'ҳ', i: 'и',
  j: 'ж', k: 'к', l: 'л', m: 'м', n: 'н', o: 'о', p: 'п', q: 'қ',
  r: 'р', s: 'с', t: 'т', u: 'у', v: 'в', x: 'х', z: 'з', c: 'с',
  w: 'в', y: 'й',
};

// Barcha apostrof variantlari (klaviatura, tipografik, o'zbek "okina")
const isApos = (c: string) =>
  c === "'" || c === '’' || c === '‘' || c === 'ʻ' || c === 'ʼ';

const isWordChar = (c: string) => /[A-Za-z0-9А-Яа-яЁёЎўҒғҲҳҚқЪъ]/.test(c);

const withCase = (cyr: string, src: string) =>
  src !== src.toLowerCase() && src === src.toUpperCase() ? cyr.toUpperCase() : cyr;

export function toCyrillic(text: string): string {
  if (!text) return text;
  const n = text.length;
  let out = '';
  let prevWordChar = false;

  for (let i = 0; i < n; ) {
    const ch = text[i];
    const chL = ch.toLowerCase();
    const next = i + 1 < n ? text[i + 1] : '';
    const nextL = next.toLowerCase();
    const afterNext = i + 2 < n ? text[i + 2] : '';

    // oʻ / gʻ → ў / ғ
    if ((chL === 'o' || chL === 'g') && isApos(next)) {
      out += withCase(chL === 'o' ? 'ў' : 'ғ', ch);
      i += 2;
      prevWordChar = true;
      continue;
    }

    // y kombinatsiyalari
    if (chL === 'y') {
      if (nextL === 'o' && isApos(afterNext)) {
        // yoʻ → йў (yo'q → йўқ)
        out += withCase('й', ch) + (next === next.toUpperCase() && next !== next.toLowerCase() ? 'Ў' : 'ў');
        i += 3;
        prevWordChar = true;
        continue;
      }
      if (nextL === 'a') { out += withCase('я', ch); i += 2; prevWordChar = true; continue; }
      if (nextL === 'o') { out += withCase('ё', ch); i += 2; prevWordChar = true; continue; }
      if (nextL === 'u') { out += withCase('ю', ch); i += 2; prevWordChar = true; continue; }
      if (nextL === 'e') { out += withCase('е', ch); i += 2; prevWordChar = true; continue; }
      if (nextL === 'i') { out += withCase('й', ch) + withCase('и', next); i += 2; prevWordChar = true; continue; }
      // undosh oldida yoki so'z oxirida → й
      out += withCase('й', ch);
      i += 1;
      prevWordChar = true;
      continue;
    }

    // sh / ch → ш / ч
    if (chL === 's' && nextL === 'h') { out += withCase('ш', ch); i += 2; prevWordChar = true; continue; }
    if (chL === 'c' && nextL === 'h') { out += withCase('ч', ch); i += 2; prevWordChar = true; continue; }

    // Apostrof (qolgan holatlar) → ъ: ma'lumot → маълумот.
    // Faqat ikki harf orasida bo'lsa ъ, aks holdа o'zgarishsiz qoldiriladi.
    if (isApos(ch)) {
      const before = i > 0 ? text[i - 1] : '';
      if (isWordChar(before) && isWordChar(next)) out += 'ъ';
      else out += ch;
      i += 1;
      continue;
    }

    // e: so'z boshida → э (ertalab → эрталаб), qolgan joyda → е
    if (chL === 'e') {
      out += prevWordChar ? withCase('е', ch) : withCase('э', ch);
      i += 1;
      prevWordChar = true;
      continue;
    }

    const mapped = SINGLE[chL];
    if (mapped) {
      out += withCase(mapped, ch);
      i += 1;
      prevWordChar = true;
      continue;
    }

    out += ch;
    prevWordChar = isWordChar(ch);
    i += 1;
  }

  return out;
}
