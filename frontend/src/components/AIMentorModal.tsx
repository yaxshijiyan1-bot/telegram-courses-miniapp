import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, Send, Sparkles, X, RefreshCw, Copy, Check, ChevronRight, HelpCircle, Code2, BookOpen, Trash2, Zap } from 'lucide-react';
import { useAIChatMutation } from '../hooks/useQueries';
import { useTelegram } from '../context/TelegramContext';
import { cn } from '../lib/utils';

interface AIMentorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCourseTitle?: string;
  currentLessonTitle?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  provider?: string;
  model?: string;
}

export const AIMentorModal: React.FC<AIMentorModalProps> = ({
  isOpen,
  onClose,
  currentCourseTitle,
  currentLessonTitle,
}) => {
  const { haptic } = useTelegram();
  const [inputMessage, setInputMessage] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: currentCourseTitle
        ? `Assalomu alaykum! Men **Kreativ AI Mentoringizman** *(OpenRouter stealth/ox-alpha)*.\n\nSiz hozir **"${currentCourseTitle}"** ${currentLessonTitle ? `— *${currentLessonTitle}*` : ''} darsini o'rganmoqdasiz. Qanday savolingiz yoki topshirig'ingiz bor?`
        : "Assalomu alaykum! Men **Kreativ AI Mentoringizman** *(OpenRouter stealth/ox-alpha 2026)*.\n\nDasturlash, AI arxitekturasi, prompt engineering, xatolarni tuzatish va amaliy keyslar bo'yicha yordam berishga tayyorman! 🚀",
      provider: 'openrouter',
      model: 'stealth/ox-alpha',
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const aiChatMutation = useAIChatMutation();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || aiChatMutation.isPending) return;

    haptic?.impact?.('light');
    const userMsgId = Date.now().toString();
    const userMsg: Message = {
      id: userMsgId,
      role: 'user',
      content: text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');

    try {
      const response = await aiChatMutation.mutateAsync({
        message: text,
        history: messages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
        course_title: currentCourseTitle,
        lesson_title: currentLessonTitle,
      });

      haptic?.notification?.('success');
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.reply,
          provider: response.provider || 'openrouter',
          model: response.model || 'stealth/ox-alpha',
        },
      ]);
    } catch (err) {
      haptic?.notification?.('error');
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: "⚠️ **Tarmoqda nosozlik yuz berdi.** \n\nHozircha men oflayn rejimdaman yoki API kalitlar sozlanmagan. Iltimos, keyinroq qayta urinib ko'ring yoki administratorga xabar bering.",
        },
      ]);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    haptic?.impact?.('light');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearHistory = () => {
    haptic?.impact?.('medium');
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: "Suhbat tarixi tozalandi. Yangi savolingizni yozishingiz mumkin! 🚀",
        provider: 'openrouter',
        model: 'stealth/ox-alpha',
      },
    ]);
  };

  const quickPrompts = [
    { label: "Mavzuni sodda tushuntir", icon: BookOpen, text: "Ushbu dars mavzusini oddiy xalq tilida, hayotiy misollar bilan tushuntirib ber." },
    { label: "2026 Kod namunasi", icon: Code2, text: "Ushbu mavzuga oid 2026-yilgi zamonaviy, toza va to'liq amaliy TypeScript/Python kod namunasi yozib ber." },
    { label: "3 ta test savoli", icon: HelpCircle, text: "Mening bilimimni sinash uchun ushbu dars bo'yicha 3 ta qiziqarli test savoli tuzib ber." },
    { label: "Loyihani rejalashtirish", icon: Zap, text: "Ushbu darsdan qanday real amaliy loyiha yoki startup qilsa bo'ladi?" },
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/45 backdrop-blur-md">
        {/* Backdrop click to close */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0"
          onClick={onClose}
        />

        {/* iOS 27 Sheet Window */}
        <motion.div
          initial={{ y: '100%', opacity: 0.8 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          className="relative w-full max-w-lg h-[92vh] sm:h-[84vh] bg-white border-t sm:border border-slate-200/90 rounded-t-[32px] sm:rounded-[32px] flex flex-col overflow-hidden shadow-2xl z-10"
        >
          {/* iOS Grabber Pill */}
          <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-2.5 mb-1 sm:hidden flex-shrink-0" />

          {/* Top Bar */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200/80 bg-white/90 backdrop-blur-2xl flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 via-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-extrabold text-slate-900">AI Dars Yordamchisi</h3>
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 border border-emerald-500/30 flex items-center gap-1 font-extrabold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    stealth/ox-alpha
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 truncate max-w-[210px]">
                  {currentCourseTitle ? currentCourseTitle : 'OpenRouter 2026 Engine'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleClearHistory}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors"
                title="Tarixni tozalash"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Context Banner */}
          {currentLessonTitle && (
            <div className="px-4 py-1.5 bg-sky-50 border-b border-sky-100 flex items-center justify-between text-xs text-sky-800 flex-shrink-0">
              <span className="truncate">🎯 Dars: <b>{currentLessonTitle}</b></span>
            </div>
          )}

          {/* Chat Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin scrollbar-thumb-slate-200 bg-slate-50/60">
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  'flex flex-col max-w-[88%]',
                  msg.role === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
                )}
              >
                <div
                  className={cn(
                    'p-3.5 rounded-2xl text-xs sm:text-[13px] leading-relaxed whitespace-pre-wrap select-text font-normal',
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-sky-500 to-cyan-600 text-white font-medium rounded-tr-sm shadow-md shadow-sky-500/15'
                      : 'bg-white border border-slate-200/90 text-slate-800 rounded-tl-sm shadow-sm'
                  )}
                >
                  {msg.content}
                </div>

                {msg.role === 'assistant' && (
                  <div className="flex items-center gap-2 mt-1 px-1 text-[10px] text-slate-400">
                    <span>{msg.provider ? `${msg.provider} (${msg.model || 'ox-alpha'})` : 'AI Mentor'}</span>
                    <button
                      onClick={() => handleCopy(msg.content, msg.id)}
                      className="hover:text-slate-700 flex items-center gap-1 transition-colors"
                      title="Nusxa olish"
                    >
                      {copiedId === msg.id ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                )}
              </motion.div>
            ))}

            {aiChatMutation.isPending && (
              <div className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded-2xl w-fit text-xs text-sky-600 shadow-sm">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span className="font-semibold">ox-alpha o'ylamoqda va javob yozmoqda...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompt Pills */}
          <div className="p-2 border-t border-slate-200 bg-white overflow-x-auto flex gap-1.5 scrollbar-none flex-shrink-0">
            {quickPrompts.map((p, idx) => {
              const Icon = p.icon;
              return (
                <button
                  key={idx}
                  onClick={() => handleSend(p.text)}
                  disabled={aiChatMutation.isPending}
                  className="whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs text-slate-700 hover:text-slate-900 transition-colors active:scale-95 disabled:opacity-50 font-medium"
                >
                  <Icon className="w-3.5 h-3.5 text-sky-600" />
                  <span>{p.label}</span>
                </button>
              );
            })}
          </div>

          {/* Bottom Input Field */}
          <div className="p-3 border-t border-slate-200 bg-white pb-[max(12px,env(safe-area-inset-bottom))] flex-shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Savolingizni yozing (stealth/ox-alpha)..."
                className="flex-1 bg-slate-50 border border-slate-200 focus:border-sky-500 rounded-2xl px-4 py-3 text-xs sm:text-sm text-slate-900 placeholder-slate-400 outline-none transition-colors"
                disabled={aiChatMutation.isPending}
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || aiChatMutation.isPending}
                className="w-11 h-11 rounded-2xl bg-gradient-to-r from-sky-500 to-cyan-600 hover:opacity-90 disabled:opacity-40 text-white flex items-center justify-center font-bold transition-transform active:scale-95 shadow-md shadow-sky-500/20 flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
