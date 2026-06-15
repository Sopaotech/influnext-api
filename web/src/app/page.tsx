import type { Metadata } from "next";
import LandingPageClient from "./LandingPageClient";

export const metadata: Metadata = {
  title: "InfluNext | Plataforma de Marketing de Influência de Elite",
  description: "O único ecossistema que une Workspace com IA para gestores e Marketplace com Escrow seguro para marcas contratarem influenciadores locais.",
  keywords: ["Marketing de Influência", "Influenciadores Locais", "Gestão de Carreira Influencer", "Escrow para Marcas", "Monetização de Conteúdo"],
};

export default function Home() {
  return <LandingPageClient />;
}
