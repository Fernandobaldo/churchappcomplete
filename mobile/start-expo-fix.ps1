# Script para corrigir problema de conexao Expo
# Este script força o Metro Bundler a usar o IP da rede local em vez de localhost

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Expo Connection Fix Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Encerrar processos Node.js existentes
Write-Host "Encerrando processos Node.js existentes..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    $nodeProcesses | Stop-Process -Force
    Write-Host "   Processos encerrados" -ForegroundColor Green
    Start-Sleep -Seconds 2
} else {
    Write-Host "   Nenhum processo Node.js encontrado" -ForegroundColor Gray
}

# 2. Verificar e encerrar processos na porta 8081
Write-Host "Verificando porta 8081..." -ForegroundColor Yellow
$port8081 = netstat -ano | findstr ":8081" | findstr "LISTENING"
if ($port8081) {
    Write-Host "   Porta 8081 ainda em uso" -ForegroundColor Yellow
    $pids = $port8081 | ForEach-Object { ($_ -split '\s+')[-1] } | Select-Object -Unique
    foreach ($pid in $pids) {
        if ($pid -and $pid -ne "0") {
            try {
                Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
                Write-Host "   Processo $pid encerrado" -ForegroundColor Green
            } catch {
                Write-Host "   Nao foi possivel encerrar processo $pid" -ForegroundColor Yellow
            }
        }
    }
    Start-Sleep -Seconds 2
} else {
    Write-Host "   Porta 8081 esta livre" -ForegroundColor Green
}

# 3. Descobrir IP da rede local
Write-Host "Detectando IP da rede local..." -ForegroundColor Yellow
$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
    ($_.InterfaceAlias -like "*Wi-Fi*" -or 
     $_.InterfaceAlias -like "*Ethernet*" -or 
     $_.InterfaceAlias -like "*Wireless*") -and
    $_.IPAddress -notlike "127.*" -and
    $_.IPAddress -notlike "169.254.*"
} | Select-Object -First 1).IPAddress

if (-not $ip) {
    $ip = "192.168.1.23"
    Write-Host "   IP nao detectado automaticamente" -ForegroundColor Yellow
    Write-Host "   Usando IP padrao: $ip" -ForegroundColor Gray
    Write-Host "   Se este IP estiver incorreto, edite este script" -ForegroundColor Gray
} else {
    Write-Host "   IP detectado: $ip" -ForegroundColor Green
}

# 4. Limpar cache do Expo
Write-Host "Limpando cache do Expo..." -ForegroundColor Yellow
if (Test-Path ".expo") {
    Remove-Item -Recurse -Force .expo -ErrorAction SilentlyContinue
    Write-Host "   Cache limpo" -ForegroundColor Green
} else {
    Write-Host "   Nenhum cache encontrado" -ForegroundColor Gray
}

# 5. Configurar variaveis de ambiente CRITICAS
Write-Host "Configurando variaveis de ambiente..." -ForegroundColor Cyan
$env:EXPO_DEVTOOLS_LISTEN_ADDRESS = "0.0.0.0"
$env:REACT_NATIVE_PACKAGER_HOSTNAME = $ip
$env:EXPO_PACKAGER_PROXY_URL = "http://${ip}:8081"

# Variaveis adicionais para garantir
$env:REACT_NATIVE_PACKAGER_HOSTNAME = $ip
$env:EXPO_NO_METRO_LAZY = "1"

Write-Host "   Variaveis configuradas:" -ForegroundColor Green
Write-Host "      EXPO_DEVTOOLS_LISTEN_ADDRESS = $env:EXPO_DEVTOOLS_LISTEN_ADDRESS" -ForegroundColor Gray
Write-Host "      REACT_NATIVE_PACKAGER_HOSTNAME = $env:REACT_NATIVE_PACKAGER_HOSTNAME" -ForegroundColor Gray
Write-Host "      EXPO_PACKAGER_PROXY_URL = $env:EXPO_PACKAGER_PROXY_URL" -ForegroundColor Gray

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Iniciando Expo..." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "O QR code deve mostrar: exp://$ip:8081" -ForegroundColor Yellow
Write-Host "Se ainda aparecer 127.0.0.1, pressione 's' no Expo e escolha 'LAN'" -ForegroundColor Yellow
Write-Host ""
Write-Host "Dicas:" -ForegroundColor Cyan
Write-Host "   - Certifique-se de que o celular esta na mesma rede Wi-Fi" -ForegroundColor Gray
Write-Host "   - Verifique se o firewall permite conexoes na porta 8081" -ForegroundColor Gray
Write-Host "   - Se nao funcionar, tente: npx expo start --tunnel" -ForegroundColor Gray
Write-Host ""

# 6. Iniciar Expo
npx expo start --lan --clear
