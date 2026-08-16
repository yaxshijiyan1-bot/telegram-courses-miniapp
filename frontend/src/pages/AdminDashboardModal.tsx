import React, { useState } from 'react';
import {
  X,
  TrendingUp,
  Users,
  BookOpen,
  DollarSign,
  Plus,
  Video,
  Sparkles,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { useTelegram } from '../context/TelegramContext';

interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  adminName: string;
}

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({
  isOpen,
  onClose,
  adminName
}) => {
  const [activeTab, setActiveTab] = useState<'stats' | 'new_course'>('stats');
  const [courseTitle, setCourseTitle] = useState('');
  const [coursePrice, setCoursePrice] = useState('');
  const [courseCategory, setCourseCategory] = useState('AI');
  const [isSuccess, setIsSuccess] = useState(false);
  const { haptic } = useTelegram();

  if (!isOpen) return null;

  const handleCreateCourse = (e: React.FormEvent) => {
    e.preventDefault();
    haptic.notification('success');
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setCourseTitle('');
      setCoursePrice('');
      setActiveTab('stats');
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in">
      <div className="w-full max-w-md bg-white rounded-3xl p-5 shadow-2xl border border-brand-border space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-brand-border pb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-brand-forest text-brand-gold flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-brand-dark">Superadmin Dashboard</h3>
              <p className="text-[10px] text-brand-secondary">
                Admin: <span className="font-bold text-brand-emerald">{adminName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              haptic.impact('light');
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-brand-surface flex items-center justify-center text-brand-secondary hover:text-brand-dark"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex bg-brand-surface p-1 rounded-2xl border border-brand-border">
          <button
            onClick={() => {
              haptic.selection();
              setActiveTab('stats');
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition-all ${
              activeTab === 'stats'
                ? 'bg-brand-emerald text-white shadow-sm'
                : 'text-brand-secondary hover:text-brand-dark'
            }`}
          >
            Umumiy Statistika
          </button>
          <button
            onClick={() => {
              haptic.selection();
              setActiveTab('new_course');
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition-all flex items-center justify-center space-x-1 ${
              activeTab === 'new_course'
                ? 'bg-brand-emerald text-white shadow-sm'
                : 'text-brand-secondary hover:text-brand-dark'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Yangi Kurs</span>
          </button>
        </div>

        {/* Tab 1: Stats */}
        {activeTab === 'stats' ? (
          <div className="space-y-3 pt-1">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 bg-gradient-to-br from-brand-mint to-brand-surface rounded-2xl border border-brand-border/60">
                <span className="text-[10px] text-brand-secondary font-semibold uppercase block">
                  Jami Tushum
                </span>
                <div className="flex items-baseline space-x-1 mt-1">
                  <span className="text-base font-bold font-serif text-brand-emerald">
                    142.5 mln
                  </span>
                  <span className="text-[10px] text-brand-dark">so'm</span>
                </div>
              </div>

              <div className="p-3 bg-gradient-to-br from-amber-50 to-brand-surface rounded-2xl border border-brand-border/60">
                <span className="text-[10px] text-brand-secondary font-semibold uppercase block">
                  Jami O'quvchilar
                </span>
                <div className="flex items-baseline space-x-1 mt-1">
                  <span className="text-base font-bold font-serif text-amber-700">
                    6,350+
                  </span>
                  <span className="text-[10px] text-brand-dark">talaba</span>
                </div>
              </div>
            </div>

            {/* Recent Sales Activity */}
            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-bold text-brand-dark uppercase tracking-wider">
                Oxirgi Sotuvlar
              </h4>
              <div className="space-y-2">
                <div className="p-2.5 bg-brand-surface rounded-xl border border-brand-border/60 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-brand-dark block">Azizbek Rahimov</span>
                    <span className="text-[10px] text-brand-secondary">AI Prompt Engineering Pro</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-brand-emerald block">+490 000 so'm</span>
                    <span className="text-[9px] text-brand-muted">Payme • Bugun</span>
                  </div>
                </div>

                <div className="p-2.5 bg-brand-surface rounded-xl border border-brand-border/60 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-brand-dark block">Dilnoza Karimova</span>
                    <span className="text-[10px] text-brand-secondary">Telegram Fullstack Dasturlash</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-brand-emerald block">+690 000 so'm</span>
                    <span className="text-[9px] text-brand-muted">Click • Bugun</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Tab 2: New Course Form */
          <form onSubmit={handleCreateCourse} className="space-y-3 pt-1">
            {isSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Yangi kurs muvaffaqiyatli saqlandi!</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-brand-dark">Kurs nomi</label>
              <input
                type="text"
                required
                value={courseTitle}
                onChange={(e) => setCourseTitle(e.target.value)}
                placeholder="Masalan: AI Agentlar va Antigravity"
                className="w-full px-3 py-2 bg-brand-surface border border-brand-border rounded-xl text-xs text-brand-text focus:outline-none focus:border-brand-emerald"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-brand-dark">Kategoriya</label>
                <select
                  value={courseCategory}
                  onChange={(e) => setCourseCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-brand-surface border border-brand-border rounded-xl text-xs text-brand-text focus:outline-none focus:border-brand-emerald"
                >
                  <option value="AI">AI</option>
                  <option value="Dizayn">Dizayn</option>
                  <option value="Dasturlash">Dasturlash</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Biznes">Biznes</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-brand-dark">Narxi (so'mda)</label>
                <input
                  type="number"
                  required
                  value={coursePrice}
                  onChange={(e) => setCoursePrice(e.target.value)}
                  placeholder="490000"
                  className="w-full px-3 py-2 bg-brand-surface border border-brand-border rounded-xl text-xs text-brand-text focus:outline-none focus:border-brand-emerald"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-brand-emerald text-white font-bold rounded-2xl shadow-soft hover:bg-brand-deep active:scale-95 transition-all text-xs flex items-center justify-center space-x-1.5 mt-2"
            >
              <Plus className="w-4 h-4" />
              <span>Kursni Bazaga Qo'shish</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
