import React from 'react';
import Link from 'next/link';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  href?: string;
  className?: string;
  textColor?: string;
}

const sizeMap = {
  sm: 'h-6 md:h-8',
  md: 'h-10 md:h-12',
  lg: 'h-16 md:h-20',
  xl: 'h-24 md:h-32',
};

export function Logo({ size = 'md', href = '/', className = '', textColor }: LogoProps) {
  const logoHeight = sizeMap[size];
  const colorClass = textColor || "text-slate-900 dark:text-white";

  const content = (
    <div className={`relative select-none ${logoHeight} ${className} flex items-center gap-2`}>
      {/* Ícone Oficial de Crescimento / Dashboard */}
      <div className="h-[90%] aspect-square flex items-center justify-center">
        <svg viewBox="0 0 64 64" className="h-full w-full overflow-visible" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="logo-chart-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#7C3AED" />
              <stop offset="100%" stopColor="#3B82F6" />
            </linearGradient>
          </defs>
          <g transform="translate(6, 10)">
            {/* Barras verticais */}
            <rect x="6" y="24" width="6" height="18" rx="1.5" fill="url(#logo-chart-gradient)" opacity="0.6" />
            <rect x="16" y="16" width="6" height="26" rx="1.5" fill="url(#logo-chart-gradient)" opacity="0.7" />
            <rect x="26" y="22" width="6" height="20" rx="1.5" fill="url(#logo-chart-gradient)" opacity="0.8" />
            <rect x="36" y="10" width="6" height="32" rx="1.5" fill="url(#logo-chart-gradient)" opacity="0.9" />
            <rect x="46" y="2" width="6" height="40" rx="1.5" fill="url(#logo-chart-gradient)" />

            {/* Seta de Tendência */}
            <path 
              d="M -2,32 L 8,20 L 18,10 L 28,18 L 40,2 L 50,-8" 
              stroke="url(#logo-chart-gradient)" 
              strokeWidth="5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              fill="none" 
            />
            
            {/* Cabeça da Seta */}
            <polygon 
              points="40,-12 56,-14 50,4" 
              fill="#3B82F6" 
            />
          </g>
        </svg>
      </div>

      {/* Nome da Marca com Outfit e Gradiente */}
      <span className={`text-xl md:text-2xl font-[900] tracking-[-0.03em] ${colorClass} flex items-center font-sans`}>
        Influ
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7C3AED] to-[#3B82F6] ml-0.5">
          Next
        </span>
      </span>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center hover:opacity-90 transition-opacity">
        {content}
      </Link>
    );
  }

  return <div className="inline-flex">{content}</div>;
}
