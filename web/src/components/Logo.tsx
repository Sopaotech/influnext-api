import React from 'react';
import Link from 'next/link';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  href?: string | null;
  className?: string;
  variant?: 'auto' | 'light' | 'dark';
  textOnly?: boolean;
}

const fontSizeMap = {
  sm: 'text-[13px]',
  md: 'text-2xl',
  lg: 'text-3xl',
  xl: 'text-5xl',
  xxl: 'text-7xl md:text-8xl'
};

const iconSizeMap = {
  sm: 18,
  md: 28,
  lg: 36,
  xl: 56,
  xxl: 96
};

export function Logo({ size = 'md', href = '/', className = '', variant = 'auto', textOnly = false }: LogoProps) {
  const fontSize = fontSizeMap[size];
  const iconSize = iconSizeMap[size];

  const textColor =
    variant === 'light' ? 'text-white'
    : variant === 'dark' ? 'text-slate-900'
    : 'text-slate-900 dark:text-white';

  const content = (
    <span className={`inline-flex items-center gap-1.5 select-none ${className}`}>
      {/* Horizontally aligned transparent icon */}
      {!textOnly && (
        <img
          src="/icon.png?v=3"
          alt="InfluNext"
          style={{ width: `${iconSize}px`, height: `${iconSize}px` }}
          className="object-contain flex-shrink-0"
        />
      )}
      <span className={`font-black tracking-tighter leading-none ${fontSize} ${textColor}`}>
        Influ
        <span className="text-[#d96b27]">
          Next
        </span>
      </span>
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






