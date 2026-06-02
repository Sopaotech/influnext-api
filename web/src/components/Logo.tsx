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
    <div className={`relative select-none ${logoHeight} ${className} flex items-center gap-1`}>
      <span className={`text-xl md:text-2xl font-[900] tracking-[-0.05em] ${colorClass}`}>
        INFLUNE
      </span>
      {/* O "X" com Seta Estilizado da sua logo original */}
      <div className="relative h-[80%] aspect-square -ml-1">
        <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible">
          <path 
            d="M20 20 L80 80 M20 80 L55 45" 
            stroke="#9f7aea" 
            strokeWidth="18" 
            strokeLinecap="butt"
          />
          <path 
            d="M55 45 L85 15" 
            stroke="#9f7aea" 
            strokeWidth="18" 
            strokeLinecap="butt"
          />
          {/* Ponta da Seta */}
          <path 
            d="M65 15 L88 12 L92 35" 
            fill="#9f7aea"
          />
        </svg>
      </div>
      <span className={`text-xl md:text-2xl font-[900] tracking-[-0.05em] ${colorClass} -ml-1`}>
        T
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
