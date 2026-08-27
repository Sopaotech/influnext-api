import type { Metadata } from "next";
import LandingPageClient from "./LandingPageClient";

export const metadata: Metadata = {
  title: "InfluNext | Para influenciadores que geram vendas. Para marcas que buscam retorno.",
  description: "Ecossistema completo com métricas auditadas por IA (SHA-256), contratação direta via Mídia Kit e pagamentos 100% protegidos via Metodologia SafePay (Pix Mercado Pago).",
  keywords: ["InfluNext", "SafePay", "Marketing de Influência", "Influenciadores Locais", "Mercado Pago Pix", "Mídia Kit Auditado", "Inteligência Artificial"],
};

export default function Home() {
  return <LandingPageClient />;
}
