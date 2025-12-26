# Script para iniciar o PostgreSQL e verificar conexão
# Execute como Administrador se necessário

Write-Host "=== Diagnóstico do PostgreSQL ===" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar serviços PostgreSQL
Write-Host "1. Verificando serviços PostgreSQL..." -ForegroundColor Yellow
$postgresServices = Get-WmiObject win32_service | Where-Object {$_.Name -like "*postgres*" -or $_.DisplayName -like "*postgres*"}

if ($postgresServices) {
    Write-Host "Serviços encontrados:" -ForegroundColor Green
    $postgresServices | ForEach-Object {
        $status = if ($_.State -eq "Running") { "✅ RODANDO" } else { "❌ PARADO" }
        Write-Host "  - $($_.DisplayName) ($($_.Name)): $status" -ForegroundColor $(if ($_.State -eq "Running") { "Green" } else { "Red" })
        
        if ($_.State -ne "Running") {
            Write-Host "    Tentando iniciar o serviço..." -ForegroundColor Yellow
            try {
                Start-Service -Name $_.Name -ErrorAction Stop
                Write-Host "    ✅ Serviço iniciado com sucesso!" -ForegroundColor Green
                Start-Sleep -Seconds 2
            } catch {
                Write-Host "    ❌ Erro ao iniciar: $_" -ForegroundColor Red
                Write-Host "    💡 Tente executar este script como Administrador" -ForegroundColor Yellow
            }
        }
    }
} else {
    Write-Host "❌ Nenhum serviço PostgreSQL encontrado!" -ForegroundColor Red
    Write-Host "   Verifique se o PostgreSQL está instalado corretamente." -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# 2. Verificar se a porta 5432 está em uso
Write-Host "2. Verificando porta 5432..." -ForegroundColor Yellow
$port5432 = netstat -an | Select-String ":5432"
if ($port5432) {
    Write-Host "✅ Porta 5432 está em uso (PostgreSQL provavelmente rodando)" -ForegroundColor Green
} else {
    Write-Host "❌ Porta 5432 não está em uso" -ForegroundColor Red
    Write-Host "   O PostgreSQL pode não estar rodando corretamente." -ForegroundColor Yellow
}

Write-Host ""

# 3. Testar conexão
Write-Host "3. Testando conexão com PostgreSQL..." -ForegroundColor Yellow
$psqlPath = "C:\Program Files\PostgreSQL\18\bin\psql.exe"

if (Test-Path $psqlPath) {
    try {
        # Tenta conectar (sem senha primeiro para ver se precisa)
        $result = & $psqlPath -U postgres -h localhost -c "SELECT version();" 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Conexão com PostgreSQL bem-sucedida!" -ForegroundColor Green
            $result | Select-Object -First 2
        } else {
            Write-Host "⚠️  Erro na conexão. Isso é normal se você precisar de senha." -ForegroundColor Yellow
            Write-Host "   Você precisará criar o arquivo .env manualmente." -ForegroundColor Yellow
        }
    } catch {
        Write-Host "⚠️  Não foi possível testar a conexão: $_" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  psql.exe não encontrado em $psqlPath" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Próximos Passos ===" -ForegroundColor Cyan
Write-Host "1. Se o PostgreSQL estiver rodando, crie o arquivo backend/.env com:" -ForegroundColor White
Write-Host '   DATABASE_URL="postgresql://postgres:SUA_SENHA@localhost:5432/churchapp?schema=public"' -ForegroundColor Gray
Write-Host '   JWT_SECRET="seu-secret-jwt-aqui"' -ForegroundColor Gray
Write-Host ""
Write-Host "2. Crie o banco de dados se ainda não existir:" -ForegroundColor White
Write-Host '   & "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -c "CREATE DATABASE churchapp;"' -ForegroundColor Gray
Write-Host ""
Write-Host "3. Execute as migrations:" -ForegroundColor White
Write-Host "   cd backend" -ForegroundColor Gray
Write-Host "   npx prisma migrate deploy" -ForegroundColor Gray
Write-Host ""









