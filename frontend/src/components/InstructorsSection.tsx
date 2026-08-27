import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  ChevronRight,
  Sparkles,
  Target,
  Instagram,
  Facebook,
  Send,
  Users,
  Award,
} from 'lucide-react';
import { useTelegram } from '../context/TelegramContext';

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

const ACCENT = {
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
const linkColor = (url: string): string => {
  if (url.includes('t.me') || url.includes('telegram.')) return 'text-[#229ED9]';
  if (url.includes('facebook.') || url.includes('fb.com')) return 'text-[#0866FF]';
  if (url.includes('instagram.com')) return 'text-[#E1306C]';
  return 'text-cyan';
};

const LINK_TOKEN = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;

// “[so‘z](havola)” belgilarini topib, o‘rniga bosiladigan rangli havola qo‘yadi
const RichText: React.FC<{ text: string }> = ({ text }) => {
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

// ==== USTOZ PROFIL MODALI (bottom-sheet) ====
const InstructorProfileSheet: React.FC<{
  instructor: Instructor;
  onClose: () => void;
}> = ({ instructor, onClose }) => {
  const { haptic } = useTelegram();
  const a = ACCENT[instructor.accent];

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.div
        className="relative w-full max-w-md bg-white text-ink shadow-2xl rounded-t-[32px] sm:rounded-[32px] max-h-[92vh] overflow-y-auto no-scrollbar"
        initial={{ y: 64, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 64, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 380, damping: 34 }}
      >
        {/* Sarlavha bloki — gradient header */}
        <div className={`relative bg-gradient-to-br ${a.grad} px-5 pt-6 pb-16 rounded-t-[32px] sm:rounded-t-[32px] overflow-hidden`}>
          <div className="absolute -right-8 -top-10 w-40 h-40 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="absolute -left-10 bottom-0 w-32 h-32 rounded-full bg-white/10 blur-2xl pointer-events-none" />

          <div className="flex items-start justify-between relative">
            <span className="inline-flex items-center space-x-1 text-[10px] font-extrabold uppercase tracking-widest text-white/90 bg-white/15 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20">
              <Sparkles className="w-3 h-3" />
              <span>Ustoz</span>
            </span>
            <button
              type="button"
              onClick={() => { haptic?.impact?.('light'); onClose(); }}
              className="w-8 h-8 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white flex items-center justify-center active:scale-90 transition-transform"
              aria-label="Yopish"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Portret */}
        <div className="px-5 -mt-12 relative">
          <div className="w-24 h-24 rounded-[28px] overflow-hidden bg-white border-4 border-white shadow-elevated">
            <img src={instructor.photo} alt={instructor.name} className="w-full h-full object-cover" />
          </div>

          <div className="mt-3 space-y-1">
            <h3 className="text-xl font-extrabold text-ink tracking-tight leading-tight">
              {instructor.name}
            </h3>
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full border ${a.chipBg}`}>
                {instructor.role}
              </span>
              <span className="text-[11px] text-ink-muted font-medium">{instructor.tagline}</span>
            </div>
          </div>
        </div>

        {/* Statistika */}
        <div className="px-5 mt-4">
          <div className="grid grid-cols-3 divide-x divide-slate-200/80 bg-slate-50 rounded-[20px] border border-slate-200/80 overflow-hidden">
            {instructor.stats.map((s) => (
              <div key={s.label} className="px-2 py-3 text-center">
                <b className="text-[15px] font-extrabold text-ink block leading-tight tabular-nums">
                  {s.value}
                </b>
                <span className="text-[9px] text-ink-muted font-medium block mt-0.5">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tarjimai hol */}
        <div className="px-5 mt-5 space-y-3">
          {instructor.paragraphs.map((p, i) => (
            <p key={i} className="text-xs text-ink-secondary leading-relaxed">
              <RichText text={p} />
            </p>
          ))}
        </div>

        {/* Nimalarga ixtisoslashgan */}
        <div className="px-5 mt-5">
          <h4 className="text-[11px] font-extrabold text-ink uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
            <Award className="w-3.5 h-3.5 text-gold" />
            Ixtisoslik
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {instructor.highlights.map((h) => (
              <span
                key={h}
                className={`text-[10px] font-bold px-2.5 py-1.5 rounded-xl border ${a.chipBg}`}
              >
                {h}
              </span>
            ))}
          </div>
        </div>

        {/* Ijtimoiy tarmoqlar */}
        <div className="px-5 mt-5">
          <h4 className="text-[11px] font-extrabold text-ink uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
            <Users className="w-3.5 h-3.5 text-cyan" />
            Sahifalari
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {instructor.socials.map((s) => {
              const Icon = s.icon;
              return (
                <a
                  key={s.url}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => haptic?.impact?.('light')}
                  className="flex items-center space-x-2 px-3 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-2xl transition-colors active:scale-[0.97]"
                >
                  <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${linkColor(s.url)}`} />
                  <span className="text-[10px] font-bold text-ink truncate">{s.label}</span>
                </a>
              );
            })}
          </div>
        </div>

        <div className="h-8" />
      </motion.div>
    </motion.div>
  );
};

