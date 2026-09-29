'use client';

import React from 'react';
import { Trophy } from 'lucide-react';

interface InfluScoreCardProps {
  score: number;
}

export function InfluScoreCard({ score }: InfluScoreCardProps) {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3 text-slate-700">
        <Trophy aria-hidden="true" className="h-5 w-5 text-amber-600" />
        <h2 className="text-sm font-bold">InfluScore registrado</h2>
      </div>
      <p className="mt-3 text-3xl font-black text-slate-950">{score}</p>
    </section>
  );
}
