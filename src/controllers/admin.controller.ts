import { Request, Response } from 'express';
import { UserRole } from '../types/roles';
import { prisma } from '../lib/prisma';

export const getGlobalStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      userStats,
      totalVolume,
      revenueStats,
      newUsersCount,
      contractStats,
      activeDisputes
    ] = await Promise.all([
      // Distribuição de usuários por role
      prisma.user.groupBy({ by: ['role'], _count: { _all: true } }),
      
      // GMV (Gross Merchandise Value)
      prisma.contract.aggregate({ _sum: { budget: true } }),
      
      // Revenue (Platform Fees) de contratos ativos ou concluídos
      prisma.contract.aggregate({ 
        where: { escrowStatus: { in: ['IN_PROGRESS', 'COMPLETED'] } },
        _sum: { platformFee: true } 
      }),

      // Novos usuários nos últimos 7 dias
      prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),

      // Saúde do Marketplace (Contagem por Status)
      prisma.contract.groupBy({ by: ['escrowStatus'], _count: { _all: true } }),

      // Disputas Ativas
      prisma.contract.findMany({ 
        where: { escrowStatus: 'DISPUTE' }, 
        include: { company: true, influencer: true } 
      })
    ]);

    res.json({
      metrics: {
        totalUsers: userStats,
        gmv: totalVolume._sum.budget || 0,
        revenue: revenueStats._sum.platformFee || 0,
        newUsersLast7Days: newUsersCount,
        marketplaceHealth: contractStats,
      },
      disputes: activeDisputes,
      status: "SYSTEM_HEALTHY",
      serverTime: now.toISOString()
    });
  } catch (error) {
    console.error('[ADMIN] Erro ao carregar estatísticas:', error);
    res.status(500).json({ error: "Erro ao carregar estatísticas do sistema." });
  }
};
