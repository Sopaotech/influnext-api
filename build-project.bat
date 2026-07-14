@echo off
echo ===================================================
echo [InfluNext] Iniciando Compilacao e Build do Projeto
echo ===================================================
echo.

echo [1/3] Parando processos do Node.js bloqueantes...
taskkill /f /im node.exe >nul 2>&1
echo Processos antigos finalizados.
echo.

echo [2/3] Gerando Prisma Client e compilando Backend (API)...
call npx prisma generate
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo [ERRO] Falha ao compilar o Backend! Por favor, verifique os erros acima.
    pause
    exit /b %errorlevel%
)
echo.

echo [3/3] Compilando Frontend (Web)...
cd web
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo [ERRO] Falha ao compilar o Frontend! Por favor, verifique os erros acima.
    pause
    exit /b %errorlevel%
)
echo.

echo ===================================================
echo [InfluNext] Sucesso! Tudo compilado e pronto para deploy.
echo ===================================================
pause