// ==== BOSH SAHIFA SEKSIYASI ====
export const InstructorsSection: React.FC = () => {
  const { haptic } = useTelegram();
  const [selected, setSelected] = useState<Instructor | null>(null);

  return (
    <div className="space-y-2.5">
      <div className="px-1 space-y-1">
        <p className="eyebrow">Jamoa</p>
        <h2 className="text-sm font-bold text-ink flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-gold" strokeWidth={2.2} />
          Ustozlar haqida
        </h2>
        <p className="text-[11px] text-ink-muted leading-relaxed">{TEAM_INTRO}</p>
      </div>

      <div className="space-y-2.5">
        {INSTRUCTORS.map((ins) => (
          <motion.button
            key={ins.id}
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={() => { haptic?.impact?.('light'); setSelected(ins); }}
            className="w-full glass !rounded-[24px] p-3.5 flex items-center space-x-3.5 pressable text-left relative overflow-hidden group"
          >
            <div className={`absolute -right-8 -top-10 w-28 h-28 rounded-full blur-3xl pointer-events-none ${ACCENT[ins.accent].glow}`} />

            <div className="relative w-16 h-16 rounded-[20px] overflow-hidden bg-white border border-white/60 shadow-sm flex-shrink-0">
              <img
                src={ins.photo}
                alt={ins.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
              />
            </div>

            <div className="flex-1 min-w-0 relative">
              <h3 className="text-[13px] font-extrabold text-ink truncate">{ins.name}</h3>
              <span className={`inline-block text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border mt-1 ${ACCENT[ins.accent].chipBg}`}>
                {ins.role}
              </span>
              <p className="text-[10px] text-ink-muted truncate mt-1">{ins.tagline}</p>
            </div>

            <ChevronRight className="w-4 h-4 text-ink-muted flex-shrink-0 relative" />
          </motion.button>
        ))}
      </div>

      {/* Maqsad — jamoa va'dasi */}
      <div className="glass !rounded-[24px] p-4 relative overflow-hidden">
        <div className="absolute -left-8 -top-10 w-28 h-28 rounded-full bg-gold/15 blur-3xl pointer-events-none" />
        <div className="flex items-start space-x-3 relative">
          <div className="w-9 h-9 rounded-xl bg-gold/10 text-gold border border-gold/20 flex items-center justify-center flex-shrink-0">
            <Target className="w-4 h-4" strokeWidth={2.2} />
          </div>
          <div className="min-w-0">
            <h4 className="text-[11px] font-extrabold text-ink uppercase tracking-wider mb-1">
              Bizning maqsad
            </h4>
            <p className="text-[11px] text-ink-secondary leading-relaxed">
              {TEAM_GOAL}
            </p>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selected && (
          <InstructorProfileSheet instructor={selected} onClose={() => setSelected(null)} />
        )}
      </AnimatePresence>
    </div>
  );
};
