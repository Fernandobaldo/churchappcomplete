import { describe, it, expect, beforeEach, vi } from 'vitest';
import { updateMemberById } from '../../controllers/memberController';
import { validateMemberEditPermission, validatePositionChangePermission, getMemberFromUserId } from '../../utils/authorization';
import { updateMember } from '../../services/memberService';
import { AuditLogger } from '../../utils/auditHelper';
import { Role } from '@prisma/client';
vi.mock('../../services/memberService', async () => {
    const actual = await vi.importActual('../../services/memberService');
    return {
        ...actual,
        updateMember: vi.fn(),
        formatDate: actual.formatDate, // Incluir formatDate do módulo real
    };
});
vi.mock('../../lib/prisma', () => ({
    prisma: {
        member: {
            update: vi.fn(),
            findUnique: vi.fn(),
        },
    },
}));
vi.mock('../../utils/authorization', () => ({
    validateMemberEditPermission: vi.fn(),
    validatePositionChangePermission: vi.fn(),
    getMemberFromUserId: vi.fn(),
}));
vi.mock('../../utils/auditHelper', () => ({
    AuditLogger: {
        memberUpdated: vi.fn(),
    },
}));
// IDs válidos no formato CUID
const VALID_CUID_MEMBER = 'clx123456789012345678901234';
const VALID_CUID_USER = 'clx987654321098765432109876';
const VALID_CUID_ADMIN = 'clx111111111111111111111111';
const VALID_CUID_POSITION = 'clx222222222222222222222222';
const mockRequest = {
    user: {
        id: VALID_CUID_USER,
        userId: VALID_CUID_USER,
        memberId: VALID_CUID_MEMBER,
        email: 'test@example.com',
    },
    params: {
        id: VALID_CUID_MEMBER,
    },
    body: {},
};
const mockReply = {
    status: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
};
describe('updateMemberById', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(getMemberFromUserId).mockResolvedValue({
            id: VALID_CUID_MEMBER,
            role: Role.MEMBER,
            Permission: [],
            Branch: {
                id: 'branch-123',
                churchId: 'church-123',
            },
        });
        vi.mocked(validateMemberEditPermission).mockResolvedValue(undefined);
        vi.mocked(validatePositionChangePermission).mockResolvedValue(undefined);
        vi.mocked(updateMember).mockResolvedValue({
            id: VALID_CUID_MEMBER,
            name: 'Test User',
            email: 'test@example.com',
            phone: null,
            address: null,
            birthDate: null,
            avatarUrl: null,
            positionId: null,
            Position: null,
        });
        vi.mocked(AuditLogger.memberUpdated).mockResolvedValue(undefined);
    });
    // 7.1 updateMemberById
    describe('Validações de updateMemberById', () => {
        it('deve rejeitar atualização de email próprio', async () => {
            const request = {
                ...mockRequest,
                body: {
                    email: 'newemail@example.com',
                },
            };
            await updateMemberById(request, mockReply);
            expect(mockReply.status).toHaveBeenCalledWith(403);
            expect(mockReply.send).toHaveBeenCalledWith({
                error: 'Você não pode alterar seu próprio email. Entre em contato com um administrador.',
            });
            expect(updateMember).not.toHaveBeenCalled();
        });
        it('deve permitir atualização de email de outro membro (admin)', async () => {
            vi.mocked(getMemberFromUserId).mockResolvedValue({
                id: VALID_CUID_ADMIN,
                role: Role.ADMINGERAL,
                Permission: [],
                Branch: {
                    id: 'branch-123',
                    churchId: 'church-123',
                },
            });
            const request = {
                ...mockRequest,
                user: {
                    ...mockRequest.user,
                    memberId: VALID_CUID_ADMIN,
                },
                params: {
                    id: VALID_CUID_MEMBER, // Outro membro
                },
                body: {
                    email: 'newemail@example.com',
                },
            };
            await updateMemberById(request, mockReply);
            expect(updateMember).toHaveBeenCalledWith(VALID_CUID_MEMBER, expect.objectContaining({
                email: 'newemail@example.com',
            }));
        });
        it('deve validar permissão para alterar cargo', async () => {
            const request = {
                ...mockRequest,
                body: {
                    positionId: VALID_CUID_POSITION,
                },
            };
            await updateMemberById(request, mockReply);
            expect(validatePositionChangePermission).toHaveBeenCalledWith(VALID_CUID_MEMBER, VALID_CUID_MEMBER, Role.MEMBER, []);
        });
        it('deve rejeitar alteração de cargo sem permissão', async () => {
            vi.mocked(validatePositionChangePermission).mockRejectedValue(new Error('Você não tem permissão para alterar o cargo'));
            const request = {
                ...mockRequest,
                body: {
                    positionId: VALID_CUID_POSITION,
                },
            };
            await updateMemberById(request, mockReply);
            expect(mockReply.status).toHaveBeenCalledWith(403);
            expect(mockReply.send).toHaveBeenCalledWith({
                error: 'Você não tem permissão para alterar o cargo',
            });
            expect(updateMember).not.toHaveBeenCalled();
        });
        it('deve atualizar campos opcionais para null', async () => {
            const request = {
                ...mockRequest,
                body: {
                    phone: null,
                    address: null,
                    birthDate: null,
                },
            };
            await updateMemberById(request, mockReply);
            expect(updateMember).toHaveBeenCalledWith(VALID_CUID_MEMBER, expect.objectContaining({
                phone: null,
                address: null,
                birthDate: null,
            }));
        });
        it('deve atualizar campos opcionais com valores', async () => {
            const request = {
                ...mockRequest,
                body: {
                    phone: '11999999999',
                    address: 'Rua Teste, 123',
                    birthDate: '01/01/1990',
                },
            };
            vi.mocked(updateMember).mockResolvedValue({
                id: VALID_CUID_MEMBER,
                name: 'Test User',
                email: 'test@example.com',
                phone: '11999999999',
                address: 'Rua Teste, 123',
                birthDate: new Date('1990-01-01'),
                avatarUrl: null,
                positionId: null,
                Position: null,
            });
            await updateMemberById(request, mockReply);
            expect(updateMember).toHaveBeenCalledWith(VALID_CUID_MEMBER, expect.objectContaining({
                phone: '11999999999',
                address: 'Rua Teste, 123',
            }));
        });
        it('deve retornar dados atualizados corretamente', async () => {
            const updatedMember = {
                id: VALID_CUID_MEMBER,
                name: 'Nome Atualizado',
                email: 'test@example.com',
                phone: '11999999999',
                address: 'Rua Atualizada, 456',
                birthDate: new Date('1990-01-01'),
                avatarUrl: null,
                positionId: VALID_CUID_POSITION,
                Position: {
                    id: VALID_CUID_POSITION,
                    name: 'Pastor',
                },
            };
            vi.mocked(updateMember).mockResolvedValue(updatedMember);
            const request = {
                ...mockRequest,
                body: {
                    name: 'Nome Atualizado',
                    phone: '11999999999',
                    address: 'Rua Atualizada, 456',
                    birthDate: '01/01/1990',
                    positionId: VALID_CUID_POSITION,
                },
            };
            await updateMemberById(request, mockReply);
            expect(mockReply.send).toHaveBeenCalled();
            const responseData = vi.mocked(mockReply.send).mock.calls[0][0];
            expect(responseData.name).toBe('Nome Atualizado');
            expect(responseData.phone).toBe('11999999999');
            expect(responseData.address).toBe('Rua Atualizada, 456');
            expect(responseData.birthDate).toBe('01/01/1990');
            expect(responseData.positionId).toBe(VALID_CUID_POSITION);
            expect(responseData.position).toEqual({ id: VALID_CUID_POSITION, name: 'Pastor' });
        });
        it('deve retornar null para campos opcionais removidos', async () => {
            const updatedMember = {
                id: VALID_CUID_MEMBER,
                name: 'Test User',
                email: 'test@example.com',
                phone: null,
                address: null,
                birthDate: null,
                avatarUrl: null,
                positionId: null,
                Position: null,
            };
            vi.mocked(updateMember).mockResolvedValue(updatedMember);
            const request = {
                ...mockRequest,
                body: {
                    name: 'Test User', // Incluir campo obrigatório para garantir que dataToUpdate não esteja vazio
                    phone: null,
                    address: null,
                    birthDate: null,
                },
            };
            await updateMemberById(request, mockReply);
            expect(mockReply.send).toHaveBeenCalled();
            const responseData = vi.mocked(mockReply.send).mock.calls[0][0];
            // Verificar que os campos opcionais estão presentes e são null
            expect(responseData).toHaveProperty('phone');
            expect(responseData.phone).toBeNull();
            expect(responseData).toHaveProperty('address');
            expect(responseData.address).toBeNull();
            expect(responseData).toHaveProperty('birthDate');
            expect(responseData.birthDate).toBeNull();
            expect(responseData).toHaveProperty('positionId');
            expect(responseData.positionId).toBeNull();
            expect(responseData).toHaveProperty('position');
            expect(responseData.position).toBeNull();
        });
        it('deve validar formato de data dd/mm/yyyy', async () => {
            const request = {
                ...mockRequest,
                body: {
                    birthDate: '01/01/1990',
                },
            };
            vi.mocked(updateMember).mockResolvedValue({
                id: VALID_CUID_MEMBER,
                name: 'Test User',
                email: 'test@example.com',
                phone: null,
                address: null,
                birthDate: new Date('1990-01-01'),
                avatarUrl: null,
                positionId: null,
                Position: null,
            });
            await updateMemberById(request, mockReply);
            expect(updateMember).toHaveBeenCalledWith(VALID_CUID_MEMBER, expect.objectContaining({
                birthDate: expect.any(Date),
            }));
        });
        it('deve rejeitar data inválida', async () => {
            const request = {
                ...mockRequest,
                body: {
                    birthDate: '99/99/9999',
                },
            };
            await updateMemberById(request, mockReply);
            expect(mockReply.status).toHaveBeenCalledWith(400);
            expect(mockReply.send).toHaveBeenCalledWith({
                message: 'Data de nascimento inválida.',
            });
            expect(updateMember).not.toHaveBeenCalled();
        });
        it('deve retornar erro 400 quando nenhum dado para atualizar', async () => {
            const request = {
                ...mockRequest,
                body: {},
            };
            await updateMemberById(request, mockReply);
            expect(mockReply.status).toHaveBeenCalledWith(400);
            expect(mockReply.send).toHaveBeenCalledWith({
                message: 'Nenhum dado para atualizar.',
            });
            expect(updateMember).not.toHaveBeenCalled();
        });
        it('deve fazer log de auditoria após atualização', async () => {
            const request = {
                ...mockRequest,
                body: {
                    name: 'Nome Atualizado',
                },
            };
            await updateMemberById(request, mockReply);
            expect(AuditLogger.memberUpdated).toHaveBeenCalledWith(request, VALID_CUID_MEMBER, expect.objectContaining({
                name: 'Nome Atualizado',
            }));
        });
    });
});
