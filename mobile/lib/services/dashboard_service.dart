import 'api_service.dart';

/// Dados do dashboard do influenciador vindo da API.
class DashboardData {
  final double estimatedBalance;
  final double balanceGrowthPct;
  final int activeCampaigns;
  final int pendingRecebidos;
  final int influScore;
  final String scoreClass;
  final String handle;
  final String niche;
  final List<ContractSummary> contracts;
  final List<RecebidoSummary> recebidos;

  const DashboardData({
    required this.estimatedBalance,
    required this.balanceGrowthPct,
    required this.activeCampaigns,
    required this.pendingRecebidos,
    required this.influScore,
    required this.scoreClass,
    required this.handle,
    required this.niche,
    required this.contracts,
    required this.recebidos,
  });

  factory DashboardData.fromJson(Map<String, dynamic> json) {
    final profile = json['profile'] as Map<String, dynamic>? ?? {};
    final contractsRaw = (json['contracts'] as List<dynamic>?) ?? [];
    final recebidosRaw = (json['recebidos'] as List<dynamic>?) ?? [];

    // Calcula saldo estimado: soma dos contratos IN_PROGRESS e UNDER_REVIEW
    final double balance = contractsRaw
        .where((c) => ['IN_PROGRESS', 'UNDER_REVIEW'].contains(c['status']))
        .fold(0.0, (sum, c) => sum + (c['budget'] as num? ?? 0).toDouble());

    final pending = recebidosRaw
        .where((r) => r['status'] != 'DELIVERED')
        .length;

    return DashboardData(
      estimatedBalance: balance,
      balanceGrowthPct: (profile['scoreGrowthPct'] as num?)?.toDouble() ?? 0,
      activeCampaigns: contractsRaw
          .where((c) => c['status'] == 'IN_PROGRESS')
          .length,
      pendingRecebidos: pending,
      influScore: (profile['influScore'] as num?)?.toInt() ?? 0,
      scoreClass: profile['scoreClass']?.toString() ?? 'BRONZE',
      handle: profile['handle']?.toString() ?? '',
      niche: profile['niche']?.toString() ?? '',
      contracts: contractsRaw
          .map((c) => ContractSummary.fromJson(c as Map<String, dynamic>))
          .toList(),
      recebidos: recebidosRaw
          .map((r) => RecebidoSummary.fromJson(r as Map<String, dynamic>))
          .toList(),
    );
  }

  /// Retorna uma versão com dados de demonstração (quando API falha).
  static DashboardData demo() => DashboardData(
        estimatedBalance: 14850,
        balanceGrowthPct: 12.5,
        activeCampaigns: 4,
        pendingRecebidos: 2,
        influScore: 78,
        scoreClass: 'SILVER',
        handle: 'alexsandro_creator',
        niche: 'Lifestyle',
        contracts: [],
        recebidos: [],
      );
}

class ContractSummary {
  final String id;
  final String title;
  final String brandName;
  final double budget;
  final String status;
  final double progress;

  const ContractSummary({
    required this.id,
    required this.title,
    required this.brandName,
    required this.budget,
    required this.status,
    required this.progress,
  });

  factory ContractSummary.fromJson(Map<String, dynamic> json) {
    return ContractSummary(
      id: json['id']?.toString() ?? '',
      title: json['title']?.toString() ?? 'Sem título',
      brandName: json['company']?['companyName']?.toString() ?? 'Marca',
      budget: (json['budget'] as num?)?.toDouble() ?? 0,
      status: json['status']?.toString() ?? 'DRAFT',
      progress: _statusToProgress(json['status']?.toString()),
    );
  }

  static double _statusToProgress(String? status) {
    switch (status) {
      case 'PENDING_PAYMENT': return 0.1;
      case 'IN_PROGRESS': return 0.5;
      case 'UNDER_REVIEW': return 0.8;
      case 'COMPLETED': return 1.0;
      default: return 0.0;
    }
  }

  String get statusLabel {
    switch (status) {
      case 'DRAFT': return 'Rascunho';
      case 'PENDING_PAYMENT': return 'Aguardando pagamento';
      case 'IN_PROGRESS': return 'Em andamento';
      case 'UNDER_REVIEW': return 'Em revisão';
      case 'COMPLETED': return 'Finalizado';
      case 'DISPUTE': return 'Em disputa';
      default: return status;
    }
  }
}

class RecebidoSummary {
  final String id;
  final String title;
  final String brandName;
  final String status;
  final String? trackingCode;
  final String? carrier;
  final String? estimatedDelivery;

  const RecebidoSummary({
    required this.id,
    required this.title,
    required this.brandName,
    required this.status,
    this.trackingCode,
    this.carrier,
    this.estimatedDelivery,
  });

  factory RecebidoSummary.fromJson(Map<String, dynamic> json) {
    return RecebidoSummary(
      id: json['id']?.toString() ?? '',
      title: json['productName']?.toString() ?? 'Kit sem nome',
      brandName: json['brandName']?.toString() ?? 'Marca',
      status: json['status']?.toString() ?? 'PENDING',
      trackingCode: json['trackingCode']?.toString(),
      carrier: json['carrier']?.toString(),
      estimatedDelivery: json['estimatedDelivery']?.toString(),
    );
  }

  String get statusLabel {
    switch (status) {
      case 'PENDING': return 'Aguardando Postagem';
      case 'SHIPPED': return 'Em Trânsito';
      case 'DELIVERED': return 'Entregue';
      case 'RETURNED': return 'Devolvido';
      default: return status;
    }
  }
}

/// Serviço de dados do dashboard — busca da API real com fallback para mock.
class DashboardService {
  /// Carrega dados do dashboard do influenciador autenticado.
  /// Em caso de erro de rede, retorna [DashboardData.demo()].
  static Future<DashboardData> loadDashboard() async {
    try {
      // Busca perfil + contratos + recebidos em paralelo
      final results = await Future.wait([
        ApiService.get('/dashboard'),
        ApiService.get('/recebidos'),
      ]);

      final dashboardJson = results[0];
      final recebidosJson = results[1];

      // Mescla os recebidos reais dentro do JSON do dashboard para o parser
      final merged = {
        ...dashboardJson,
        'recebidos': recebidosJson['items'] ?? [],
      };

      return DashboardData.fromJson(merged);
    } on ApiException catch (e) {
      if (e.statusCode == 401) rethrow; // Deixa 401 propagar para forçar logout
      return DashboardData.demo();
    } catch (_) {
      return DashboardData.demo();
    }
  }
}
