import React from 'react';

export interface CadenceIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  className?: string;
  color?: string; // e.g. '#F59E0B'
  gradient?: boolean;
  gradientColors?: [string, string];
  glyphVariant?: 'ribbon' | 'monogram' | 'geometric';
}

export const CadenceIcon: React.FC<CadenceIconProps> = ({
  size = 24,
  className = '',
  color = '#F59E0B',
  gradient = true,
  gradientColors = ['#F59E0B', '#B45309'],
  glyphVariant = 'ribbon',
  ...props
}) => {
  const gradientId = React.useId();
  const numericSize = typeof size === 'number' ? size : parseInt(size as string, 10) || 24;
  const sw = numericSize <= 24 ? 2.6 : 2.4;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {gradient && (
        <defs>
          <linearGradient
            id={gradientId}
            x1="4"
            y1="5"
            x2="28"
            y2="27"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor={gradientColors[0]} />
            <stop offset="1" stopColor={gradientColors[1]} />
          </linearGradient>
        </defs>
      )}

      {glyphVariant === 'ribbon' && (
        <>
          {/* Traço 1: Onda rítmica esquerda que sobe até o topo do C */}
          <path
            d="M 4 16 H 7.5 C 9.5 16 10.5 12.5 11.5 9.5 C 13 6.5 16.5 5.5 19.5 5.5 C 23 5.5 25.5 7.5 25.5 10.5"
            stroke={gradient ? `url(#${gradientId})` : color}
            strokeWidth={sw}
            strokeLinecap="round"
          />
          {/* Traço 2: Espinha interior que desce e forma o arco inferior simétrico do C */}
          <path
            d="M 16 8 C 14.5 10.5 13.8 13.5 13.8 16 C 13.8 19.5 15.2 23 18.5 25.5 C 21.8 26.5 24.8 24.8 25.5 21.5"
            stroke={gradient ? `url(#${gradientId})` : color}
            strokeWidth={sw}
            strokeLinecap="round"
          />
          {/* Traço 3: Linha de cadência/tempo central horizontal */}
          <path
            d="M 16.5 16 H 27.5"
            stroke={gradient ? `url(#${gradientId})` : color}
            strokeWidth={sw}
            strokeLinecap="round"
          />
        </>
      )}

      {glyphVariant === 'monogram' && (
        <>
          <path
            d="M 4 16 H 7.5 C 9.5 16 10.5 12.5 12 9 C 13.8 5.5 17.5 5 20.5 5 C 24 5 26.5 7 26.5 10.5"
            stroke={gradient ? `url(#${gradientId})` : color}
            strokeWidth={sw}
            strokeLinecap="round"
          />
          <path
            d="M 26.5 21.5 C 25.5 24.5 23 26.5 19.5 26.5 C 15 26.5 11.5 22.5 11.5 16"
            stroke={gradient ? `url(#${gradientId})` : color}
            strokeWidth={sw}
            strokeLinecap="round"
          />
          <path
            d="M 15 16 H 27.5"
            stroke={gradient ? `url(#${gradientId})` : color}
            strokeWidth={sw}
            strokeLinecap="round"
          />
        </>
      )}

      {glyphVariant === 'geometric' && (
        <>
          <path
            d="M 4 16 H 11"
            stroke={gradient ? `url(#${gradientId})` : color}
            strokeWidth={sw}
            strokeLinecap="round"
          />
          <path
            d="M 26 10 C 24 6.5 20 5 16.5 5 C 10.5 5 8 10 8 16 C 8 22 10.5 27 16.5 27 C 20 27 24 25.5 26 22"
            stroke={gradient ? `url(#${gradientId})` : color}
            strokeWidth={sw}
            strokeLinecap="round"
          />
          <path
            d="M 14.5 16 H 27.5"
            stroke={gradient ? `url(#${gradientId})` : color}
            strokeWidth={sw}
            strokeLinecap="round"
          />
        </>
      )}
    </svg>
  );
};
