import { describe, it, expect } from 'vitest';
import { updateMemberBodySchema } from '../../schemas/memberSchemas';
describe('updateMemberBodySchema', () => {
    // 6.1 updateMemberBodySchema
    describe('Validação de Campos', () => {
        it('deve validar nome opcional mas não vazio', () => {
            const validData = {
                name: 'Nome Válido',
            };
            const result = updateMemberBodySchema.parse(validData);
            expect(result.name).toBe('Nome Válido');
        });
        it('deve rejeitar nome vazio', () => {
            const invalidData = {
                name: '',
            };
            expect(() => updateMemberBodySchema.parse(invalidData)).toThrow();
        });
        it('deve aceitar sem nome (opcional)', () => {
            const data = {
                phone: '11999999999',
            };
            const result = updateMemberBodySchema.parse(data);
            expect(result.name).toBeUndefined();
        });
        it('deve validar email opcional mas formato válido', () => {
            const validData = {
                email: 'test@example.com',
            };
            const result = updateMemberBodySchema.parse(validData);
            expect(result.email).toBe('test@example.com');
        });
        it('deve rejeitar email inválido', () => {
            const invalidData = {
                email: 'email-invalido',
            };
            expect(() => updateMemberBodySchema.parse(invalidData)).toThrow();
        });
        it('deve aceitar sem email (opcional)', () => {
            const data = {
                name: 'Teste',
            };
            const result = updateMemberBodySchema.parse(data);
            expect(result.email).toBeUndefined();
        });
        it('deve transformar string vazia em null para campos opcionais', () => {
            const data = {
                phone: '',
                address: '',
                birthDate: '',
                avatarUrl: '',
            };
            const result = updateMemberBodySchema.parse(data);
            // Todos os campos opcionais transformam string vazia em null para permitir remoção
            expect(result.phone).toBeNull();
            expect(result.address).toBeNull();
            expect(result.birthDate).toBeNull();
            expect(result.avatarUrl).toBeNull();
        });
        it('deve aceitar null para campos opcionais', () => {
            const data = {
                phone: null,
                address: null,
                birthDate: null,
                avatarUrl: null,
            };
            const result = updateMemberBodySchema.parse(data);
            expect(result.phone).toBeNull();
            expect(result.address).toBeNull();
            expect(result.birthDate).toBeNull();
            expect(result.avatarUrl).toBeNull();
        });
        it('deve validar formato de data dd/mm/yyyy', () => {
            const validData = {
                birthDate: '15/05/1985',
            };
            const result = updateMemberBodySchema.parse(validData);
            expect(result.birthDate).toBe('15/05/1985');
        });
        it('deve aceitar null para data de nascimento', () => {
            const data = {
                birthDate: null,
            };
            const result = updateMemberBodySchema.parse(data);
            expect(result.birthDate).toBeNull();
        });
        it('deve transformar string vazia em null para data', () => {
            const data = {
                birthDate: '',
            };
            const result = updateMemberBodySchema.parse(data);
            expect(result.birthDate).toBeNull();
        });
        it('deve validar positionId como cuid ou null', () => {
            const validData = {
                positionId: 'clx1234567890123456789012', // Formato cuid válido
            };
            const result = updateMemberBodySchema.parse(validData);
            expect(result.positionId).toBe('clx1234567890123456789012');
        });
        it('deve aceitar null para positionId', () => {
            const data = {
                positionId: null,
            };
            const result = updateMemberBodySchema.parse(data);
            expect(result.positionId).toBeNull();
        });
        it('deve transformar string vazia em null para positionId', () => {
            const data = {
                positionId: '',
            };
            const result = updateMemberBodySchema.parse(data);
            expect(result.positionId).toBeNull();
        });
        it('deve rejeitar positionId inválido (não cuid)', () => {
            const invalidData = {
                positionId: 'invalid-id',
            };
            expect(() => updateMemberBodySchema.parse(invalidData)).toThrow();
        });
        it('deve validar todos os campos juntos', () => {
            const validData = {
                name: 'Nome Completo',
                email: 'email@example.com',
                phone: '11999999999',
                address: 'Rua Teste, 123',
                birthDate: '01/01/1990',
                positionId: 'clx1234567890123456789012',
                avatarUrl: 'https://example.com/avatar.jpg',
            };
            const result = updateMemberBodySchema.parse(validData);
            expect(result.name).toBe('Nome Completo');
            expect(result.email).toBe('email@example.com');
            expect(result.phone).toBe('11999999999');
            expect(result.address).toBe('Rua Teste, 123');
            expect(result.birthDate).toBe('01/01/1990');
            expect(result.positionId).toBe('clx1234567890123456789012');
            expect(result.avatarUrl).toBe('https://example.com/avatar.jpg');
        });
        it('deve aceitar apenas alguns campos', () => {
            const data = {
                name: 'Apenas Nome',
            };
            const result = updateMemberBodySchema.parse(data);
            expect(result.name).toBe('Apenas Nome');
            expect(result.email).toBeUndefined();
            expect(result.phone).toBeUndefined();
        });
    });
});
