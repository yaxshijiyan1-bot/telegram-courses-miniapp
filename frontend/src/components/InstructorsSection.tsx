import React from 'react';
import { Instagram, Facebook, Send } from 'lucide-react';

interface InstructorStat {
  value: string;
  label: string;
}

interface InstructorSocial {
  icon: typeof Send;
  label: string;
  url: string;
}

export interface Instructor {
  id: string;
  name: string;
  photo: string;
  role: string;
  tagline: string;
  accent: 'cyan' | 'violet';
  stats: InstructorStat[];
  paragraphs: string[];
  highlights: string[];
  socials: InstructorSocial[];
}

// ==== USTOZLAR MA'LUMOTLARI ====
// Matn ichidagi [so'z](havola) ko'rinishidagi qismlar kanallarga rangli havola bo'lib ochiladi
export const INSTRUCTORS: Instructor[] = [
  {
    id: 'zuhra-olimova',
    name: 'Zuhra Olimova',
    photo: '/images/ustoz_zuhra_olimova.webp',
    role: 'SMM & AI Kontent',
    tagline: '“AI Formula” kursi asoschisi',
    accent: 'violet',
    stats: [
      { value: '3+', label: 'yil tajriba' },
      { value: '9 000', label: 'obunachi' },
      { value: '130+', label: 'bitiruvchi' },
    ],
    paragraphs: [
      'Zuhra Olimova — SMM va dizayn sohasida 3 yildan ortiq tajribaga ega mutaxassis. U AI yordamida rasm va video yaratish, kreativ kontent tayyorlash hamda sahifalarni rivojlantirish bo‘yicha faol ishlaydi.',
      'Zuhra Instagram’dagi [@zuhra_akbarovna](https://www.instagram.com/akbarovna_zuhra?igsi=MTh1dnRyeDhudW4xdg==) sahifasi egasi bo‘lib, u yerda 9 000 ga yaqin obunachiga ega. Telegram’dagi [@Olimova_Zuhra](https://t.me/+awu_1WFe7MhiNmQ6) kanalini ham yuritadi; kanalda 1 500 ga yaqin obunachi bor.',
      'U [“Hammaga Yetadi”](https://t.me/hammagayetadi) kanalining avvalgi admini va qayta tiklanayotgan kanal egasi hisoblanadi. Zuhra “Dizayn ilk qadam” chellenji asoschisi. Unda 35+ ishtirokchi qatnashgan va ularning ko‘pchiligi olgan bilimlari asosida o‘z yo‘nalishi yoki biznesini yo‘lga qo‘ygan.',
      'Zuhra, shuningdek, sun’iy intellektda prompt yozish, rasm va video yaratishga bag‘ishlangan “AI Formula” bepul kursi asoschisi.',
    ],
    highlights: [
      'AI prompt yozish',
      'Rasm va video yaratish',
      'Sahifalarni rivojlantirish',
      'SMM strategiya',
    ],
    socials: [
      { icon: Instagram, label: '@zuhra_akbarovna', url: 'https://www.instagram.com/akbarovna_zuhra?igsi=MTh1dnRyeDhudW4xdg==' },
      { icon: Send, label: '@Olimova_Zuhra', url: 'https://t.me/+awu_1WFe7MhiNmQ6' },
      { icon: Send, label: 'Hammaga Yetadi', url: 'https://t.me/hammagayetadi' },
    ],
  },
  {
    id: 'yaxshi-bola',
    name: 'Yaxshi Bola',
    photo: '/images/ustoz_yaxshi_bola.webp',
    role: 'Dasturlash & Dizayn',
    tagline: 'odobli.ai loyihasi asoschisi',
    accent: 'cyan',
    stats: [
      { value: '1,5+', label: 'yil tajriba' },
      { value: '9 000+', label: 'obunachi' },
      { value: '2 500+', label: "o'quvchi" },
    ],
    paragraphs: [
      '22 yoshli Yaxshi Bola — dasturlash va dizayn yo‘nalishida 1,5 yildan ortiq tajribaga ega ijodkor. U Instagram’dagi [odobli.ai](https://www.instagram.com/odobli.ai?igsi=OWZlZnhiano2Z2x0) loyihasi asoschisi. Loyiha 9 000+ obunachiga ega. [Facebook](https://www.facebook.com/share/1F1tuV2C9L/)’dagi sahifasini ham 1 000+ kishi kuzatadi.',
      'U avval bir yil davomida [“Hammaga Yetadi”](https://t.me/hammagayetadi) kanalini yuritib, Canva va dizayn bo‘yicha foydali bilimlarni 2 500+ kishiga ulashgan. Kanal hozir qayta tiklanib, yangi bosqichda rivojlanmoqda.',
      'Bu kursda Yaxshi Bola sizga AI vositalarini amalda ishlatish, kreativ kontent yaratish, dizayn fikrlashi va raqamli loyihalarni rivojlantirish bo‘yicha o‘z tajribasini ulashadi.',
    ],
    highlights: [
      'AI vositalarini amalda qo‘llash',
      'Kreativ kontent yaratish',
      'Dizayn fikrlashi',
      'Raqamli loyihalarni rivojlantirish',
    ],
    socials: [
      { icon: Instagram, label: 'odobli.ai', url: 'https://www.instagram.com/odobli.ai?igsi=OWZlZnhiano2Z2x0' },
      { icon: Facebook, label: 'Facebook', url: 'https://www.facebook.com/share/1F1tuV2C9L/' },
      { icon: Send, label: '@yomonboIa', url: 'https://t.me/yomonboIa' },
    ],
  },
];

export const TEAM_INTRO =
  'Kursni amaliy tajribaga ega, kontent, dizayn va AI vositalari bilan ishlaydigan ikki ustoz olib boradi. Siz faqat nazariya emas, real loyihalarda sinalgan usullarni o‘rganasiz.';

export const TEAM_GOAL =
  'Sizga AI’dan foydalanishni shunchaki tushuntirib berish emas, balki uni kontent, dizayn, biznes va shaxsiy loyihalaringizda natijaga aylantirishni o‘rgatish.';

export const ACCENT = {
  cyan: {
    chipBg: 'bg-cyan/10 text-cyan border-cyan/20',
    glow: 'bg-cyan/20',
    grad: 'from-cyan/90 to-cyan-deep/80',
    soft: 'bg-cyan/5',
  },
  violet: {
    chipBg: 'bg-violet/10 text-violet border-violet/20',
    glow: 'bg-violet/20',
    grad: 'from-violet/90 to-violet-light/80',
    soft: 'bg-violet/5',
  },
};

// Havola platformasi bo'yicha brend ranglari: Telegram — ko'k, Facebook — to'q ko'k, Instagram — pushti
export const linkColor = (url: string): string => {
  if (url.includes('t.me') || url.includes('telegram.')) return 'text-[#229ED9]';
  if (url.includes('facebook.') || url.includes('fb.com')) return 'text-[#0866FF]';
  if (url.includes('instagram.com')) return 'text-[#E1306C]';
  return 'text-cyan';
};

const LINK_TOKEN = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;

// “[so‘z](havola)” belgilarini topib, o‘rniga bosiladigan rangli havola qo‘yadi
export const RichText: React.FC<{ text: string }> = ({ text }) => {
  const parts: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  LINK_TOKEN.lastIndex = 0;
  while ((m = LINK_TOKEN.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    parts.push(
      <a
        key={`${m.index}`}
        href={m[2]}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className={`font-bold ${linkColor(m[2])} active:opacity-60 transition-opacity`}
      >
        {m[1]}
      </a>
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
};
