import dotenv from 'dotenv';
// Carrega .env primeiro
dotenv.config();
// Se JWT_SECRET ou DATABASE_URL não estiverem definidas, tenta carregar .env.test
if (!process.env.JWT_SECRET || !process.env.DATABASE_URL) {
    dotenv.config({ path: '.env.test' });
}
export const env = {
    JWT_SECRET: process.env.JWT_SECRET || 'churchapp-secret-key',
    DATABASE_URL: process.env.DATABASE_URL || '',
};
