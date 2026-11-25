import React from 'react';
import { ThemeMode, Translations } from '../types';
import { isLightThemeMode } from '../utils/loanLogic';
import { Plus, ShieldCheck } from './OrganicIcons';

interface EmptyStateProps {
  translations: Translations;
  onOpenAddModal: () => void;
  themeMode?: ThemeMode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  translations,
  onOpenAddModal,
  themeMode = 'obsidian_neon',
}) => {
  const isLight = isLightThemeMode(themeMode);
  const isNordic = themeMode === 'nordic_frost';
  const isVelvetPink = themeMode === 'velvet_pink';

  return (
    <div
      className={`smooth-interactive relative overflow-hidden rounded-3xl border backdrop-blur-2xl p-8 sm:p-16 text-center my-6 shadow-xl ${
        isLight
          ? isNordic
            ? 'border-[#C5DCF0] bg-[#F5FAFF]/90'
            : 'border-slate-200 bg-white'
          : isVelvetPink
          ? 'border-[#E8B4A0]/25 bg-[#1F1224]/75 shadow-2xl shadow-[#FF2E93]/10'
          : 'border-white/[0.08] bg-[#0D121F]/60 shadow-2xl'
      }`}
    >
      {/* Crisp Shield Icon Badge */}
      <div className="relative mx-auto mb-6 w-16 h-16 sm:w-20 sm:h-20">
        <div
          className={`w-full h-full rounded-2xl border flex items-center justify-center shadow-sm ${
            isLight
              ? isNordic
                ? 'border-[#C5DCF0] bg-white text-sky-700'
                : 'border-slate-200 bg-slate-50 text-emerald-700'
              : isVelvetPink
              ? 'border-[#E8B4A0]/30 bg-[#140B18]/90 text-[#FF65B5]'
              : 'border-white/[0.12] bg-[#080B11]/90 text-emerald-400'
          }`}
        >
          <ShieldCheck className="w-8 h-8" strokeWidth={1.65} glow="accent" />
        </div>
      </div>

      <h3 className={`text-xl sm:text-2xl font-bold font-pricedown tracking-wide mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
        {translations.emptyStateTitle}
      </h3>
      <p className={`max-w-md mx-auto text-sm leading-relaxed mb-8 ${isLight ? 'text-slate-600' : isVelvetPink ? 'text-[#E8C5D8]' : 'text-slate-400'}`}>
        {translations.emptyStateDesc}
      </p>

      {/* Single Primary Action Button */}
      <div className="flex justify-center max-w-xs mx-auto">
        <button
          type="button"
          onClick={onOpenAddModal}
          className={`smooth-interactive w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-bold transition-all active:scale-[0.98] shadow-lg cursor-pointer ${
            isVelvetPink
              ? 'bg-gradient-to-r from-[#FF2E93] to-[#FF65B5] hover:from-[#FF47A1] hover:to-[#FF7DC1] text-white shadow-[#FF2E93]/30 border border-[#FF9ED0]/35'
              : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-500/20 border border-emerald-300/30'
          }`}
        >
          <Plus className="w-4 h-4" strokeWidth={2} />
          <span>{translations.startByAdding}</span>
        </button>
      </div>
    </div>
  );
};
