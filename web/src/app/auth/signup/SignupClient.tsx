'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function SignupClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const typeParam = searchParams.get('type') || 'influencer';
  
  const [userType, setUserType] = useState(typeParam);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ name: '', city: '', niche: '', goal: '', companyName: '' });

  const isInfluencer = userType === 'influencer';

  const handleNext = () => {
    if (step === 1) setStep(2);
    else {
      // MOCK Submit: Simulate cookie setting for "Plim" notification
      document.cookie = `plim_welcome=true; path=/; max-age=60`;
      document.cookie = `user_name=${formData.name || formData.companyName}; path=/; max-age=60`;
      
      const destination = isInfluencer ? '/dashboard/workspace' : '/dashboard/marketplace';
      router.push(destination);
    }
  };

  return (
    <div className="min-h-screen bg-[#080810] text-white flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-[#11111a] border border-white/10 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        
        {/* Header Inteligente */}
        <div className="mb-8">
          <div className="flex gap-2 mb-6 p-1 bg-white/5 rounded-lg w-max mx-auto">
             <button onClick={() => {setUserType('influencer'); setStep(1);}} className={`px-4 py-1 text-sm font-bold rounded-md transition-colors ${isInfluencer ? 'bg-purple-600 text-white' : 'text-zinc-500'}`}>Influencer</button>
             <button onClick={() => {setUserType('company'); setStep(1);}} className={`px-4 py-1 text-sm font-bold rounded-md transition-colors ${!isInfluencer ? 'bg-blue-600 text-white' : 'text-zinc-500'}`}>Marca</button>
          </div>

          <h2 className="text-2xl font-black mb-2 text-center">
            {isInfluencer ? 'Bem-vindo ao Workspace✦' : 'Marketplace Seguro'}
          </h2>
          
          <div className="bg-purple-900/30 border border-purple-500/20 p-4 rounded-xl mt-4">
             <p className="text-sm text-purple-200">
               <strong className="text-purple-400 mr-2">IA:</strong> 
               {isInfluencer 
                  ? "Olá! Sou o seu novo gestor de carreira. Antes de começarmos seu império, preciso de alguns dados estratégicos."
                  : "Bem-vindo ao ambiente de contratação segura. Dinheiro blindado via Escrow e talentos locais auditados."}
             </p>
          </div>
        </div>

        {/* Formulário Passo 1: Dados Básicos */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="text-xs text-zinc-500 font-bold uppercase">Como devemos te chamar?</label>
              <input type="text" className="w-full bg-[#080810] border border-white/10 rounded-lg px-4 py-3 text-white mt-1" placeholder={isInfluencer ? "Seu nome ou arroba" : "Nome do responsável"} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            {!isInfluencer && (
              <div>
                <label className="text-xs text-zinc-500 font-bold uppercase">Nome da Empresa</label>
                <input type="text" className="w-full bg-[#080810] border border-white/10 rounded-lg px-4 py-3 text-white mt-1" placeholder="Sua marca" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} />
              </div>
            )}
            <div>
              <label className="text-xs text-zinc-500 font-bold uppercase">Hiper-Localismo (Cidade/UF)</label>
              <input type="text" className="w-full bg-[#080810] border border-white/10 rounded-lg px-4 py-3 text-white mt-1" placeholder="Ex: São Paulo, SP" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
            </div>
            <button onClick={handleNext} className="w-full bg-white text-black font-bold py-3 rounded-lg mt-4 hover:bg-zinc-200">Continuar</button>
          </div>
        )}

        {/* Formulário Passo 2: Inteligência */}
        {step === 2 && (
          <div className="space-y-4">
            {isInfluencer ? (
              <>
                <div>
                  <label className="text-xs text-zinc-500 font-bold uppercase">Qual o seu nicho principal?</label>
                  <select className="w-full bg-[#080810] border border-white/10 rounded-lg px-4 py-3 text-white mt-1" value={formData.niche} onChange={e => setFormData({...formData, niche: e.target.value})}>
                    <option value="">Selecione...</option>
                    <option value="fitness">Fitness</option>
                    <option value="tech">Tech</option>
                    <option value="lifestyle">Lifestyle</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-zinc-500 font-bold uppercase">Seu maior objetivo este ano?</label>
                  <input type="text" className="w-full bg-[#080810] border border-white/10 rounded-lg px-4 py-3 text-white mt-1" placeholder="Ex: Fechar contratos fixos" value={formData.goal} onChange={e => setFormData({...formData, goal: e.target.value})} />
                </div>
              </>
            ) : (
               <div>
                  <label className="text-xs text-zinc-500 font-bold uppercase">Qual perfil você busca hoje?</label>
                  <select className="w-full bg-[#080810] border border-white/10 rounded-lg px-4 py-3 text-white mt-1">
                    <option value="">Selecione...</option>
                    <option value="nano">Nano (Até 10k) - Ideal para comércio local</option>
                    <option value="micro">Micro (10k-50k) - Autoridade regional</option>
                  </select>
                </div>
            )}
            
            <button onClick={handleNext} className={`w-full font-bold py-3 rounded-lg mt-4 ${isInfluencer ? 'bg-purple-600 hover:bg-purple-500' : 'bg-blue-600 hover:bg-blue-500'} text-white`}>
              {isInfluencer ? 'Iniciar Império' : 'Acessar Marketplace'}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
