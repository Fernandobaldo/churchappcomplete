// IMPORTANTE: Carregar .env.test ANTES de qualquer importação
import dotenv from 'dotenv'
dotenv.config({ path: '.env.test' })

/**
 * Reset test database by deleting all records
 * 
 * @deprecated Use resetTestDatabase from './db' instead
 * Kept for backward compatibility - will be removed in future versions
 * 
 * Re-exports from db.ts to maintain backward compatibility
 */
export { resetTestDatabase } from './db'
