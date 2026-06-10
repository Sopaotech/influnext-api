import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('❌ Erro: GEMINI_API_KEY não configurada no .env');
    process.exit(1);
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  console.log(`📡 Consultando modelos disponíveis na API do Gemini...`);
  console.log(`URL: https://generativelanguage.googleapis.com/v1beta/models?key=***`);

  try {
    const response = await axios.get(url);
    console.log('\n✅ Conexão bem sucedida!');
    console.log('🤖 Modelos disponíveis na sua chave:');
    const models = response.data.models || [];
    if (models.length === 0) {
      console.log('Nenhum modelo encontrado.');
    } else {
      models.forEach((m: any) => {
        console.log(`- ${m.name} (Suporta: ${m.supportedGenerationMethods.join(', ')})`);
      });
    }
  } catch (error: any) {
    console.error('\n❌ Erro na consulta de modelos:');
    if (error.response) {
      console.error(`Status: ${error.response.status} ${error.response.statusText}`);
      console.error('Detalhes do Erro:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
  }
}

main();
