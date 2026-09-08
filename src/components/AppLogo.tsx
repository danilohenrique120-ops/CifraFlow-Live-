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
  const numericSize = typeof size === 'number' ? size : parseInt(size as string, 10) || 36;
  const borderRadius = Math.max(6, Math.round(numericSize * 0.25));

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <div
        style={{
          width: numericSize,
          height: numericSize,
          borderRadius: variant === 'circle' ? '9999px' : `${borderRadius}px`
        }}
        className="relative flex-none overflow-hidden bg-[#050505] shadow-[0_2px_12px_rgba(0,0,0,0.7)] border border-white/10 flex items-center justify-center transition-transform hover:scale-105 select-none"
      >
        <img
          src="/cadence-logo.png"
          alt="Cadencē Logo"
          className="w-full h-full object-cover select-none pointer-events-none"
          loading="eager"
        />
      </div>

      {/* Wordmark: Cadencē in Satin White */}
      {showText && (
        <div className="flex items-center gap-1.5 select-none">
          <span
            className={`font-black tracking-tight text-[#F5F5F7] flex items-center font-sans ${
              textClassName || 'text-lg sm:text-xl'
            }`}
          >
            Cadencē
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
