import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as any,
});

async function main() {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('❌ ERRO: A chave STRIPE_SECRET_KEY no .env não está definida.');
    process.exit(1);
  }

  console.log('🚀 Iniciando configuração automática dos planos na Stripe (Modo Teste)...');

  try {
    // 1. Criar Plano Creator Premium
    console.log('\n📦 Configurando Produto: Plano Creator Premium...');
    const productPro = await stripe.products.create({
      name: 'Plano Creator Premium',
      description: 'Plano premium mensal para influenciadores na InfluNext',
    });

    const pricePro = await stripe.prices.create({
      product: productPro.id,
      unit_amount: 4900, // R$ 49,00
      currency: 'brl',
      recurring: { interval: 'month' },
    });
    console.log(`✅ Produto criado! Price ID: ${pricePro.id}`);

    // 2. Criar Plano Agency / Co-Working
    console.log('\n📦 Configurando Produto: Plano Agency / Co-Working...');
    const productEnterprise = await stripe.products.create({
      name: 'Plano Agency / Co-Working',
      description: 'Plano mensal para marcas e agências na InfluNext',
    });

    const priceEnterprise = await stripe.prices.create({
      product: productEnterprise.id,
      unit_amount: 11900, // R$ 119,00
      currency: 'brl',
      recurring: { interval: 'month' },
    });
    console.log(`✅ Produto criado! Price ID: ${priceEnterprise.id}`);

    // 3. Atualizar o Banco de Dados (Prisma)
    console.log('\n💾 Atualizando os planos no banco de dados...');
    await prisma.plan.updateMany({
      where: { id: 'plan_pro_influencer_1' },
      data: { externalId: pricePro.id, price: 49.00 },
    });
    
    await prisma.plan.updateMany({
      where: { id: 'plan_brand_enterprise_1' },
      data: { externalId: priceEnterprise.id, price: 119.00 },
    });
    console.log('✅ Banco de dados atualizado com os novos IDs da Stripe!');

    // 4. Atualizar o arquivo .env
    console.log('\n📝 Atualizando o arquivo .env...');
    const envPath = path.resolve(__dirname, '../../../.env');
    let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
    
    const updateOrAppendEnv = (key: string, value: string) => {
      const regex = new RegExp(`^${key}=.*`, 'm');
      if (regex.test(envContent)) {
        envContent = envContent.replace(regex, `${key}=${value}`);
      } else {
        envContent += `\n${key}=${value}`;
      }
    };

    updateOrAppendEnv('STRIPE_PRICE_PRO', pricePro.id);
    updateOrAppendEnv('STRIPE_PRICE_ENTERPRISE', priceEnterprise.id);
    
    fs.writeFileSync(envPath, envContent.trim() + '\n');
    console.log('✅ Arquivo .env atualizado com sucesso!');

    console.log('\n🎉 Setup concluído! Agora você pode testar o fluxo de checkout e pagamentos normalmente.');
  } catch (error) {
    console.error('\n❌ Erro durante a configuração:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
