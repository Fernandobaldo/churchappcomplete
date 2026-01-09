import { prisma } from '../lib/prisma'

export class OnboardingProgressService {
  async getOrCreateProgress(userId: string) {
    let progress = await prisma.onboardingProgress.findUnique({
      where: { userId },
    })

    if (!progress) {
      progress = await prisma.onboardingProgress.create({
        data: {
          userId,
        },
      })
    }

    return progress
  }

  async markStepComplete(userId: string, step: 'church' | 'branches' | 'settings') {
    const progress = await this.getOrCreateProgress(userId)

    const updateData: any = {}
    if (step === 'church') {
      updateData.churchConfigured = true
    } else if (step === 'branches') {
      updateData.branchesConfigured = true
    } else if (step === 'settings') {
      updateData.settingsConfigured = true
    }

    return await prisma.onboardingProgress.update({
      where: { userId },
      data: updateData,
    })
  }

  async markComplete(userId: string) {
    return await prisma.onboardingProgress.update({
      where: { userId },
      data: {
        completed: true,
        completedAt: new Date(),
      },
    })
  }

  async getProgress(userId: string) {
    return await prisma.onboardingProgress.findUnique({
      where: { userId },
    })
  }

  async isCompleted(userId: string): Promise<boolean> {
    const progress = await prisma.onboardingProgress.findUnique({
      where: { userId },
      select: { completed: true },
    })

    return progress?.completed ?? false
  }
}

