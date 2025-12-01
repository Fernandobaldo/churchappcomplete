/**
 * Helper para melhorar o logging de respostas em testes
 * Detecta quando a resposta é HTML em vez de JSON e formata melhor os erros
 */

export function logTestResponse(response: any, expectedStatus?: number) {
  const status = response.status || response.statusCode
  const body = response.body || response.text || ''
  const headers = response.headers || response.headers || {}
  const contentType = headers['content-type'] || headers['Content-Type'] || ''
  
  // Se o status não é o esperado ou é HTML, loga detalhes
  const shouldLog = (expectedStatus && status !== expectedStatus) || isHtmlResponse(response)
  
  if (shouldLog) {
    console.error(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    console.error(`❌ ERRO NO TESTE`)
    console.error(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    console.error(`Status esperado: ${expectedStatus || 'N/A'}`)
    console.error(`Status recebido: ${status}`)
    console.error(`Content-Type: ${contentType}`)
    
    // Detecta se é HTML
    if (isHtmlResponse(response)) {
      console.error(`\n⚠️  ATENÇÃO: Resposta é HTML, não JSON!`)
      console.error(`Isso geralmente indica:`)
      console.error(`  - Rota não encontrada (404)`)
      console.error(`  - Erro no servidor retornando página de erro`)
      console.error(`  - Problema de roteamento`)
      console.error(`  - Rota não registrada corretamente\n`)
      
      // Tenta extrair informações úteis do HTML
      const titleMatch = body.match(/<title>(.*?)<\/title>/i)
      const h1Match = body.match(/<h1[^>]*>(.*?)<\/h1>/i)
      const errorMatch = body.match(/<pre[^>]*>(.*?)<\/pre>/is)
      
      if (titleMatch) {
        console.error(`Título da página: ${titleMatch[1]}`)
      }
      if (h1Match) {
        console.error(`Cabeçalho: ${h1Match[1]}`)
      }
      if (errorMatch) {
        console.error(`Erro: ${errorMatch[1].substring(0, 500)}`)
      }
      
      // Mostra apenas os primeiros 1000 caracteres do HTML
      const htmlPreview = body.substring(0, 1000)
      console.error(`\nPreview do HTML (primeiros 1000 chars):`)
      console.error(`${htmlPreview}${body.length > 1000 ? '...' : ''}`)
    } else {
      // É JSON ou outro formato
      try {
        const jsonBody = typeof body === 'string' ? JSON.parse(body) : body
        console.error(`\nResposta JSON:`)
        console.error(JSON.stringify(jsonBody, null, 2))
      } catch {
        console.error(`\nResposta (texto):`)
        console.error(`${typeof body === 'string' ? body.substring(0, 500) : String(body)}`)
      }
    }
    
    console.error(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)
  }
}

/**
 * Helper para verificar se uma resposta é HTML
 */
export function isHtmlResponse(response: any): boolean {
  const body = response.body || response.text || ''
  const contentType = response.headers?.['content-type'] || response.headers?.['Content-Type'] || ''
  
  return (
    typeof body === 'string' &&
    (body.includes('<!DOCTYPE') || 
     body.includes('<html') || 
     body.includes('<body') ||
     contentType.includes('text/html'))
  )
}

/**
 * Wrapper para expect que loga erros automaticamente
 */
export function expectStatus(response: any, expectedStatus: number) {
  logTestResponse(response, expectedStatus)
  expect(response.status || response.statusCode).toBe(expectedStatus)
}

