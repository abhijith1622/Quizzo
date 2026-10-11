import React from 'react';

interface QuizzoLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon' | 'stacked';
  theme?: 'dark' | 'light' | 'auto';
}

/**
 * High-fidelity vector rendition of the official Quizzo geometric faceted "Q" logo
 * with dual-tone cerulean/royal blue shading and arrow pointer tail.
 */
export const QuizzoIcon: React.FC<{ className?: string; size?: number | string }> = ({ 
  className = "w-8 h-8",
  size
}) => {
  const style = size ? { width: size, height: size } : undefined;

  return (
    <svg 
      viewBox="0 0 120 120" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      style={style}
      aria-label="Quizzo Logo Icon"
    >
      <defs>
        {/* Soft background glow */}
        <filter id="q-glow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#0284c7" floodOpacity="0.25" />
        </filter>
        
        {/* Top & Left bright cyan/sky blue */}
        <linearGradient id="facet-cyan" x1="15" y1="15" x2="60" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#0284C7" />
        </linearGradient>

        {/* Right & Lower royal blue facet */}
        <linearGradient id="facet-royal" x1="50" y1="15" x2="95" y2="85" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0284C7" />
          <stop offset="100%" stopColor="#0E3D8C" />
        </linearGradient>

        {/* Arrow pointer tail upper vibrant cyan facet */}
        <linearGradient id="arrow-upper" x1="45" y1="42" x2="105" y2="85" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="60%" stopColor="#0284C7" />
          <stop offset="100%" stopColor="#0369A1" />
        </linearGradient>

        {/* Arrow pointer tail lower deep royal facet */}
        <linearGradient id="arrow-lower" x1="55" y1="65" x2="110" y2="92" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0369A1" />
          <stop offset="100%" stopColor="#0B2B68" />
        </linearGradient>
      </defs>

      <g filter="url(#q-glow)">
        {/* 1. Top-Left / Left Octagonal Ring Facet */}
        <path
          d="M 36 12 
             L 58 12 
             L 58 26 
             L 38 26 
             L 26 38 
             L 26 58 
             L 36 68 
             L 28 78 
             L 14 62 
             L 14 36 
             Z"
          fill="url(#facet-cyan)"
        />

        {/* 2. Top-Right / Right Octagonal Ring Facet */}
        <path
          d="M 58 12 
             L 80 12 
             L 98 34 
             L 98 60 
             L 80 80 
             L 60 80 
             L 56 68 
             L 74 68 
             L 84 56 
             L 84 38 
             L 72 26 
             L 58 26 
             Z"
          fill="url(#facet-royal)"
        />

        {/* 3. Bottom-Left Joint Ring Facet */}
        <path
          d="M 28 78 
             L 36 68 
             L 48 70 
             L 48 80 
             L 36 80 
             Z"
          fill="#0284C7"
        />

        {/* 4. Center Diamond/Roof Inward Negative Space Trim */}
        <path
          d="M 26 58 
             L 38 46 
             L 48 38 
             L 72 38 
             L 58 48 
             L 45 42 
             L 38 48 
             Z"
          fill="#0369A1"
          opacity="0.9"
        />

        {/* 5. Sharp Arrow / Pointer Tail (Upper Facet) */}
        <path
          d="M 45 42 
             L 70 56 
             L 108 86 
             L 75 74 
             L 58 54 
             Z"
          fill="url(#arrow-upper)"
        />

        {/* 6. Sharp Arrow / Pointer Tail (Lower / Drop Shadow Facet) */}
        <path
          d="M 58 54 
             L 75 74 
             L 108 86 
             L 78 86 
             L 62 68 
             Z"
          fill="url(#arrow-lower)"
        />

        {/* 7. Arrow Accent Edge Highlight */}
        <path
          d="M 45 42 L 108 86"
          stroke="#7DD3FC"
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.8"
        />
      </g>
    </svg>
  );
};

/**
 * Complete Quizzo Logo with authentic vector icon and refined wordmark
 */
export const QuizzoLogo: React.FC<QuizzoLogoProps> = ({
  className = "",
  size = "md",
  variant = "full",
  theme = "auto"
}) => {
  const iconSizes = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-11 h-11",
    xl: "w-16 h-16"
  };

  const textSizes = {
    sm: "text-base tracking-tight",
    md: "text-xl tracking-tight",
    lg: "text-2xl sm:text-3xl tracking-tight",
    xl: "text-3xl sm:text-4xl tracking-tight"
  };

  const textThemeClasses = {
    dark: "text-white",
    light: "text-blue-950",
    auto: "text-blue-950 dark:text-white"
  };

  const subThemeClasses = {
    dark: "text-blue-200/80",
    light: "text-blue-700",
    auto: "text-blue-700 dark:text-blue-300"
  };

  if (variant === "icon") {
    return <QuizzoIcon className={`${iconSizes[size]} ${className}`} />;
  }

  if (variant === "stacked") {
    return (
      <div className={`inline-flex flex-col items-center gap-2 group ${className}`}>
        <div className="relative group-hover:scale-105 transition-transform duration-300 drop-shadow-md">
          <QuizzoIcon className={iconSizes[size]} />
        </div>
        <div className="text-center">
          <span className={`font-black font-sans block ${textSizes[size]} ${textThemeClasses[theme]}`}>
            Quizzo
          </span>
          <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-widest ${subThemeClasses[theme]}`}>
            Live Quiz Platform
          </span>
        </div>
      </div>
    );
  }

  // Default horizontal layout (ideal for Navbars, Footers, and Headers)
  return (
    <div className={`inline-flex items-center gap-2.5 group ${className}`}>
      <div className="relative group-hover:scale-105 transition-transform duration-300 shrink-0 drop-shadow-sm">
        <QuizzoIcon className={iconSizes[size]} />
      </div>
      <div className="flex items-baseline">
        <span className={`font-black font-sans leading-none ${textSizes[size]} ${textThemeClasses[theme]}`}>
          Quizzo
        </span>
        <span className="hidden sm:inline-block ml-1.5 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50/90 rounded border border-blue-200">
          Live
        </span>
      </div>
    </div>
  );
};

export default QuizzoLogo;
