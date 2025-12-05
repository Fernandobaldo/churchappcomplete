# Script simples para iniciar PostgreSQL no Windows
# Execute como Administrador se necessário

Write-Host "=== Iniciando PostgreSQL ===" -ForegroundColor Cyan
Write-Host ""

# Procura por serviços PostgreSQL
$services = @(
    "postgresql-x64-18",
    "postgresql-x64-16", 
    "postgresql-x64-15",
    "postgresql-x64-14",
    "postgresql-x64-13"
)

$found = $false

foreach ($serviceName in $services) {
    try {
        $service = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
        if ($service) {
            $found = $true
            Write-Host "✅ Serviço encontrado: $($service.DisplayName)" -ForegroundColor Green
            Write-Host "   Status atual: $($service.Status)" -ForegroundColor Yellow
            
            if ($service.Status -eq "Stopped") {
                Write-Host "   Iniciando serviço..." -ForegroundColor Yellow
                try {
                    Start-Service -Name $serviceName -ErrorAction Stop
                    Start-Sleep -Seconds 3
                    $service.Refresh()
                    if ($service.Status -eq "Running") {
                        Write-Host "   ✅ Serviço iniciado com sucesso!" -ForegroundColor Green
                    } else {
                        Write-Host "   ❌ Falha ao iniciar o serviço" -ForegroundColor Red
                    }
                } catch {
                    Write-Host "   ❌ Erro: $_" -ForegroundColor Red
                    Write-Host "   💡 Tente executar como Administrador" -ForegroundColor Yellow
                }
            } elseif ($service.Status -eq "Running") {
                Write-Host "   ✅ Serviço já está rodando!" -ForegroundColor Green
            }
            break
        }
    } catch {
        # Serviço não encontrado, continua procurando
    }
}

if (-not $found) {
    Write-Host "❌ Nenhum serviço PostgreSQL encontrado!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Possíveis soluções:" -ForegroundColor Yellow
    Write-Host "1. Verifique se o PostgreSQL está instalado" -ForegroundColor White
    Write-Host "2. Abra o 'Services' (services.msc) e procure manualmente" -ForegroundColor White
    Write-Host "3. Reinstale o PostgreSQL e marque 'Install as Windows Service'" -ForegroundColor White
    Write-Host ""
    Write-Host "Alternativa: Inicie o PostgreSQL manualmente:" -ForegroundColor Yellow
    Write-Host '   & "C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe" -D "C:\Program Files\PostgreSQL\18\data" start' -ForegroundColor Gray
}

Write-Host ""
Write-Host "Verificando porta 5432..." -ForegroundColor Cyan
$portCheck = netstat -an | Select-String ":5432"
if ($portCheck) {
    Write-Host "✅ Porta 5432 está ativa!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Porta 5432 não está em uso" -ForegroundColor Yellow
}

Write-Host ""





