import React from 'react';
import Link from 'next/link';

interface LogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  href?: string | null;
  className?: string;
  variant?: 'auto' | 'light' | 'dark';
  textOnly?: boolean;
  iconOnly?: boolean;
}

const heightMap = {
  xs: 22,
  sm: 28,
  md: 38,
  lg: 48,
  xl: 64,
  xxl: 88
};

/**
 * Logo Oficial Concept 2B da InfluNext
 * Escala calibrada harmonicamente para cabeçalhos e painéis
 */
export function Logo({
  size = 'md',
  href = '/',
  className = '',
  variant = 'auto'
}: LogoProps) {
  const h = heightMap[size];

  const content = (
    <span className={`inline-flex items-center select-none ${className}`}>
      <img
        src="/logo-concept2b.png?v=5"
        alt="InfluNext"
        style={{ height: `${h}px`, width: 'auto' }}
        className="object-contain"
      />
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center hover:opacity-90 transition-opacity">
        {content}
      </Link>
    );
  }
  return <span className="inline-flex">{content}</span>;
}

export default Logo;
