import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  console.log('🔄 Iniciando teste de integração com o Google Gemini...');
  
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('❌ Erro: A variável GEMINI_API_KEY não foi encontrada no seu arquivo .env');
    process.exit(1);
  }

  console.log(`🔑 Chave detectada (Tamanho: ${apiKey.length} caracteres).`);
  console.log('📡 Enviando prompt de teste para o modelo gemini-pro...');

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const result = await model.generateContent("Diga 'Conexão com Gemini estabelecida!' em tom profissional e dê uma dica rápida de growth de 1 linha.");
    const response = await result.response;
    const text = response.text();

    console.log(`\n🤖 Retorno da IA:\n`);
    console.log(text);
    console.log(`\n✅ Integração com a API do Gemini validada com sucesso!`);
  } catch (error: any) {
    console.error('❌ Erro ao conectar com a API do Gemini:', error.message);
    console.error('Verifique se a sua GEMINI_API_KEY está correta e se possui créditos/permissões ativas.');
    process.exit(1);
  }
}

main();
