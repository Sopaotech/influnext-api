'use client';

import { useEffect } from 'react';
import { api } from '@/lib/api';

export function AppearanceManager() {
  useEffect(() => {
    const applyPreferences = async () => {
      try {
        const res = await api.get('/dashboard/influencer');
        const { accentColor } = res.data.profile;
        
        if (accentColor) {
          // Converte HEX para HSL format (Tailwind usa HSL space em variáveis)
          // Mas aqui usaremos RGB/HEX direto para facilitar a injeção via CSS variable
          // No globals.css --primary está em formato '168 85 247' (r g b sem vírgulas para tailwind v4)
          
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
        console.error('[APPEARANCE_MANAGER] Falha ao sincronizar estilo:', err);
      }
    };

    applyPreferences();
  }, []);

  return null;
}
