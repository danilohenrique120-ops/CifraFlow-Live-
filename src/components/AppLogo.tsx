import React from 'react';
import { CadenceIcon } from './CadenceIcon';

export interface AppLogoProps {
  size?: number | string;
  className?: string;
  variant?: 'badge' | 'circle' | 'symbol' | 'squircle';
  glyphVariant?: 'ribbon' | 'monogram' | 'geometric';
  theme?: 'tungsten' | 'amber' | 'white' | 'dark';
  showText?: boolean;
  textClassName?: string;
  pulseBpm?: number; // Optional BPM to pulse the light dot
  gradientColors?: [string, string];
}

export const AppLogo: React.FC<AppLogoProps> = ({
  size = 36,
  className = '',
  variant = 'squircle',
  glyphVariant = 'ribbon',
  theme = 'tungsten',
  showText = false,
  textClassName = '',
  pulseBpm,
  gradientColors = ['#F59E0B', '#B45309']
}) => {
  const numericSize = typeof size === 'number' ? size : parseInt(size as string, 10) || 36;
  const borderRadius = Math.max(6, Math.round(numericSize * 0.25));
  const iconSize = Math.max(12, Math.round(numericSize * 0.72));

  if (variant === 'symbol') {
    return (
      <CadenceIcon
        size={numericSize}
        glyphVariant={glyphVariant}
        gradientColors={gradientColors}
        className={className}
      />
    );
  }

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* Squircle container with subtle two-tone gradient matching folder cards */}
      <div
        style={{
          width: numericSize,
          height: numericSize,
          borderRadius: variant === 'circle' ? '9999px' : `${borderRadius}px`
        }}
        className="relative flex-none overflow-hidden bg-gradient-to-br from-zinc-800 to-zinc-950 border border-white/10 flex items-center justify-center transition-transform hover:scale-105 select-none"
      >
        <CadenceIcon
          size={iconSize}
          glyphVariant={glyphVariant}
          gradientColors={gradientColors}
          className="select-none pointer-events-none"
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
          {/* Subtle accent dot without artificial glow/light halo */}
          <span
            className="w-1.5 h-1.5 rounded-full bg-amber-500/80"
            title="Cadencē Sincronia de Palco"
          />
        </div>
      )}
    </div>
  );
};
