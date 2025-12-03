import { prisma } from '../lib/prisma';
import { Role } from '@prisma/client';
import { ALL_PERMISSION_TYPES } from '../constants/permissions';
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
 * @param memberId ID do membro (obrigatório para MEMBER, para retornar apenas si mesmo)
 * @param hasManagePermission Se o usuário tem permissão members_manage (para ver dados sensíveis)
 */
export async function findAllMembers(branchId, churchId = null, userRole = null, memberId = null, hasManagePermission = false) {
    // Se for ADMINGERAL e tiver churchId, busca todos os membros da igreja
    if (userRole === 'ADMINGERAL' && churchId) {
        const members = await prisma.member.findMany({
            where: {
                Branch: {
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
                positionId: true,
                Permission: {
                    select: { id: true, type: true },
                },
                Branch: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                Position: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });
        const mappedMembers = members.map(member => {
            const { Permission, Branch, Position, email, phone, address, ...rest } = member;
            const result = {
                ...rest,
                permissions: Permission.map(p => ({ id: p.id, type: p.type })),
                branch: Branch,
                position: Position ? { id: Position.id, name: Position.name } : null,
            };
            console.log(`[PERMISSIONS DEBUG] findAllMembers (ADMINGERAL) - Membro ${member.id} (${member.name}):`, {
                permissionsCount: Permission.length,
                permissions: Permission.map(p => p.type)
            });
            // Inclui dados sensíveis apenas se tiver permissão members_manage
            if (hasManagePermission || userRole === 'ADMINGERAL' || userRole === 'ADMINFILIAL') {
                result.email = email;
                result.phone = phone;
                result.address = address;
            }
            return result;
        });
        console.log(`[PERMISSIONS DEBUG] findAllMembers (ADMINGERAL) retornando ${mappedMembers.length} membros`);
        return mappedMembers;
    }
    // Para outros roles (incluindo MEMBER), busca membros da branch especificada
    // MEMBER pode ver todos os membros da sua filial, mas sem dados sensíveis
    if (!branchId) {
        throw new Error('branchId é obrigatório para buscar membros');
    }
    const members = await prisma.member.findMany({
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
            positionId: true,
            Permission: {
                select: { id: true, type: true },
            },
            Position: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
    });
    const mappedMembers = members.map(member => {
        const { Permission, Position, email, phone, address, ...rest } = member;
        const result = {
            ...rest,
            permissions: Permission.map(p => ({ id: p.id, type: p.type })),
            position: Position ? { id: Position.id, name: Position.name } : null,
        };
        console.log(`[PERMISSIONS DEBUG] findAllMembers - Membro ${member.id} (${member.name}):`, {
            permissionsCount: Permission.length,
            permissions: Permission.map(p => p.type)
        });
        // Inclui dados sensíveis apenas se tiver permissão members_manage
        if (hasManagePermission || userRole === 'ADMINGERAL' || userRole === 'ADMINFILIAL') {
            result.email = email;
            result.phone = phone;
            result.address = address;
        }
        return result;
    });
    console.log(`[PERMISSIONS DEBUG] findAllMembers retornando ${mappedMembers.length} membros`);
    return mappedMembers;
}
export async function findMemberById(id, hasManagePermission = false, canViewPermissions = false) {
    console.log(`[PERMISSIONS DEBUG] findMemberById chamado para membro ${id}, hasManagePermission: ${hasManagePermission}, canViewPermissions: ${canViewPermissions}`);
    const member = await prisma.member.findUnique({
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
            positionId: true,
            Permission: {
                select: { id: true, type: true },
            },
            Branch: {
                include: { Church: true },
            },
            Position: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
    });
    if (!member) {
        console.log(`[PERMISSIONS DEBUG] Membro ${id} não encontrado`);
        return null;
    }
    console.log(`[DB DEBUG] ========== DADOS DO BANCO DE DADOS ==========`);
    console.log(`[DB DEBUG] Membro ID: ${member.id}`);
    console.log(`[DB DEBUG] positionId (raw):`, member.positionId);
    console.log(`[DB DEBUG] positionId (type):`, typeof member.positionId);
    console.log(`[DB DEBUG] Position (raw):`, JSON.stringify(member.Position, null, 2));
    console.log(`[DB DEBUG] Position (type):`, typeof member.Position);
    console.log(`[DB DEBUG] Todos os campos do member:`, Object.keys(member));
    console.log(`[DB DEBUG] ============================================`);
    console.log(`[PERMISSIONS DEBUG] Permissões encontradas no banco para ${id}:`, member.Permission);
    console.log(`[PERMISSIONS DEBUG] Quantidade de permissões:`, member.Permission.length);
    // Desestruturação explícita para garantir que positionId não seja perdido
    const { Permission, Branch, Position, email, phone, address, positionId, ...rest } = member;
    console.log(`[TRANSFORM DEBUG] ========== TRANSFORMAÇÃO DOS DADOS ==========`);
    console.log(`[TRANSFORM DEBUG] positionId após desestruturação:`, positionId);
    console.log(`[TRANSFORM DEBUG] positionId (type):`, typeof positionId);
    console.log(`[TRANSFORM DEBUG] Position após desestruturação:`, Position);
    console.log(`[TRANSFORM DEBUG] Position (type):`, typeof Position);
    console.log(`[TRANSFORM DEBUG] Rest keys:`, Object.keys(rest));
    console.log(`[TRANSFORM DEBUG] ============================================`);
    // Construir resultado explicitamente para garantir que todos os campos estejam presentes
    // IMPORTANTE: Usar null em vez de undefined para garantir que campos sejam serializados no JSON
    const result = {
        id: member.id,
        name: member.name,
        branchId: member.branchId,
        birthDate: member.birthDate,
        avatarUrl: member.avatarUrl ?? null,
        role: member.role,
        positionId: positionId !== undefined && positionId !== null ? String(positionId) : null, // Garante que positionId sempre esteja presente como string ou null
        permissions: canViewPermissions ? Permission.map(p => ({ id: p.id, type: p.type })) : [],
        branch: Branch,
        position: Position ? { id: String(Position.id), name: Position.name } : null,
    };
    // Garantir que positionId não seja undefined (JSON remove campos undefined)
    if (result.positionId === undefined) {
        result.positionId = null;
    }
    // Garantir que position não seja undefined
    if (result.position === undefined) {
        result.position = null;
    }
    console.log(`[RESULT DEBUG] ========== RESULTADO DO findMemberById ==========`);
    console.log(`[RESULT DEBUG] result.positionId:`, result.positionId);
    console.log(`[RESULT DEBUG] result.positionId (type):`, typeof result.positionId);
    console.log(`[RESULT DEBUG] result.position:`, JSON.stringify(result.position, null, 2));
    console.log(`[RESULT DEBUG] result keys:`, Object.keys(result));
    console.log(`[RESULT DEBUG] JSON completo do result:`, JSON.stringify(result, null, 2));
    console.log(`[RESULT DEBUG] =================================================`);
    console.log(`[PERMISSIONS DEBUG] Resultado final do findMemberById para ${id}:`, {
        permissionsCount: result.permissions.length,
        permissions: result.permissions,
        canViewPermissions,
        positionId: result.positionId,
        position: result.position,
    });
    // Inclui dados sensíveis apenas se tiver permissão members_manage
    // Para o próprio perfil (getMyProfile), sempre inclui email, phone e address
    // Sempre inclui os campos, mesmo que sejam null, para garantir que o frontend receba todos os campos
    if (hasManagePermission) {
        result.email = email ?? null;
        result.phone = phone ?? null;
        result.address = address ?? null;
    }
    else {
        // Mesmo sem permissão, inclui como null para manter a estrutura consistente
        result.email = null;
        result.phone = null;
        result.address = null;
    }
    console.log(`[PROFILE DEBUG] findMemberById retornando para ${id}:`, {
        hasManagePermission,
        canViewPermissions,
        email: result.email,
        phone: result.phone,
        address: result.address,
        positionId: result.positionId,
        position: result.position,
    });
    return result;
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
            positionId: true,
            Position: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
    });
}
/**
 * Atualiza a role de um membro e atribui permissões padrão
 * @param memberId ID do membro
 * @param newRole Nova role a ser atribuída
 * @returns Membro atualizado com permissões
 */
