import React from 'react';
import Link from 'next/link';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  href?: string;
  className?: string;
}

const sizeMap = {
  sm: 'text-xl',
  md: 'text-2xl',
  lg: 'text-4xl',
  xl: 'text-6xl',
};

export function Logo({ size = 'md', href = '/', className = '' }: LogoProps) {
  const textSize = sizeMap[size];

  const content = (
    <span
      className={`inline-flex items-center font-black tracking-tighter select-none ${textSize} ${className}`}
    >
      <span className="text-white">INFLUNEX</span>
      <span
        style={{
          color: '#c084fc',
          textShadow: '0 0 24px rgba(192, 132, 252, 0.65), 0 0 48px rgba(192, 132, 252, 0.25)',
        }}
      >
        T
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

  return content;
}
