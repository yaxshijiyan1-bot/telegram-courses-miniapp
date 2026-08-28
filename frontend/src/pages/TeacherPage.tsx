import React from 'react';
import { X, Sparkles, Send, ArrowRight, Award } from 'lucide-react';
import { Course } from '../types';
import { Instructor, RichText, linkColor } from '../components/InstructorsSection';
import { CourseCard } from '../components/CourseCard';
import { useTelegram } from '../context/TelegramContext';

interface TeacherPageProps {
  instructor: Instructor;
  courses: Course[];
  onBack: () => void;
  onSelectCourse: (course: Course) => void;
}

// Ustoz profili — yangi dizayndagi to'liq ekran sahifa (real rasmlar va ma'lumotlar bilan)
export const TeacherPage: React.FC<TeacherPageProps> = ({
  instructor,
  courses,
  onBack,
  onSelectCourse,
}) => {
  const { haptic, webApp } = useTelegram();
  const isViolet = instructor.accent === 'violet';
  const accentColor = isViolet ? '#7C3AED' : '#0284C7';
  const heroGrad = isViolet
    ? 'linear-gradient(135deg, #7C3AED, #6D28D9)'
    : 'linear-gradient(135deg, #0284C7, #0369A1)';

  const teacherCourses = courses.filter(
    (c) =>
      c.instructor_id === instructor.id ||
      (c.instructor_name || '').toLowerCase() === instructor.name.toLowerCase()
  );

  const tgSocial = instructor.socials.find((s) => s.url.includes('t.me'));

  const openTelegram = (url: string) => {
    haptic?.impact?.('light');
    if (webApp?.openTelegramLink) webApp.openTelegramLink(url);
    else window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-white animate-fade-up pb-safe">
      {/* Gradient hero header */}
      <div
        className="relative text-white px-4 pt-4"
        style={{ background: heroGrad }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.15), transparent 50%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.10), transparent 50%)',
          }}
        />

        {/* Top bar */}
        <div className="relative flex items-center justify-between">
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-1 rounded-full text-white bg-white/20 border border-white/25">
            <Sparkles className="w-[11px] h-[11px]" />
            Ustoz
          </span>
          <button
            type="button"
            onClick={() => { haptic?.impact?.('light'); onBack(); }}
            className="w-9 h-9 rounded-full bg-white/20 border border-white/25 flex items-center justify-center text-white active:scale-90 transition-transform"
            aria-label="Yopish"
          >
            <X className="w-[18px] h-[18px]" />
          </button>
        </div>

        {/* Avatar + ism */}
        <div className="relative pt-4 pb-5 flex flex-col items-start gap-3">
          <div
            className="w-24 h-24 rounded-[28px] overflow-hidden bg-white/15 border-[3px] border-white/30"
            style={{ boxShadow: '0 10px 30px -10px rgba(15,23,42,0.30)' }}
          >
            <img
              src={instructor.photo}
              alt={instructor.name}
              className="w-full h-full object-cover object-top"
            />
          </div>
          <div>
            <div className="text-[28px] font-extrabold tracking-[-0.03em] leading-[1.05]">
              {instructor.name}
            </div>
            <div className="flex gap-2 mt-2 items-center flex-wrap">
              <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-white/20 border border-white/30 text-white">
                {instructor.role}
              </span>
              <span className="text-[11.5px] opacity-90 font-medium">{instructor.tagline}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Statistika — hero ustiga chiqib turadi */}
      <div className="px-5 pt-[18px] pb-2 grid grid-cols-3 gap-2 -mt-3.5 relative z-[2]">
        {instructor.stats.map((s) => (
          <div
            key={s.label}
            className="py-3.5 px-2 bg-white border border-slate-900/5 rounded-[18px] text-center"
            style={{ boxShadow: '0 6px 20px -12px rgba(15,23,42,0.15)' }}
          >
            <div
              className="text-lg font-extrabold tracking-[-0.02em] leading-none"
              style={{ color: accentColor }}
            >
              {s.value}
            </div>
            <div className="text-[10px] text-ink-muted font-semibold mt-1.5 tracking-[-0.005em]">
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Tarjimai hol */}
      <div className="px-5 py-4">
        <div className="text-sm font-extrabold text-ink tracking-[-0.01em] mb-2">
          Ustoz haqida
        </div>
        {instructor.paragraphs.map((p, i) => (
          <p
            key={i}
            className="text-[13px] text-ink-secondary leading-[1.65] font-medium tracking-[-0.005em]"
            style={{ marginTop: i === 0 ? 0 : 10 }}
          >
            <RichText text={p} />
          </p>
        ))}

        {/* Ixtisoslik */}
        <div className="mt-4">
          <div className="text-[11px] font-extrabold text-ink uppercase tracking-wider flex items-center gap-1.5 mb-2">
            <Award className="w-3.5 h-3.5 text-gold" />
            Ixtisoslik
          </div>
          <div className="flex flex-wrap gap-1.5">
            {instructor.highlights.map((h) => (
              <span
                key={h}
                className="text-[10px] font-bold px-2.5 py-1.5 rounded-xl border"
                style={{
                  background: isViolet ? 'rgba(124,58,237,0.08)' : 'rgba(2,132,199,0.08)',
                  color: accentColor,
                  borderColor: isViolet ? 'rgba(124,58,237,0.20)' : 'rgba(2,132,199,0.20)',
                }}
              >
                {h}
              </span>
            ))}
          </div>
        </div>

        {/* Sahifalari */}
        <div className="mt-4">
          <div className="text-[11px] font-extrabold text-ink uppercase tracking-wider mb-2">
            Sahifalari
          </div>
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
                  className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl active:scale-[0.97] transition-transform"
                >
                  <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${linkColor(s.url)}`} />
                  <span className="text-[10px] font-bold text-ink truncate">{s.label}</span>
                </a>
              );
            })}
          </div>
        </div>
      </div>

      {/* Ustoz kurslari */}
      <div className="px-5 pb-10">
        <div className="text-sm font-extrabold text-ink tracking-[-0.01em] mb-3 flex items-baseline justify-between">
          <span>Kurslar</span>
          <span className="text-[11px] text-ink-muted font-semibold">{teacherCourses.length} ta</span>
        </div>

        {teacherCourses.length > 0 ? (
          <div className="flex flex-col gap-3.5">
            {teacherCourses.map((c) => (
              <CourseCard key={c.id} course={c} onClick={() => onSelectCourse(c)} />
            ))}
          </div>
        ) : (
          <div className="text-[12px] text-ink-muted font-medium text-center py-6 bg-slate-50 rounded-2xl border border-slate-200/60">
            Hozircha kurslar tez orada qo'shiladi
          </div>
        )}

        {/* Telegram CTA */}
        {tgSocial && (
          <button
            type="button"
            onClick={() => openTelegram(tgSocial.url)}
            className="mt-4 w-full p-3.5 rounded-[20px] flex items-center gap-3 text-left active:scale-[0.98] transition-transform"
            style={{
              background: 'linear-gradient(135deg, rgba(2,132,199,0.05), rgba(124,58,237,0.03))',
              border: '1px solid rgba(2,132,199,0.10)',
            }}
          >
            <span className="w-10 h-10 rounded-xl bg-cyan text-white flex items-center justify-center flex-shrink-0">
              <Send className="w-[18px] h-[18px]" />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-[13px] font-extrabold text-ink tracking-[-0.01em]">
                Ustoz bilan Telegram'da
              </span>
              <span className="block text-[11px] text-ink-muted mt-0.5 font-medium">
                To'g'ridan-to'g'ri savol bering
              </span>
            </span>
            <ArrowRight className="w-4 h-4 text-cyan flex-shrink-0" />
          </button>
        )}
      </div>
    </div>
  );
};
