import React from 'react';

export interface AppLogoProps {
  size?: number | string;
  className?: string;
  variant?: 'badge' | 'circle' | 'symbol';
  theme?: 'dark-note' | 'white-note' | 'emerald';
  showText?: boolean;
  textClassName?: string;
}

export const AppLogo: React.FC<AppLogoProps> = ({
  size = 36,
  className = '',
  variant = 'circle',
  theme = 'dark-note',
  showText = false,
  textClassName = ''
}) => {
  const isDarkNote = theme === 'dark-note';
  const isWhiteNote = theme === 'white-note';

  const noteFill = isDarkNote ? '#09090b' : isWhiteNote ? '#ffffff' : 'url(#cifraeEmeraldGrad)';
  const wifiStroke = isDarkNote ? '#09090b' : isWhiteNote ? '#ffffff' : 'url(#cifraeEmeraldGrad)';
  const wifiDotFill = isDarkNote ? '#09090b' : isWhiteNote ? '#ffffff' : '#34d399';

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        className="flex-none transition-transform hover:scale-105"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="cifraeEmeraldGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#059669" />
            <stop offset="50%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
          <filter id="cifraeGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#10b981" floodOpacity="0.35" />
          </filter>
        </defs>

        {variant === 'badge' && (
          <>
            <rect width="100" height="100" rx="26" fill="#09090b" />
            <circle cx="50" cy="50" r="41" fill="url(#cifraeEmeraldGrad)" filter="url(#cifraeGlow)" />
          </>
        )}

        {variant === 'circle' && (
          <circle cx="50" cy="50" r="47" fill="url(#cifraeEmeraldGrad)" filter="url(#cifraeGlow)" />
        )}

        {/* Musical Note: Tilted oval notehead and vertical stem */}
        <g fill={noteFill}>
          <ellipse cx="36" cy="67.5" rx="12" ry="8.8" transform="rotate(-28 36 67.5)" />
          <rect x="43.5" y="25" width="5.5" height="42.5" rx="2.75" />
        </g>

        {/* WiFi / Wireless Broadcasting Signal (Dot + 3 Waves) */}
        <g fill="none" stroke={wifiStroke} strokeWidth="4.2" strokeLinecap="round">
          <circle cx="55.5" cy="46" r="2.8" fill={wifiDotFill} stroke="none" />
          <path d="M 62 38.5 A 10.5 10.5 0 0 1 62 53.5" />
          <path d="M 68.5 31.5 A 19.5 19.5 0 0 1 68.5 60.5" />
          <path d="M 75 24.5 A 28.5 28.5 0 0 1 75 67.5" />
        </g>
      </svg>

      {showText && (
        <span className={`font-black tracking-tight text-white flex items-center ${textClassName || 'text-base sm:text-lg'}`}>
          Cifra<span className="text-emerald-400">ê</span>
        </span>
      )}
    </div>
  );
};
