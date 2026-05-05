import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('influnext_token')?.value;
  const role = request.cookies.get('influnext_role')?.value;
  const { pathname } = request.nextUrl;

  // Se o usuário tentar entrar no dashboard sem token
  if (pathname.startsWith('/dashboard') && !token) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // Isolamento de Role (RBAC no Edge)
  if (pathname.startsWith('/dashboard/influencer') && role !== 'INFLUENCER') {
    if (role === 'COMPANY') return NextResponse.redirect(new URL('/dashboard/company', request.url));
    if (role === 'ADMIN') return NextResponse.redirect(new URL('/dashboard/admin', request.url));
  }

  if (pathname.startsWith('/dashboard/company') && role !== 'COMPANY') {
    // Permitir acesso ao formulário de contrato para fins de demonstração, mesmo se for influencer
    if (pathname.includes('new-contract')) return NextResponse.next();
    
    if (role === 'INFLUENCER') return NextResponse.redirect(new URL('/dashboard/influencer', request.url));
    if (role === 'ADMIN') return NextResponse.redirect(new URL('/dashboard/admin', request.url));
  }

  // Se o usuário logado tentar entrar no login/signup
  if (pathname.startsWith('/auth') && token) {
    if (role === 'COMPANY') return NextResponse.redirect(new URL('/dashboard/company', request.url));
    if (role === 'INFLUENCER') return NextResponse.redirect(new URL('/dashboard/influencer', request.url));
    if (role === 'ADMIN') return NextResponse.redirect(new URL('/dashboard/admin', request.url));
  }

  return NextResponse.next();
}

export const config = {
  // A raiz '/' NÃO está no matcher — usuários não logados sempre veem a Landing Page
  matcher: ['/dashboard/:path*', '/auth/:path*'],
};
