/**
 * Helper para melhorar o logging de erros em testes
 * Detecta quando a resposta é HTML em vez de JSON e formata melhor os erros
 */

export function formatTestError(error: any, response?: any) {
  let errorMessage = ''
  
  if (response) {
    const status = response.status || response.statusCode
    const body = response.body || response.text || ''
    const headers = response.headers || {}
    const contentType = headers['content-type'] || headers['Content-Type'] || ''
    
    errorMessage += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`
    errorMessage += `❌ ERRO NO TESTE\n`
    errorMessage += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`
    errorMessage += `Status: ${status}\n`
    errorMessage += `Content-Type: ${contentType}\n`
    
    // Detecta se é HTML
    if (typeof body === 'string' && (body.includes('<!DOCTYPE') || body.includes('<html') || body.includes('<body'))) {
      errorMessage += `\n⚠️  ATENÇÃO: Resposta é HTML, não JSON!\n`
      errorMessage += `Isso geralmente indica:\n`
      errorMessage += `  - Rota não encontrada (404)\n`
      errorMessage += `  - Erro no servidor retornando página de erro\n`
      errorMessage += `  - Problema de roteamento\n\n`
      
      // Tenta extrair informações úteis do HTML
      const titleMatch = body.match(/<title>(.*?)<\/title>/i)
      const h1Match = body.match(/<h1[^>]*>(.*?)<\/h1>/i)
      const errorMatch = body.match(/<pre[^>]*>(.*?)<\/pre>/is)
      
      if (titleMatch) {
        errorMessage += `Título da página: ${titleMatch[1]}\n`
      }
      if (h1Match) {
        errorMessage += `Cabeçalho: ${h1Match[1]}\n`
      }
      if (errorMatch) {
        errorMessage += `Erro: ${errorMatch[1].substring(0, 500)}\n`
      }
      
      // Mostra apenas os primeiros 1000 caracteres do HTML
      const htmlPreview = body.substring(0, 1000)
      errorMessage += `\nPreview do HTML (primeiros 1000 chars):\n`
      errorMessage += `${htmlPreview}${body.length > 1000 ? '...' : ''}\n`
    } else {
      // É JSON ou outro formato
      try {
        const jsonBody = typeof body === 'string' ? JSON.parse(body) : body
        errorMessage += `\nResposta JSON:\n`
        errorMessage += `${JSON.stringify(jsonBody, null, 2)}\n`
      } catch {
        errorMessage += `\nResposta (texto):\n`
        errorMessage += `${typeof body === 'string' ? body.substring(0, 500) : String(body)}\n`
      }
    }
    
    errorMessage += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`
  }
  
  if (error) {
    errorMessage += `\nErro original:\n`
    errorMessage += `${error.message || error}\n`
    if (error.stack) {
      errorMessage += `\nStack trace:\n`
      errorMessage += `${error.stack}\n`
    }
  }
  
  return errorMessage
}

/**
 * Wrapper para requests de teste que melhora o logging de erros
 */
export async function testRequest(
  requestFn: () => Promise<any>,
  options?: { logOnError?: boolean }
) {
  try {
    const response = await requestFn()
    
    // Se a resposta é HTML, já loga o erro
    const contentType = response.headers?.['content-type'] || response.headers?.['Content-Type'] || ''
    const body = response.body || response.text || ''
    
    if (typeof body === 'string' && (body.includes('<!DOCTYPE') || body.includes('<html'))) {
      console.error(formatTestError(null, response))
    }
    
    return response
  } catch (error: any) {
    if (options?.logOnError !== false) {
      console.error(formatTestError(error))
    }
    throw error
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







