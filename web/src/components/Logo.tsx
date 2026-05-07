import React from 'react';
import Link from 'next/link';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  href?: string;
  className?: string;
}

const sizeMap = {
  sm: 'text-2xl',
  md: 'text-3xl',
  lg: 'text-5xl',
  xl: 'text-6xl',
};

export function Logo({ size = 'md', href = '/', className = '' }: LogoProps) {
  const textSize = sizeMap[size];

  const content = (
    <div className={`font-black tracking-tighter select-none ${textSize} ${className} font-sans`}>
      <span className="text-slate-900">INFLUNE</span>
      <span className="text-transparent bg-clip-text bg-gradient-to-tr from-purple-600 to-indigo-600 relative">
        X
      </span>
      <span className="text-slate-900">T</span>
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
