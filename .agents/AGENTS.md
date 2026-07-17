# Regras de Deploy do Projeto

Toda vez que o usuário solicitar "deu o deploy", "faça o deploy", "deploy" ou expressões semelhantes, o agente deve:
1. Adicionar todos os arquivos modificados ao repositório local (`git add .`).
2. Realizar o commit com uma mensagem descritiva (ex: `git commit -m "feat/fix: ..."`).
3. Enviar as alterações para o GitHub (`git push origin main` ou branch ativa) para que a integração contínua do **Vercel** e **Railway** compile e publique as alterações em produção de forma visível ao usuário.
