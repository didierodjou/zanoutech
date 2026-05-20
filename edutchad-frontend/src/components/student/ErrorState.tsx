'use client';

import Icon from '@/components/ui/Icon';

interface ErrorStateProps {
  error?: string | null;
  onRetry?: () => void;
}

export function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="bg-white rounded-2xl p-6 text-center shadow-sm border border-rose-100 max-w-md">
        <Icon icon="fa-exclamation-triangle" className="text-4xl text-rose-500 mx-auto mb-3" />
        <p className="text-slate-700 font-semibold">Erreur de chargement</p>
        <p className="text-slate-500 text-sm mt-1">{error || "Une erreur est survenue"}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-5 px-5 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition"
          >
            Réessayer
          </button>
        )}
      </div>
    </div>
  );
}