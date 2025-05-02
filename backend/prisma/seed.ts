import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    await prisma.permission.deleteMany(); // Remove todas as permissões
    await prisma.member.deleteMany();     // Remove todos os membros
    await prisma.branch.deleteMany();     // Remove todas as filiais
    await prisma.church.deleteMany();     // Remove todas as igrejas
    console.log('🌱 Iniciando seed...');

    // Cria Church
    const church = await prisma.church.create({
        data: {
            name: 'Igreja de Teste',
            logoUrl: 'https://via.placeholder.com/100x100',
        },
    });

    // Cria Branch
    const branch = await prisma.branch.create({
        data: {
            name: 'Sede Principal',
            pastorName: 'Pr. Admin',
            churchId: church.id,
        },
    });

    // Cria Admin Geral
    const hashedPassword = await bcrypt.hash('admin123', 10);

    const admin = await prisma.member.create({
        data: {
            name: 'Admin Geral',
            email: 'admin@teste.com',
            password: hashedPassword,
            role: 'ADMINGERAL',
            branchId: branch.id,
        },
    });

    // Permissões a vincular
    const defaultPermissions = ['devotional_manage', 'members_view', 'events_manage'];

    // Cria e vincula permissões diretamente
    await prisma.member.update({
        where: { id: admin.id },
        data: {
            permissions: {
                create: defaultPermissions.map((type) => ({ type })),
            },
        },
    });

    console.log('✅ Seed finalizado com sucesso!');
    console.log('🔐 Login: admin@teste.com | Senha: admin123');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
