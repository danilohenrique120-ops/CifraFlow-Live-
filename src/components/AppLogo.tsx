import React from 'react';

export interface AppLogoProps {
  size?: number | string;
  className?: string;
  variant?: 'badge' | 'circle' | 'symbol' | 'squircle';
  theme?: 'tungsten' | 'amber' | 'white' | 'dark';
  showText?: boolean;
  textClassName?: string;
  pulseBpm?: number; // Optional BPM to pulse the light dot
}

export const AppLogo: React.FC<AppLogoProps> = ({
  size = 36,
  className = '',
  variant = 'squircle',
  theme = 'tungsten',
  showText = false,
  textClassName = '',
  pulseBpm
}) => {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        className="flex-none transition-transform hover:scale-105 select-none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Tungsten Stage Light Filament Gradient */}
          <linearGradient id="cadenceTungstenGrad" x1="10%" y1="10%" x2="90%" y2="90%">
            <stop offset="0%" stopColor="#FFF8E7" />
            <stop offset="30%" stopColor="#FFB340" />
            <stop offset="75%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>

          {/* Liquid Glass Volumetric Glow */}
          <filter id="cadenceStageGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="blur" />
            <feColorMatrix
              in="blur"
              type="matrix"
              values="1 0 0 0 0.96   0 0.7 0 0 0.62   0 0 0.1 0 0.1   0 0 0 0.65 0"
              result="glow"
            />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Subtle Specular Reflection for Titanium Squircle */}
          <linearGradient id="titaniumBorder" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.22)" />
            <stop offset="40%" stopColor="rgba(255, 255, 255, 0.05)" />
            <stop offset="100%" stopColor="rgba(245, 158, 11, 0.18)" />
          </linearGradient>
        </defs>

        {/* 1. Titanium Black Squircle Base (Apple Superellipse standard) */}
        {(variant === 'squircle' || variant === 'badge') && (
          <>
            <rect
              x="3"
              y="3"
              width="94"
              height="94"
              rx="25"
              fill="#050505"
              stroke="url(#titaniumBorder)"
              strokeWidth="1.5"
            />
            {/* Ambient Backlight Glow inside base */}
            <circle cx="50" cy="50" r="28" fill="#F59E0B" opacity="0.08" filter="blur(10px)" />
          </>
        )}

        {variant === 'circle' && (
          <>
            <circle cx="50" cy="50" r="46" fill="#050505" stroke="url(#titaniumBorder)" strokeWidth="1.5" />
            <circle cx="50" cy="50" r="28" fill="#F59E0B" opacity="0.08" filter="blur(10px)" />
          </>
        )}

        {/* 2. O Arco Harmônico (The Harmonic Waveform C) */}
        <g filter="url(#cadenceStageGlow)">
          {/* Parabolic Dynamic Soundwave Arc forming the C */}
          <path
            d="M 68 31 C 55 21, 31 23, 27 50 C 23 77, 55 79, 68 69"
            stroke="url(#cadenceTungstenGrad)"
            strokeWidth="5.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Precise Metric Rhythm Horizontal Bar */}
          <line
            x1="38"
            y1="50"
            x2="77"
            y2="50"
            stroke="url(#cadenceTungstenGrad)"
            strokeWidth="4.8"
            strokeLinecap="round"
          />

          {/* Focal Harmonic Anchor Pulse Point */}
          <circle
            cx="77"
            cy="50"
            r="2.8"
            fill="#FFF8E7"
          />
        </g>
      </svg>

      {/* 3. Wordmark: Cadencē in Satin White */}
      {showText && (
        <div className="flex items-center gap-1.5 select-none">
          <span
            className={`font-black tracking-tight text-[#F5F5F7] flex items-center font-sans ${
              textClassName || 'text-lg sm:text-xl'
            }`}
          >
            Cadenc<span className="relative">ē</span>
          </span>
          {/* Subtly pulsed Live Stage Indicator */}
          <span
            className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shadow-[0_0_8px_#F59E0B]"
            style={{
              animationDuration: pulseBpm ? `${60 / pulseBpm}s` : '2s'
            }}
            title="Sincronia de Palco Ativa"
          />
        </div>
      )}
    </div>
  );
};
