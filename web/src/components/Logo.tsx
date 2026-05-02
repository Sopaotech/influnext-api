import React from 'react';
import Link from 'next/link';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  href?: string;
  className?: string;
}

const sizeMap = {
  sm: { width: 140, height: 24 },
  md: { width: 180, height: 32 },
  lg: { width: 260, height: 48 },
  xl: { width: 340, height: 64 },
};

export function Logo({ size = 'md', href = '/', className = '' }: LogoProps) {
  const dimensions = sizeMap[size];

  const content = (
    <svg 
      width={dimensions.width} 
      height={dimensions.height} 
      viewBox="0 0 340 64" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="x-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#534AB7" />
          <stop offset="100%" stopColor="#C4BEFF" />
        </linearGradient>
        <filter id="x-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Texto base: INFLUNE T */}
      <text 
        x="0" 
        y="48" 
        fontFamily="system-ui, -apple-system, sans-serif" 
        fontWeight="900" 
        fontSize="52" 
        fill="#FFFFFF" 
        letterSpacing="-0.04em"
      >
        INFLUNE<tspan dx="50">T</tspan>
      </text>

      {/* X com Seta Integrada - Usando Paths exatos */}
      <g filter="url(#x-glow)" transform="translate(232, 8)">
        {/* Perna Principal Diag. \ */}
        <path 
          d="M 5,5 L 35,45" 
          stroke="url(#x-gradient)" 
          strokeWidth="7" 
          strokeLinecap="round" 
        />
        {/* Perna Secundária Diag. / com corte no topo */}
        <path 
          d="M 5,45 L 28,15" 
          stroke="url(#x-gradient)" 
          strokeWidth="7" 
          strokeLinecap="round" 
        />
        {/* Seta (Arrow ↗) unida à ponta direita superior */}
        <path 
          d="M 22,-2 L 42,-2 L 42,18" 
          stroke="url(#x-gradient)" 
          strokeWidth="6" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          fill="none" 
        />
        <path 
          d="M 28,15 L 42,-2" 
          stroke="url(#x-gradient)" 
          strokeWidth="6" 
          strokeLinecap="round" 
        />
      </g>
    </svg>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center hover:opacity-90 transition-opacity select-none">
        {content}
      </Link>
    );
  }

  return <div className="inline-flex select-none">{content}</div>;
}
