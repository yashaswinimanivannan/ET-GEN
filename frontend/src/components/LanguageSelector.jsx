import { FiGlobe } from 'react-icons/fi';

const languages = [
  { code: 'English', label: 'English', flag: '🇬🇧' },
  { code: 'Hindi', label: 'हिन्दी (Hindi)', flag: '🇮🇳' },
  { code: 'Tamil', label: 'தமிழ் (Tamil)', flag: '🇮🇳' },
];

export default function LanguageSelector({ value, onChange }) {
  return (
    <div>
      <label className="flex items-center gap-2 text-sm font-medium text-text-muted mb-2.5">
        <FiGlobe className="w-4 h-4 text-primary/60" />
        Output Language
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-11 appearance-none bg-surface-light border border-white/8 rounded-lg px-4 text-text text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all cursor-pointer"
        >
          {languages.map((lang) => (
            <option key={lang.code} value={lang.code} className="bg-surface text-text">
              {lang.flag}  {lang.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
          <svg className="w-4 h-4 text-text-muted/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
}
