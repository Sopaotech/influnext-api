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
    <div className={`flex items-center gap-4 font-black tracking-tighter select-none ${textSize} ${className} font-sans`}>
      <div className="flex-shrink-0 relative">
        <svg width="40" height="40" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[1.2em] h-[1.2em]">
          <rect width="512" height="512" rx="128" fill="#080810"/>
          <path d="M156 140L256 240L356 140" stroke="#8B5CF6" stroke-width="40" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M156 372L256 272L356 372" stroke="#EC4899" stroke-width="40" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="256" cy="256" r="40" fill="white" />
        </svg>
      </div>
      <div className="flex items-baseline">
        <span className="text-slate-900">INFLUNE</span>
        <span className="text-transparent bg-clip-text bg-gradient-to-tr from-purple-600 to-indigo-600 relative">
          X
        </span>
        <span className="text-slate-900">T</span>
      </div>
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
