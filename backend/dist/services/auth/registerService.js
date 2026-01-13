import { prisma } from '../../lib/prisma';
import bcrypt from 'bcryptjs';
import { Role, SubscriptionStatus } from '@prisma/client';
import { parse, isValid } from 'date-fns';
import { ALL_PERMISSION_TYPES } from '../../constants/permissions';
import { checkPlanMembersLimit } from '../../utils/planLimits';
import { validateMemberCreationPermission, getMemberFromUserId, } from '../../utils/authorization';
import { validateInviteLink, incrementLinkUsage } from '../inviteLinkService';
import { sendWelcomeEmail, sendMemberRegistrationAttemptNotification } from '../emailService';
export async function registerUserService(data) {
    const { name, email, password, branchId, role, permissions, birthDate, phone, address, avatarUrl, fromLandingPage, creatorUserId, inviteToken, } = data;
    const hashedPassword = await bcrypt.hash(password, 10);
    // 🔗 Se for registro via link de convite
    if (inviteToken) {
        // 1. Verificar se email já existe PRIMEIRO (antes de validar link)
        // Isso garante que erros de validação (400) sejam retornados antes de erros de permissão (403)
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            throw new Error('Email já cadastrado como usuário.');
        }
        const existingMember = await prisma.member.findUnique({ where: { email } });
        if (existingMember) {
            throw new Error('Email já cadastrado como membro.');
        }
        // 2. Validar o link de convite (após verificar email)
        const validation = await validateInviteLink(inviteToken);
        if (!validation.valid) {
            if (validation.error === 'LIMIT_REACHED') {
                throw new Error('LIMIT_REACHED');
            }
            throw new Error(validation.error || 'Link de convite inválido');
        }
        const inviteLink = validation.inviteLink;
        // 3. Criar User
        // Separar name em firstName e lastName
        const nameParts = name.trim().split(/\s+/);
        const firstName = nameParts[0] || name;
        const lastName = nameParts.slice(1).join(' ') || firstName;
        const newUser = await prisma.user.create({
            data: {
                firstName,
                lastName,
                email,
                password: hashedPassword,
            },
        });
        // 4. Parse da data de nascimento
        let parsedBirthDate = undefined;
        if (birthDate) {
            const isoDate = new Date(birthDate);
            if (!isNaN(isoDate.getTime())) {
                parsedBirthDate = isoDate;
            }
            else {
                const parsedDate = parse(birthDate.trim(), 'dd/MM/yyyy', new Date());
                if (isValid(parsedDate)) {
                    parsedBirthDate = parsedDate;
                }
            }
        }
        // 5. Criar Member vinculado ao link
        const member = await prisma.member.create({
            data: {
                name,
                email,
                role: Role.MEMBER, // Sempre MEMBER para registro via link
                branchId: inviteLink.branchId,
                userId: newUser.id,
                inviteLinkId: inviteLink.id,
                birthDate: parsedBirthDate,
                phone,
                address,
                avatarUrl,
            },
        });
        // 5.1. Adicionar permissão members_view automaticamente para todos os membros
        await prisma.permission.create({
            data: {
                memberId: member.id,
                type: 'members_view',
            },
        });
        // 6. Incrementar uso do link
        await incrementLinkUsage(inviteToken);
        // 7. Enviar email de boas-vindas (não deve quebrar o registro se falhar)
        try {
            await sendWelcomeEmail(email, name, inviteLink.Branch.Church.name);
        }
        catch (error) {
            console.error('❌ Erro ao enviar email de boas-vindas:', error);
            // Não lança erro - o registro foi bem-sucedido mesmo se o email falhar
        }
        // 8. Notificar admins sobre novo registro (não deve quebrar o registro se falhar)
        try {
            const admins = await prisma.member.findMany({
                where: {
                    Branch: {
                        churchId: inviteLink.Branch.churchId,
                    },
                    role: {
                        in: ['ADMINGERAL', 'ADMINFILIAL'],
                    },
                },
            });
            const adminEmails = admins.map((a) => a.email).filter(Boolean);
            if (adminEmails.length > 0) {
                await sendMemberRegistrationAttemptNotification(adminEmails, inviteLink.Branch.Church.name, name, email);
            }
        }
        catch (error) {
            console.error('❌ Erro ao notificar admins:', error);
            // Não lança erro - o registro foi bem-sucedido mesmo se a notificação falhar
        }
        return member;
    }
    // ⚙️ Se for landing page → cria User e assina plano Free
    if (fromLandingPage) {
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing)
            throw new Error('Email já cadastrado como usuário.');
        // Separar name em firstName e lastName
        const nameParts = name.trim().split(/\s+/);
        const firstName = nameParts[0] || name;
        const lastName = nameParts.slice(1).join(' ') || firstName;
        const user = await prisma.user.create({
            data: {
                firstName,
                lastName,
                email,
                password: hashedPassword,
            },
        });
        // Busca o plano gratuito (tenta diferentes variações do nome)
        let freePlan = await prisma.plan.findFirst({ where: { name: 'free' } });
        if (!freePlan) {
            freePlan = await prisma.plan.findFirst({ where: { name: 'Free' } });
        }
        if (!freePlan) {
            freePlan = await prisma.plan.findFirst({ where: { name: 'Free Plan' } });
        }
        if (!freePlan) {
            throw new Error('Plano Free não encontrado. Execute o seed do banco de dados.');
        }
        await prisma.subscription.create({
            data: {
                userId: user.id,
                planId: freePlan.id,
                status: SubscriptionStatus.active,
            },
        });
        return { success: true, message: 'Usuário criado com plano Free', user };
    }
    // 🧱 Caso seja criação de membro interno
    // Validações de segurança
    // IMPORTANTE: Se chegou aqui, fromLandingPage é false ou undefined
    // então é criação de membro interno e precisa de branchId
    if (!branchId) {
        throw new Error('branchId é obrigatório para criação de membros internos');
    }
    if (!creatorUserId) {
        throw new Error('Usuário criador não identificado');
    }
    // 1. Buscar dados do criador
    const creatorMember = await getMemberFromUserId(creatorUserId);
    if (!creatorMember) {
        throw new Error('Membro criador não encontrado. Você precisa estar logado como membro para criar outros membros.');
    }
    // 2. Validar permissões de criação
    await validateMemberCreationPermission(creatorMember.id, branchId, role);
    // 3. Validar limite de plano
    await checkPlanMembersLimit(creatorUserId);
    // 4. Determinar role final (padrão: MEMBER)
    const finalRole = role || Role.MEMBER;
    // 5. Verificar se email já existe como User ou Member
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
        throw new Error('Email já cadastrado como usuário.');
    }
    const existingMember = await prisma.member.findUnique({ where: { email } });
    if (existingMember) {
        throw new Error('Email já cadastrado como membro.');
    }
    // 6. Criar User primeiro (para ter senha)
    // Separar name em firstName e lastName
    const nameParts = name.trim().split(/\s+/);
    const firstName = nameParts[0] || name;
    const lastName = nameParts.slice(1).join(' ') || firstName;
    const newUser = await prisma.user.create({
        data: {
            firstName,
            lastName,
            email,
            password: hashedPassword,
        },
    });
    // 7. Criar Member associado ao User (SEM senha - usa senha do User)
    // Parse da data de nascimento (aceita ISO ou dd/MM/yyyy)
    let parsedBirthDate = undefined;
    if (birthDate) {
        // Tenta parse ISO primeiro
        const isoDate = new Date(birthDate);
        if (!isNaN(isoDate.getTime())) {
            parsedBirthDate = isoDate;
        }
        else {
            // Tenta parse dd/MM/yyyy
            const parsedDate = parse(birthDate.trim(), 'dd/MM/yyyy', new Date());
            if (isValid(parsedDate)) {
                parsedBirthDate = parsedDate;
            }
            else {
                throw new Error('Data de nascimento inválida. Use o formato YYYY-MM-DD ou dd/MM/yyyy.');
            }
        }
    }
    const member = await prisma.member.create({
        data: {
            name,
            email,
            role: finalRole,
            branchId,
            userId: newUser.id, // Associa ao User criado
            birthDate: parsedBirthDate,
            phone,
            address,
            avatarUrl,
        },
    });
    // 8. Adiciona permissões
    const typesToAssign = finalRole === Role.ADMINGERAL || finalRole === Role.ADMINFILIAL
        ? ALL_PERMISSION_TYPES
        : permissions ?? [];
    // Garantir que members_view sempre seja incluído para todos os membros
    const permissionsToCreate = [...new Set([...typesToAssign, 'members_view'])];
    if (permissionsToCreate.length > 0) {
        // Cria as permissões diretamente para o member
        // Permission tem memberId obrigatório, então não pode existir sem um member
        await prisma.permission.createMany({
            data: permissionsToCreate.map((type) => ({
                memberId: member.id,
                type,
            })),
            skipDuplicates: true,
        });
    }
    const memberWithPerms = await prisma.member.findUnique({
        where: { id: member.id },
        include: { Permission: true },
    });
    // Log de auditoria (assíncrono, não bloqueia a resposta)
    // Nota: request precisa ser passado como parâmetro para obter contexto
    // Por enquanto, criamos o log sem o request (será adicionado no controller)
    return memberWithPerms;
}
