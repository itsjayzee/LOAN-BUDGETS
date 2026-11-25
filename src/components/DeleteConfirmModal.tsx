import React from 'react';
import { Loan, ThemeMode, Translations } from '../types';
import { isLightThemeMode } from '../utils/loanLogic';
import { Trash2, X, AlertTriangle } from './OrganicIcons';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  loan: Loan | null;
  onConfirm: (id: string) => void;
  translations: Translations;
  themeMode?: ThemeMode;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  loan,
  onConfirm,
  translations,
  themeMode = 'obsidian_neon',
}) => {
  if (!isOpen || !loan) return null;

  const isLight = isLightThemeMode(themeMode);
  const isNordic = themeMode === 'nordic_frost';
  const isVelvetPink = themeMode === 'velvet_pink';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-confirm-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className={`smooth-interactive relative w-full max-w-sm rounded-2xl border shadow-2xl p-5 text-center ${
        isLight
          ? isNordic
            ? 'bg-[#F5FAFF] border-[#B8D4EE] text-slate-900'
            : 'bg-white border-slate-200 text-slate-900'
          : isVelvetPink
          ? 'bg-[#1F1224] border-[#E8B4A0]/25 text-[#FDF4FA]'
          : 'bg-slate-900 border-slate-800 text-white'
      }`}>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className={`smooth-interactive absolute top-4 right-4 p-1.5 rounded-lg transition-colors cursor-pointer ${
            isLight
              ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              : isVelvetPink
              ? 'text-[#E8C5D8] hover:text-white hover:bg-[#FF2E93]/15'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <X className="w-4 h-4" />
        </button>

        <div className={`w-12 h-12 rounded-2xl border mx-auto flex items-center justify-center mb-4 ${
          isLight
            ? 'bg-rose-50 border-rose-200 text-rose-600'
            : isVelvetPink
            ? 'bg-[#FF2E93]/15 border-[#FF2E93]/35 text-[#FF65B5]'
            : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
        }`}>
          <AlertTriangle className="w-6 h-6" glow="i_owe" />
        </div>

        <h3 id="delete-confirm-title" className={`text-base font-bold mb-1.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
          {translations.confirmDelete}
        </h3>
        <p className={`text-xs mb-6 leading-relaxed ${isLight ? 'text-slate-600' : isVelvetPink ? 'text-[#E8C5D8]' : 'text-slate-400'}`}>
          {translations.confirmDeleteMessage}
        </p>

        <div className="flex items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className={`smooth-interactive flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
              isLight
                ? 'text-slate-700 hover:text-slate-950 bg-slate-100 hover:bg-slate-200'
                : isVelvetPink
                ? 'text-[#E8C5D8] hover:text-white bg-white/[0.06] hover:bg-[#FF2E93]/15 border border-[#E8B4A0]/20'
                : 'text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700'
            }`}
          >
            {translations.cancel}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm(loan.id);
              onClose();
            }}
            className={`smooth-interactive flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white transition-colors shadow-lg cursor-pointer ${
              isVelvetPink
                ? 'bg-[#FF2E93] hover:bg-[#FF47A1] shadow-[#FF2E93]/30'
                : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            <span>{translations.delete}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
