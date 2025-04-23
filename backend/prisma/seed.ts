import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const church = await prisma.church.create({
        data: {
            name: 'Igreja Esperança',
            logoUrl: '',
            branches: {
                create: [
                    {
                        name: 'Filial Central',
                        members: {
                            create: {
                                name: 'Admin Geral',
                                email: 'admin@igreja.com',
                                password: '$2a$10$FvHzcPoApNMy9PTZyk4sUu8el6rOy9ebLkHeOpN8.AYJ07mLrxdAy', // senha: 123456
                                role: 'ADMINGERAL',
                            },
                        },
                    },
                ],
            },
        },
        include: {
            branches: {
                include: {
                    members: true,
                },
            },
        },
    })

    console.log('✅ Igreja criada com sucesso:')
    console.dir(church, { depth: null })
}

main().finally(() => prisma.$disconnect())