export async function updateMemberRole(memberId, newRole) {
    // Buscar membro atual com permissões
    const member = await prisma.member.findUnique({
        where: { id: memberId },
        include: {
            Permission: true,
        },
    });
    if (!member) {
        throw new Error('Membro não encontrado');
    }
    // Atualizar role
    await prisma.member.update({
        where: { id: memberId },
        data: { role: newRole },
    });
    // Determinar permissões padrão baseadas na nova role
    let permissionsToAssign = [];
    if (newRole === Role.ADMINGERAL || newRole === Role.ADMINFILIAL) {
        // ADMINGERAL e ADMINFILIAL recebem todas as permissões
        permissionsToAssign = [...ALL_PERMISSION_TYPES];
    }
    else {
        // COORDINATOR e MEMBER mantêm apenas members_view
        // Se já tiver permissões, mantém apenas members_view
        permissionsToAssign = ['members_view'];
    }
    // Remover todas as permissões antigas
    await prisma.permission.deleteMany({
        where: { memberId },
    });
    // Criar novas permissões
    if (permissionsToAssign.length > 0) {
        await prisma.permission.createMany({
            data: permissionsToAssign.map((type) => ({
                memberId,
                type,
            })),
            skipDuplicates: true,
        });
    }
    // Retornar membro atualizado com permissões
    const updatedMember = await prisma.member.findUnique({
        where: { id: memberId },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            branchId: true,
            Permission: {
                select: { id: true, type: true },
            },
        },
    });
    if (!updatedMember) {
        throw new Error('Erro ao buscar membro atualizado');
    }
    return {
        ...updatedMember,
        permissions: updatedMember.Permission.map(p => ({ id: p.id, type: p.type })),
    };
}
