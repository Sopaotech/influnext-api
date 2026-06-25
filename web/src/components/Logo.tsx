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
  sm: 'text-[10px]',
  md: 'text-[11px] md:text-xs',
  lg: 'text-sm md:text-base',
  xl: 'text-xl sm:text-2xl',
  xxl: 'text-3xl sm:text-4xl'
};

const iconSizeMap = {
  sm: 18,
  md: 36,
  lg: 56,
  xl: 96,
  xxl: 144
};

function SpeedometerIcon({ size, className = '' }: { size: number; className?: string }) {
  const uid = `speed-${size}`;
  const height = size * 0.75; // Aspect ratio of the speedometer viewBox (32x24)
  return (
    <svg
      width={size}
      height={height}
      viewBox="0 0 32 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      style={{ display: 'block', flexShrink: 0 }}
    >
      <defs>
        <linearGradient id={uid} x1="0" y1="24" x2="32" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
      </defs>
      {/* Outer gauge arc (240 degrees) */}
      <path
        d="M 7.3 21 A 10 10 0 1 1 24.7 21"
        stroke={`url(#${uid})`}
        strokeWidth="3.2"
        strokeLinecap="round"
        fill="none"
      />
      {/* Needle pointing to top-right (around 45 degrees) */}
      <path
        d="M 16 16 L 21.5 10.5"
        stroke={`url(#${uid})`}
        strokeWidth="2.8"
        strokeLinecap="round"
      />
      {/* Needle Cap / Center Pin */}
      <circle cx="16" cy="16" r="2" fill={`url(#${uid})`} />
    </svg>
  );
}

export function Logo({ size = 'md', href = '/', className = '', variant = 'auto', textOnly = false }: LogoProps) {
  const fontSize = fontSizeMap[size];
  const iconSize = iconSizeMap[size];

  const textColor =
    variant === 'light' ? 'text-white'
    : variant === 'dark' ? 'text-slate-900'
    : 'text-slate-900 dark:text-white';

  const content = (
    <span className={`inline-flex ${textOnly ? 'items-center' : 'flex-col items-center'} select-none ${className}`}>
      {/* Vertically stacked speedometer icon */}
      {!textOnly && <SpeedometerIcon size={iconSize} className="mb-0" />}
      <span className={`font-black tracking-tighter leading-none ${fontSize} ${textColor}`}>
        Influ
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-500 to-pink-500">
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

