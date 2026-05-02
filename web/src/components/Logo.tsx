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
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Texto base: INFLUNE T (Branco para o Dark Mode Premium) */}
      <text 
        x="0" 
        y="48" 
        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" 
        fontWeight="900" 
        fontSize="52" 
        fill="#FFFFFF" 
        letterSpacing="-0.02em"
      >
        INFLUNE<tspan dx="60">T</tspan>
      </text>

      {/* X com Seta Sólida Integrada (Exatamente igual à imagem enviada) */}
      <g filter="url(#x-glow)" transform="translate(238, 10)">
        
        {/* Perna Secundária \ (Topo Esquerda -> Baixo Direita) */}
        <line 
          x1="0" y1="0" 
          x2="32" y2="40" 
          stroke="url(#x-gradient)" 
          strokeWidth="10" 
          strokeLinecap="butt" 
        />
        
        {/* Perna Principal / com Seta (Baixo Esquerda -> Topo Direita) */}
        <line 
          x1="-2" y1="40" 
          x2="38" y2="-6" 
          stroke="url(#x-gradient)" 
          strokeWidth="10" 
          strokeLinecap="butt" 
        />
        
        {/* Cabeça da Seta (Triângulo sólido perfeito apontando para cima/direita) */}
        <polygon 
          points="26,-15 50,-18 43,6" 
          fill="#C4BEFF" 
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
