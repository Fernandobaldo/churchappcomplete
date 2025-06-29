import { prisma } from '../lib/prisma'
import { ContributionType } from '@prisma/client'

interface CreateContributionInput {
title: string
description?: string
value: number
date: string
type: ContributionType
branchId: string
}

export class ContributionService {
async getByBranch(branchId: string) {
    return prisma.contribution.findMany({
      where: { branchId },
      orderBy: { date: 'desc' }
    })
  }

  async create(data: CreateContributionInput) {
    return prisma.contribution.create({
      data: {
        title: data.title,
        description: data.description,
        value: data.value,
        date: new Date(data.date),
        type: data.type,
        branchId: data.branchId
      }
    })
  }
}
