import React from 'react';

export type LogoVariant = 'full' | 'horizontal' | 'vertical' | 'badge' | 'icon';
export type LogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | number;

export interface CompanyLogoProps {
  variant?: LogoVariant;
  size?: LogoSize;
  className?: string;
  showSubtitle?: boolean;
  theme?: 'light' | 'dark' | 'auto';
  onClick?: () => void;
}

/**
 * Official Brand Identity for Venâncio Piscinas.
 * - Classic Sun, Beach Umbrella, Seagulls & Dynamic Waves Vector Art
 * - "VENÂNCIO PISCINAS" + "Limpeza e Manutenção"
 * - Maintains 100% aspect ratio, no truncation or clipping.
 */
export const CompanyLogo: React.FC<CompanyLogoProps> = ({
  variant = 'horizontal',
  size = 'md',
  className = '',
  showSubtitle = true,
  theme = 'auto',
  onClick,
}) => {
  // Compute pixel dimensions
  const getDimensions = () => {
    if (typeof size === 'number') {
      return { width: size, height: size };
    }
    switch (size) {
      case 'xs':
        return { width: 30, height: 30, titleSize: 'text-xs', subSize: 'text-[9px]' };
      case 'sm':
        return { width: 36, height: 36, titleSize: 'text-sm', subSize: 'text-[10px]' };
      case 'md':
        return { width: 44, height: 44, titleSize: 'text-base', subSize: 'text-[11px]' };
      case 'lg':
        return { width: 56, height: 56, titleSize: 'text-lg', subSize: 'text-xs' };
      case 'xl':
        return { width: 80, height: 80, titleSize: 'text-xl', subSize: 'text-sm' };
      case '2xl':
        return { width: 120, height: 120, titleSize: 'text-2xl', subSize: 'text-base' };
      default:
        return { width: 44, height: 44, titleSize: 'text-base', subSize: 'text-[11px]' };
    }
  };

  const dims = getDimensions();

  // Official Vector Emblem: Royal Blue Canvas + Golden Sun + Umbrellas + Seagulls + Waves
  const renderClassicEmblem = (w: number, h: number, isRounded = true) => (
    <svg
      viewBox="0 0 200 200"
      width={w}
      height={h}
      style={{ width: `${w}px`, height: `${h}px` }}
      className={`shrink-0 select-none ${isRounded ? 'rounded-xl' : ''} shadow-xs`}
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="vpOfficialBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0062E3" />
          <stop offset="100%" stopColor="#004FB8" />
        </linearGradient>
        <linearGradient id="vpSunGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFDE00" />
          <stop offset="100%" stopColor="#FFAE00" />
        </linearGradient>
        <linearGradient id="vpCyanWave" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#00D2FF" />
        </linearGradient>
        <linearGradient id="vpDeepWave" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0284C7" />
          <stop offset="100%" stopColor="#0044B8" />
        </linearGradient>
      </defs>

      {/* Blue Background with Rounded Corners */}
      <rect width="200" height="200" fill="url(#vpOfficialBg)" rx={isRounded ? 36 : 0} />

      {/* Seagulls in the Sky */}
      <path
        d="M 38 42 Q 48 35 58 42 Q 53 38 48 39 Q 43 38 38 42 Z"
        fill="#FFFFFF"
        opacity="0.95"
      />
      <path
        d="M 138 46 Q 148 39 158 46 Q 153 42 148 43 Q 143 42 138 46 Z"
        fill="#FFFFFF"
        opacity="0.95"
      />
      <path
        d="M 148 60 Q 156 54 164 60 Q 160 57 156 58 Q 152 57 148 60 Z"
        fill="#FFFFFF"
        opacity="0.95"
      />

      {/* Golden Sun */}
      <circle cx="100" cy="84" r="48" fill="url(#vpSunGrad)" />

      {/* Beach Umbrellas (Parasols on the Sun) */}
      {/* Left Umbrella */}
      <g transform="translate(80, 92) rotate(-10)">
        <line x1="0" y1="-4" x2="4" y2="34" stroke="#003E94" strokeWidth="3.5" strokeLinecap="round" />
        <path
          d="M -34 -4 C -34 -32, 34 -32, 34 -4 C 21 -2, 14 -7, 0 -3 C -14 -7, -21 -2, -34 -4 Z"
          fill="#003E94"
        />
      </g>

      {/* Right Umbrella */}
      <g transform="translate(122, 105) rotate(14)">
        <line x1="0" y1="-3" x2="2" y2="28" stroke="#003E94" strokeWidth="3" strokeLinecap="round" />
        <path
          d="M -26 -3 C -26 -25, 26 -25, 26 -3 C 16 -1, 11 -5, 0 -2 C -11 -5, -16 -1, -26 -3 Z"
          fill="#003E94"
        />
      </g>

      {/* Flowing Water Waves */}
      <path
        d="M 10 114 Q 55 100 100 124 Q 150 148 190 110 L 190 190 L 10 190 Z"
        fill="url(#vpCyanWave)"
      />
      <path
        d="M 10 126 Q 60 110 110 136 Q 160 158 190 124 L 190 190 L 10 190 Z"
        fill="url(#vpDeepWave)"
      />
    </svg>
  );

  // 1. ICON ONLY
  if (variant === 'icon') {
    return (
      <div
        onClick={onClick}
        className={`inline-flex items-center justify-center shrink-0 ${onClick ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''} ${className}`}
        title="Venâncio Piscinas - Limpeza e Manutenção"
      >
        {renderClassicEmblem(dims.width, dims.height, true)}
      </div>
    );
  }

  // 2. COMPLETE SQUARE / BADGE
  if (variant === 'badge') {
    const badgeSize = typeof size === 'number' ? size : dims.width * 2.2;
    return (
      <div
        onClick={onClick}
        style={{ width: '100%', maxWidth: `${badgeSize}px` }}
        className={`inline-flex flex-col items-center justify-center shrink-0 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      >
        <svg
          viewBox="0 0 400 400"
          className="w-full h-auto drop-shadow-md"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="vpBdgBg2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0062E3" />
              <stop offset="100%" stopColor="#004FB8" />
            </linearGradient>
            <linearGradient id="vpBdgSun2" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFDE00" />
              <stop offset="100%" stopColor="#FFAE00" />
            </linearGradient>
            <linearGradient id="vpBdgCyan2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#00D2FF" />
            </linearGradient>
            <linearGradient id="vpBdgWave2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0284C7" />
              <stop offset="100%" stopColor="#0044B8" />
            </linearGradient>
          </defs>

          {/* Card background */}
          <rect width="400" height="400" rx="40" fill="url(#vpBdgBg2)" />

          {/* Birds */}
          <path d="M 80 72 Q 98 60 114 72 Q 106 65 97 68 Q 88 65 80 72 Z" fill="#FFFFFF" />
          <path d="M 285 78 Q 302 67 319 78 Q 312 72 302 74 Q 293 72 285 78 Z" fill="#FFFFFF" />
          <path d="M 300 100 Q 315 91 330 100 Q 323 95 315 97 Q 307 95 300 100 Z" fill="#FFFFFF" />

          {/* Sun */}
          <circle cx="200" cy="138" r="82" fill="url(#vpBdgSun2)" />

          {/* Parasols */}
          <g transform="translate(160, 150) rotate(-10)">
            <line x1="0" y1="-8" x2="8" y2="52" stroke="#003E94" strokeWidth="5.5" strokeLinecap="round" />
            <path
              d="M -58 -8 C -58 -54, 58 -54, 58 -8 C 36 -4, 24 -11, 0 -5 C -24 -11, -36 -4, -58 -8 Z"
              fill="#003E94"
            />
          </g>
          <g transform="translate(230, 175) rotate(14)">
            <line x1="0" y1="-6" x2="4" y2="44" stroke="#003E94" strokeWidth="5" strokeLinecap="round" />
            <path
              d="M -44 -6 C -44 -42, 44 -42, 44 -6 C 27 -3, 18 -9, 0 -4 C -18 -9, -27 -3, -44 -6 Z"
              fill="#003E94"
            />
          </g>

          {/* Waves */}
          <path
            d="M 50 195 Q 120 175 190 210 Q 270 245 350 185 L 350 250 L 50 250 Z"
            fill="url(#vpBdgCyan2)"
          />
          <path
            d="M 50 208 Q 130 185 210 225 Q 290 260 380 198 L 380 260 L 50 260 Z"
            fill="url(#vpBdgWave2)"
          />

          {/* VENÂNCIO PISCINAS Text */}
          <text
            x="200"
            y="304"
            textAnchor="middle"
            fill="#FFFFFF"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontWeight="900"
            fontSize="38"
            letterSpacing="2"
          >
            VENÂNCIO
          </text>
          <text
            x="200"
            y="342"
            textAnchor="middle"
            fill="#FFFFFF"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontWeight="800"
            fontSize="24"
            letterSpacing="6"
          >
            PISCINAS
          </text>

          {/* Limpeza e Manutenção Subtitle */}
          <text
            x="200"
            y="375"
            textAnchor="middle"
            fill="#CBE2FF"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontWeight="700"
            fontSize="14"
            letterSpacing="1.5"
          >
            Limpeza e Manutenção
          </text>
        </svg>
      </div>
    );
  }

  // 3. VERTICAL STACKED
  if (variant === 'vertical') {
    return (
      <div
        onClick={onClick}
        className={`flex flex-col items-center text-center select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
      >
        <div className="mb-3.5 hover:scale-105 transition-transform duration-200">
          {renderClassicEmblem(dims.width, dims.height, true)}
        </div>

        <div className="flex flex-col items-center">
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white leading-tight flex items-center justify-center gap-1.5 whitespace-nowrap">
            <span>VENÂNCIO</span>
            <span className="text-sky-600 dark:text-sky-400 font-extrabold">PISCINAS</span>
          </h1>

          {showSubtitle && (
            <p className="text-xs sm:text-sm font-bold text-sky-700 dark:text-sky-300 mt-1 uppercase tracking-wider whitespace-nowrap">
              Limpeza e Manutenção
            </p>
          )}
        </div>
      </div>
    );
  }

  // 4. DEFAULT: HORIZONTAL / FULL
  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-2.5 sm:gap-3 select-none max-w-full ${onClick ? 'cursor-pointer hover:opacity-95' : ''} ${className}`}
    >
      {renderClassicEmblem(dims.width, dims.height, true)}

      <div className="flex flex-col justify-center leading-tight min-w-0">
        <div className="flex items-center gap-1 whitespace-nowrap">
          <span className="font-black text-slate-900 dark:text-white text-sm sm:text-base tracking-tight leading-none">
            VENÂNCIO
          </span>
          <span className="font-extrabold text-sky-600 dark:text-sky-400 text-sm sm:text-base tracking-tight leading-none">
            PISCINAS
          </span>
        </div>

        {showSubtitle && (
          <span className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5 tracking-wide leading-none whitespace-nowrap">
            Limpeza e Manutenção
          </span>
        )}
      </div>
    </div>
  );
};
