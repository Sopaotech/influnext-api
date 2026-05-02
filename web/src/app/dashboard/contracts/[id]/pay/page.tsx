import CheckoutClient from './CheckoutClient';

export default function PayContractPage({ params }: { params: { id: string } }) {
  return (
    <div className="min-h-screen bg-[#080810] py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white">Cofre Financeiro</h1>
          <p className="text-zinc-400">Contrato #{params.id.slice(0, 8).toUpperCase()}</p>
        </div>
        
        <CheckoutClient contractId={params.id} />
      </div>
    </div>
  );
}
