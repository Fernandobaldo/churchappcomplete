import { prisma } from '../lib/prisma';
export function formatDate(date) {
    if (!date)
        return null;
    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(date);
}
/**
 * Busca todos os membros
 * @param branchId ID da branch (obrigatório para ADMINFILIAL e COORDINATOR)
 * @param churchId ID da igreja (obrigatório para ADMINGERAL, opcional para outros)
 * @param userRole Role do usuário que está buscando
 */
export async function findAllMembers(branchId, churchId = null, userRole = null) {
    // Se for ADMINGERAL e tiver churchId, busca todos os membros da igreja
    if (userRole === 'ADMINGERAL' && churchId) {
        return prisma.member.findMany({
            where: {
                branch: {
                    churchId,
                },
            },
            select: {
                id: true,
                name: true,
                branchId: true,
                birthDate: true,
                phone: true,
                address: true,
                avatarUrl: true,
                email: true,
                role: true,
                permissions: {
                    select: { type: true },
                },
                branch: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });
    }
    // Para outros roles, busca apenas membros da branch especificada
    if (!branchId) {
        throw new Error('branchId é obrigatório para buscar membros');
    }
    return prisma.member.findMany({
        where: { branchId },
        select: {
            id: true,
            name: true,
            branchId: true,
            birthDate: true,
            phone: true,
            address: true,
            avatarUrl: true,
            email: true,
            role: true,
            permissions: {
                select: { type: true },
            },
        },
    });
}
export async function findMemberById(id) {
    return prisma.member.findUnique({
        where: { id },
        select: {
            id: true,
            name: true,
            branchId: true,
            birthDate: true,
            phone: true,
            address: true,
            avatarUrl: true,
            email: true,
            role: true,
            permissions: {
                select: { type: true },
            },
            branch: {
                include: { church: true },
            },
        },
    });
}
export async function updateMember(id, data) {
    return prisma.member.update({
        where: { id },
        data,
        select: {
            id: true,
            name: true,
            email: true,
            birthDate: true,
            phone: true,
            address: true,
            avatarUrl: true,
        },
    });
}
