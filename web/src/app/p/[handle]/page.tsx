import { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import { PublicProfileView } from './PublicProfileView';
import type { PublicProfileResponse } from '@/lib/api';
import { resolveApiBaseUrl } from '@/lib/api-base-url';

export const viewport: Viewport = {
  themeColor: '#131110',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

async function getProfileData(handle: string): Promise<PublicProfileResponse | null> {
  const apiUrl = resolveApiBaseUrl(
    process.env.NEXT_PUBLIC_API_URL,
    undefined,
    process.env.NEXT_PUBLIC_ISOLATED_TEST === 'true',
  );
  try {
    const res = await fetch(`${apiUrl}/p/${handle}`, {
      cache: 'no-store'
    });
    if (!res.ok) return null;
    return res.json() as Promise<PublicProfileResponse>;
  } catch (err) {
    return null;
  }
}

export async function generateMetadata(props: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const params = await props.params;
  const profile = await getProfileData(params.handle);
  if (!profile) return { title: 'Perfil Não Encontrado' };

  const scoreLabel = profile.scoreClass || 'BRONZE';
  
  return {
    title: `${profile.handle} | InfluNext [${scoreLabel}]`,
    description: `Métricas auditadas e ROI comprovado de @${profile.handle}. InfluScore: ${profile.influScore}.`,
    openGraph: {
      title: `${profile.handle} | InfluNext Media Kit`,
      description: `ROI Médio: +${((profile.avgROI - 1) * 100).toFixed(0)}% acima do mercado.`,
      images: [profile.profileImageUrl || '/og-default.png'],
    },
  };
}

export default async function PublicProfile(props: { params: Promise<{ handle: string }>, searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const profile = await getProfileData(params.handle);

  if (!profile) notFound();

  const checkoutStatus = typeof searchParams?.checkout === 'string' ? searchParams.checkout : undefined;

  return <PublicProfileView profile={profile} checkoutStatus={checkoutStatus} />;
}
