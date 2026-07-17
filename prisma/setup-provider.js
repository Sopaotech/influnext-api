const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Carrega as variáveis de ambiente do arquivo .env (especialmente útil localmente)
dotenv.config();

const schemaPath = path.join(__dirname, 'schema.prisma');
const dbUrl = process.env.DATABASE_URL || '';

if (!fs.existsSync(schemaPath)) {
  console.error('❌ Arquivo schema.prisma não foi encontrado em:', schemaPath);
  process.exit(1);
}

let schemaContent = fs.readFileSync(schemaPath, 'utf8');

// Detecta se a conexão é SQLite (geralmente local) ou PostgreSQL (geralmente produção)
// Se DATABASE_URL estiver vazia (ex: durante o build no Docker/Railway), assume PostgreSQL por padrão
const isSqlite = dbUrl.startsWith('file:') || dbUrl.includes('.db');
const hasDirectUrl = !!process.env.DIRECT_URL;

let newDatasource = '';
if (isSqlite) {
  console.log('🔌 Configurando o datasource do Prisma para SQLite...');
  newDatasource = `datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}`;
} else {
  console.log('🔌 Configurando o datasource do Prisma para PostgreSQL...');
  if (hasDirectUrl) {
    newDatasource = `datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}`;
  } else {
    newDatasource = `datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}`;
  }
}

// Expressão regular para encontrar o bloco datasource db { ... }
const datasourceRegex = /datasource\s+db\s*{[^}]*}/;

if (datasourceRegex.test(schemaContent)) {
  schemaContent = schemaContent.replace(datasourceRegex, newDatasource);
  fs.writeFileSync(schemaPath, schemaContent, 'utf8');
  console.log('✅ schema.prisma atualizado com sucesso.');
} else {
  console.error('❌ Não foi possível encontrar o bloco datasource db em schema.prisma');
  process.exit(1);
}
