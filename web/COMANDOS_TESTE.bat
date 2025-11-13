@echo off
REM Script de teste rápido para o front-end (Windows)

echo 🚀 Iniciando teste do Front-End ChurchPulse
echo.

REM Verifica se está na pasta correta
if not exist "package.json" (
    echo ❌ Erro: Execute este script na pasta 'web'
    pause
    exit /b 1
)

REM Verifica se o .env existe
if not exist ".env" (
    echo 📝 Criando arquivo .env...
    echo VITE_API_URL=http://localhost:3333 > .env
    echo ✅ Arquivo .env criado!
)

REM Verifica se node_modules existe
if not exist "node_modules" (
    echo 📦 Instalando dependências...
    call npm install
    echo ✅ Dependências instaladas!
)

REM Verifica se o backend está rodando
echo 🔍 Verificando se o backend está rodando...
curl -s http://localhost:3333 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend está rodando!
) else (
    echo ⚠️  Backend não está respondendo em http://localhost:3333
    echo    Certifique-se de iniciar o backend primeiro:
    echo    cd ..\backend ^&^& npm run dev
    echo.
    set /p continuar="Deseja continuar mesmo assim? (s/n) "
    if /i not "%continuar%"=="s" exit /b 1
)

echo.
echo 🎯 Iniciando servidor de desenvolvimento...
echo    Acesse: http://localhost:3000
echo.

call npm run dev

