import dotenv from 'dotenv';
// Carrega .env primeiro
dotenv.config();
// Se JWT_SECRET ou DATABASE_URL não estiverem definidas, tenta carregar .env.test
if (!process.env.JWT_SECRET || !process.env.DATABASE_URL) {
    dotenv.config({ path: '.env.test' });
}
// Determina ambiente
const NODE_ENV = process.env.NODE_ENV || 'development';
const isTest = NODE_ENV === 'test' || process.env.VITEST === 'true';
const isProduction = NODE_ENV === 'production';
export const env = {
    // Ambiente
    NODE_ENV,
    isTest,
    isProduction,
    // JWT
    JWT_SECRET: process.env.JWT_SECRET || 'churchapp-secret-key',
    // Database
    DATABASE_URL: process.env.DATABASE_URL || '',
    // Payment Gateway
    PAYMENT_GATEWAY: (process.env.PAYMENT_GATEWAY || 'mercadopago'),
    // MercadoPago
    MERCADOPAGO_ACCESS_TOKEN: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
    MERCADOPAGO_PUBLIC_KEY: process.env.MERCADOPAGO_PUBLIC_KEY || '',
    MERCADOPAGO_WEBHOOK_SECRET: process.env.MERCADOPAGO_WEBHOOK_SECRET || '',
    MERCADOPAGO_ENVIRONMENT: (process.env.MERCADOPAGO_ENVIRONMENT || 'sandbox'),
    MERCADOPAGO_BACK_URL: process.env.MERCADOPAGO_BACK_URL || 'http://localhost:5173/subscription/success',
    MERCADOPAGO_WEBHOOK_URL: process.env.MERCADOPAGO_WEBHOOK_URL || '',
    // CORS
    CORS_ORIGINS: process.env.CORS_ORIGINS || '',
    /**
     * Valida configuração do gateway de pagamento
     */
    validatePaymentGateway() {
        if (this.PAYMENT_GATEWAY === 'mercadopago') {
            if (!this.MERCADOPAGO_ACCESS_TOKEN) {
                if (!this.isTest) {
                    console.warn('⚠️ MERCADOPAGO_ACCESS_TOKEN não configurado');
                }
                return false;
            }
            if (this.isProduction && this.MERCADOPAGO_ENVIRONMENT === 'sandbox') {
                console.warn('⚠️ ATENÇÃO: Ambiente de produção usando credenciais de sandbox!');
                return false;
            }
            if (!this.isProduction && this.MERCADOPAGO_ENVIRONMENT === 'production') {
                console.warn('⚠️ ATENÇÃO: Ambiente de desenvolvimento usando credenciais de produção!');
                return false;
            }
        }
        return true;
    },
    /**
     * Valida todas as configurações essenciais
     */
    validate() {
        const errors = [];
        if (!this.JWT_SECRET || this.JWT_SECRET === 'churchapp-secret-key') {
            if (!this.isTest) {
                errors.push('JWT_SECRET não configurado ou usando valor padrão');
            }
        }
        if (!this.DATABASE_URL) {
            errors.push('DATABASE_URL não configurado');
        }
        if (this.isProduction && !this.CORS_ORIGINS) {
            errors.push('CORS_ORIGINS não configurado em produção - configure as origens permitidas separadas por vírgula');
        }
        if (!this.validatePaymentGateway()) {
            // Aviso já foi exibido no validatePaymentGateway
        }
        if (errors.length > 0 && !this.isTest) {
            console.error('❌ Erros de configuração:');
            errors.forEach(error => console.error(`  - ${error}`));
        }
        return errors.length === 0;
    }
};
// Validar ao carregar (apenas em desenvolvimento/produção, não em testes)
if (!isTest) {
    env.validate();
}
