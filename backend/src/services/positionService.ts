import { prisma } from '../lib/prisma'

export class PositionService {
  async createPosition(churchId: string, name: string, isDefault: boolean = false) {
    return prisma.churchPosition.create({
      data: {
        name,
        churchId,
        isDefault,
      },
    })
  }

  async getAllPositions(churchId: string) {
    return prisma.churchPosition.findMany({
      where: { churchId },
      orderBy: [
        { isDefault: 'desc' },
        { name: 'asc' },
      ],
      include: {
        _count: {
          select: { Members: true },
        },
      },
    })
  }

  async getPositionById(id: string) {
    return prisma.churchPosition.findUnique({
      where: { id },
      include: {
        _count: {
          select: { Members: true },
        },
      },
    })
  }

  async updatePosition(id: string, name: string) {
    return prisma.churchPosition.update({
      where: { id },
      data: { name },
    })
  }

  async deletePosition(id: string) {
    // Verificar se há membros com este cargo
    const position = await prisma.churchPosition.findUnique({
      where: { id },
      include: {
        _count: {
          select: { Members: true },
        },
      },
    })

    if (!position) {
      throw new Error('Cargo não encontrado')
    }

    if (position.isDefault) {
      throw new Error('Não é possível deletar cargos padrão do sistema')
    }

    if (position._count.Members > 0) {
      throw new Error('Não é possível deletar cargo que possui membros associados')
    }

    return prisma.churchPosition.delete({
      where: { id },
    })
  }

  async getDefaultPositions() {
    return [
      { name: 'Pastor', isDefault: true },
      { name: 'Obreiro', isDefault: true },
      { name: 'Tesoureiro', isDefault: true },
      { name: 'Líder dos Jovens', isDefault: true },
      { name: 'Líder dos Adolescentes', isDefault: true },
      { name: 'Líder das Crianças', isDefault: true },
    ]
  }

  async ensureDefaultPositions(churchId: string) {
    const defaultPositions = await this.getDefaultPositions()
    const existingPositions = await this.getAllPositions(churchId)

    const existingNames = existingPositions.map(p => p.name.toLowerCase())

    for (const position of defaultPositions) {
      if (!existingNames.includes(position.name.toLowerCase())) {
        await this.createPosition(churchId, position.name, position.isDefault)
      }
    }
  }
}
