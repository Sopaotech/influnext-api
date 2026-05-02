import React from 'react';
import Link from 'next/link';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  href?: string;
  className?: string;
}

const sizeMap = {
  sm: { text: 'text-xl', arrow: 'w-5 h-5' },
  md: { text: 'text-2xl', arrow: 'w-6 h-6' },
  lg: { text: 'text-4xl', arrow: 'w-9 h-9' },
};

export function Logo({ size = 'md', href = '/', className = '' }: LogoProps) {
  const s = sizeMap[size];
  
  const content = (
    <span
      className={`inline-flex items-center gap-0 font-black tracking-tighter select-none ${s.text} ${className}`}
      style={{ filter: 'drop-shadow(0 0 16px rgba(168, 85, 247, 0.55))' }}
    >
      <span className="text-white">INFLUNEX</span>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className={`${s.arrow} flex-shrink-0 -ml-0.5 -mb-0.5`}
        aria-hidden="true"
      >
        <path
          d="M7 17L17 7M17 7H8M17 7V16"
          stroke="rgb(196 132 252)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center">
        {content}
      </Link>
    );
  }

  return content;
}
