'use client';

interface Props {
  trimester: 1 | 2 | 3;
  onChange: (t: 1 | 2 | 3) => void;
}

export function TrimesterSelector({ trimester, onChange }: Props) {
  return (
    <div className="flex bg-white border border-slate-200 rounded-xl p-1 shadow-sm gap-1">
      {[1, 2, 3].map((t) => (
        <button
          key={t}
          onClick={() => onChange(t as 1 | 2 | 3)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            trimester === t
              ? 'bg-indigo-600 text-white shadow'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          T{t}
        </button>
      ))}
    </div>
  );
}