/**
 * Script para aplicar logTestResponse em todos os testes
 * 
 * Este arquivo serve como referência para aplicar o helper manualmente.
 * 
 * Padrão a seguir:
 * 
 * 1. Adicionar import no topo do arquivo:
 *    import { logTestResponse } from '../utils/testResponseHelper'
 * 
 * 2. Antes de cada expect(response.status).toBe(X), adicionar:
 *    logTestResponse(response, X)
 * 
 * Exemplo:
 * 
 * // Antes:
 * const response = await request(app.server).get('/route')
 * expect(response.status).toBe(200)
 * 
 * // Depois:
 * const response = await request(app.server).get('/route')
 * logTestResponse(response, 200)
 * expect(response.status).toBe(200)
 */

export {}













