'use client';

import { useEffect } from 'react';
import { api } from '@/lib/api';
import Cookies from 'js-cookie';

export function AppearanceManager() {
  useEffect(() => {
    const token = Cookies.get('influnext_token');
    if (!token) return; // Se não estiver logado, não tenta carregar estilo customizado

    const applyPreferences = async () => {
      try {
        const res = await api.get('/dashboard/influencer');
        // ... rest of the code logic remains similar but safe
        if (res.data?.profile?.accentColor) {
          const accentColor = res.data.profile.accentColor;
          
          const hexToRgb = (hex: string) => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
              r: parseInt(result[1], 16),
              g: parseInt(result[2], 16),
              b: parseInt(result[3], 16)
            } : null;
          };

          const rgb = hexToRgb(accentColor);
          if (rgb) {
            document.documentElement.style.setProperty('--primary', `${rgb.r} ${rgb.g} ${rgb.b}`);
          }
        }
      } catch (err) {
        // Silently fail to avoid loops, only log in development
        if (process.env.NODE_ENV !== 'production') {
          console.error('[APPEARANCE_MANAGER] Falha ao sincronizar estilo:', err);
        }
      }
    };

    applyPreferences();
  }, []);

  return null;
}
