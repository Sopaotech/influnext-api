# Plano de Melhorias Web, Design e Autenticação

Plano detalhado para implementar as melhorias visuais (Tema Clean/Claro - Branco e Laranja) no Dashboard do site, otimização de responsividade móvel, criação do brainstorm de design e correção do login através do emulador.

## Revisão Requeriva

> [!IMPORTANT]
> - O Dashboard do influenciador no site Next.js atualmente força o modo escuro (`const isDark = true`). Vamos torná-lo dinâmico para respeitar a preferência de tema do usuário (`light`/`dark`).
> - No tema claro (`light`), utilizaremos a paleta sugerida de **Branco e Laranja** (tons de laranja/amber para destaques e botões secundários, fundo limpo branco/cinza claro), mantendo o design alinhado com a marca.
> - O login no emulador falha porque o host `10.0.2.2` é tratado como produção no Next.js (apontando as chamadas para `https://api.influnext.com.br`). Vamos corrigir o arquivo `api.ts` para reconhecer o emulador e apontar para a API local.

## Alterações Propostas

---

### Otimização de Login e Conexão Local

#### [MODIFY] [api.ts](file:///d:/Influnext/web/src/lib/api.ts)
- Atualizar a detecção de ambiente para considerar o IP `10.0.2.2` (usado pelo emulador Android) como ambiente local.
- Configurar o `baseURL` da API para `http://10.0.2.2:4000/v1` quando acessado através do emulador móvel, permitindo logar com a credencial `alexsandrojunior144@gmail.com` / `Juninho1440@` localmente.

---

### UI & Tema Responsivo (Branco e Laranja)

#### [MODIFY] [page.tsx](file:///d:/Influnext/web/src/app/dashboard/influencer/page.tsx)
- Tornar a variável `isDark` dinâmica baseada no tema salvo no perfil do usuário (`data?.userState?.theme === 'dark'`).
- Ajustar os botões e destaques verdes/roxos para tons de **Laranja** (`orange-500` / `orange-600`) quando o tema for claro.

#### [MODIFY] [CareerDashboard.tsx](file:///d:/Influnext/web/src/components/dashboard/CareerDashboard.tsx)
- Tornar o painel estratégico responsivo e compatível com o tema dinâmico claro (`influencer.theme === 'dark'`).
- Ajustar cards, bordas e textos para realces em Laranja quando em modo claro, garantindo ótima legibilidade no celular.

---

### Estratégia de Marca & SEO

#### [NEW] [branding_brainstorm.md](file:///d:/Influnext/branding_brainstorm.md)
- Criar o brainstorm da marca baseado na logo enviada, integrando as paletas Branco/Laranja e Preto/Roxo em harmonia, com propostas de design para a identidade visual do site e redes sociais.

## Plano de Verificação

### Testes Automatizados
- Executar `npx tsc --noEmit` para garantir que o Next.js compila sem erros.

### Verificação Manual
1. Entrar no site Next.js local em modo claro (`theme = 'light'`) e confirmar se o Dashboard carrega com a paleta branca e laranja.
2. Confirmar se a navegação e o layout do painel se adaptam perfeitamente ao formato de tela mobile (celular).
3. Testar a autenticação local com `alexsandrojunior144@gmail.com` a partir do WebView do emulador mobile.
