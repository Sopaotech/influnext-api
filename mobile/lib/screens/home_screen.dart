import 'package:flutter/material.dart';
import '../theme.dart';
import '../services/dashboard_service.dart';

class HomeScreen extends StatelessWidget {
  final List<Map<String, dynamic>> recebidos;
  final DashboardData? dashboardData;

  const HomeScreen({super.key, required this.recebidos, this.dashboardData});

  @override
  Widget build(BuildContext context) {
    // Calculate pending/in-transit packages
    final pendingCount = recebidos.where((p) => p['status'] != 'Entregue').length;

    // Usa dados reais da API se disponíveis, senão usa valores de demonstração
    final balance = dashboardData?.estimatedBalance ?? 14850.0;
    final growthPct = dashboardData?.balanceGrowthPct ?? 12.5;
    final activeCampaigns = dashboardData?.activeCampaigns ?? 4;
    final handle = dashboardData?.handle ?? 'Alexsandro';
    final balanceStr = 'R\$ ${balance.toStringAsFixed(2).replaceAll('.', ',').replaceAllMapped(RegExp(r'(\d)(?=(\d{3})+,)'), (m) => '${m[1]}.')}';
    final growthStr = '${growthPct >= 0 ? '+' : ''}${growthPct.toStringAsFixed(1)}%';

    return Scaffold(
      body: Stack(
        children: [
          // Background Gradient
          Container(
            decoration: const BoxDecoration(gradient: InflunextTheme.bgGradient),
          ),
          SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Header
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Olá, $handle 👋',
                            style: TextStyle(
                              fontSize: 24,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                              letterSpacing: -0.5,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Seu workspace está atualizado',
                            style: TextStyle(
                              fontSize: 14,
                              color: Colors.grey[400],
                            ),
                          ),
                        ],
                      ),
                      Container(
                        decoration: BoxDecoration(
                          color: const Color(0xFF1B113B),
                          shape: BoxShape.circle,
                          border: Border.all(color: InflunextTheme.brandAccent.withValues(alpha: 0.4), width: 1.5),
                        ),
                        child: const CircleAvatar(
                          radius: 24,
                          backgroundColor: Colors.transparent,
                          child: Icon(Icons.person_rounded, color: InflunextTheme.brandLight, size: 28),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 32),

                  // Earning / Performance Dashboard Card
                  Container(
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF1B1240), Color(0xFF281861)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: const Color(0xFF3B2880), width: 1.5),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'SALDO ESTIMADO',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: InflunextTheme.brandLight,
                            letterSpacing: 1.2,
                          ),
                        ),
                        const SizedBox(height: 12),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              balanceStr,
                              style: const TextStyle(
                                fontSize: 32,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                              decoration: BoxDecoration(
                                color: InflunextTheme.success.withValues(alpha: 0.2),
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Row(
                                children: [
                                  Icon(
                                    growthPct >= 0 ? Icons.trending_up : Icons.trending_down,
                                    color: growthPct >= 0 ? InflunextTheme.success : Colors.redAccent,
                                    size: 16,
                                  ),
                                  const SizedBox(width: 4),
                                  Text(
                                    growthStr,
                                    style: TextStyle(
                                      color: growthPct >= 0 ? InflunextTheme.success : Colors.redAccent,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 12,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 20),
                        Divider(color: Colors.white.withValues(alpha: 0.1)),
                        const SizedBox(height: 16),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            _buildMiniMetric('Campanhas', '$activeCampaigns Ativas'),
                            _buildMiniMetric('Alcance total', '248.5K'),
                            _buildMiniMetric('Recebidos', '$pendingCount A caminho'),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 32),

                  // Section Title
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Campanhas Ativas',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                          letterSpacing: -0.2,
                        ),
                      ),
                      TextButton(
                        onPressed: () {},
                        child: const Text(
                          'Ver tudo',
                          style: TextStyle(color: InflunextTheme.brandLight),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Campaign list
                  _buildCampaignCard(
                    title: 'Lançamento AirMax Dn',
                    brand: 'Nike Brasil',
                    earnings: 'R\$ 5.200,00',
                    progress: 0.75,
                    statusText: 'Post pendente',
                    statusColor: InflunextTheme.warning,
                  ),
                  const SizedBox(height: 16),
                  _buildCampaignCard(
                    title: 'Campanha Creators ANC',
                    brand: 'Sony Audio',
                    earnings: 'R\$ 3.800,00',
                    progress: 0.20,
                    statusText: 'Briefing aprovado',
                    statusColor: InflunextTheme.brandAccent,
                  ),
                  const SizedBox(height: 16),
                  _buildCampaignCard(
                    title: 'Dia dos Namorados Malbec',
                    brand: 'O Boticário',
                    earnings: 'R\$ 6.500,00',
                    progress: 1.00,
                    statusText: 'Finalizada',
                    statusColor: InflunextTheme.success,
                  ),
                  const SizedBox(height: 90),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMiniMetric(String title, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: const TextStyle(fontSize: 12, color: InflunextTheme.textMuted),
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.white),
        ),
      ],
    );
  }

  Widget _buildCampaignCard({
    required String title,
    required String brand,
    required String earnings,
    required double progress,
    required String statusText,
    required Color statusColor,
  }) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: InflunextTheme.cardBg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF251E44), width: 1.2),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    brand,
                    style: const TextStyle(fontSize: 13, color: InflunextTheme.textMuted),
                  ),
                ],
              ),
              Text(
                earnings,
                style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.white),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: progress,
                    minHeight: 6,
                    backgroundColor: const Color(0xFF1C1338),
                    valueColor: AlwaysStoppedAnimation<Color>(
                      progress == 1.0 ? InflunextTheme.success : InflunextTheme.brandAccent,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 16),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  statusText,
                  style: TextStyle(
                    color: statusColor,
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
