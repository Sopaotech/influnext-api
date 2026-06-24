import 'package:flutter/material.dart';
import 'home_screen.dart';
import 'recebidos_screen.dart';
import 'profile_screen.dart';
import 'reels_screen.dart';
import 'search_screen.dart';
import '../theme.dart';
import '../services/dashboard_service.dart';
import '../services/api_service.dart';

class MainLayout extends StatefulWidget {
  const MainLayout({super.key});

  @override
  State<MainLayout> createState() => _MainLayoutState();
}

class _MainLayoutState extends State<MainLayout> {
  int _currentIndex = 0;
  bool _isLoading = true;

  // ─── Estado compartilhado (preenchido pela API) ──────────────────────────────
  String _shippingAddress = '';
  String _poBox = '';
  bool _shareAddress = true;
  List<Map<String, dynamic>> _recebidos = [];
  DashboardData? _dashboardData;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  /// Carrega dados reais da API. Fallback automático para mock se offline.
  Future<void> _loadData() async {
    try {
      final data = await DashboardService.loadDashboard();
      if (!mounted) return;
      setState(() {
        _dashboardData = data;
        _recebidos = data.recebidos
            .map((r) => {
                  'id': r.id,
                  'title': r.title,
                  'brandName': r.brandName,
                  'brandColor': const Color(0xFF7F77DD),
                  'items': <String>[],
                  'carrier': r.carrier ?? 'A informar',
                  'trackingCode': r.trackingCode ?? '—',
                  'status': r.statusLabel,
                  'sentDate': '—',
                  'estimatedDelivery': r.estimatedDelivery ?? 'A definir',
                  'history': <Map<String, String>>[],
                })
            .toList();
        if (_recebidos.isEmpty) _recebidos = _mockRecebidos();
        _isLoading = false;
      });
    } on ApiException catch (e) {
      if (e.statusCode == 401 && mounted) {
        await ApiService.clearToken();
        if (!mounted) return;
        Navigator.of(context).pushReplacementNamed('/login');
        return;
      }
      _useMockData();
    } catch (_) {
      _useMockData();
    }
  }

  void _useMockData() {
    if (!mounted) return;
    setState(() {
      _dashboardData = DashboardData.demo();
      _recebidos = _mockRecebidos();
      _isLoading = false;
    });
  }

  List<Map<String, dynamic>> _mockRecebidos() => [
        {
          'id': 'rec_1',
          'title': 'Presskit Headphone Pro ANC',
          'brandName': 'Sony Brasil',
          'brandColor': const Color(0xFF1F51FF),
          'items': ['Headphone WH-1000XM5', 'Case Rígida Premium', 'Cabo Type-C'],
          'carrier': 'DHL Express',
          'trackingCode': 'DHL987654321BR',
          'status': 'Em Trânsito',
          'sentDate': '14/06/2026',
          'estimatedDelivery': '19/06/2026',
          'history': [
            {'date': '15/06/2026 14:30', 'title': 'Em trânsito para São Paulo', 'desc': 'Objeto encaminhado para unidade de tratamento.'},
            {'date': '14/06/2026 09:15', 'title': 'Objeto Postado', 'desc': 'Coletado pela transportadora DHL no hub central.'},
          ]
        },
        {
          'id': 'rec_2',
          'title': 'Kit Vestuário Inverno 2026',
          'brandName': 'Nike Sportswear',
          'brandColor': const Color(0xFFE52521),
          'items': ['Corta-Vento Shield', 'Calça Tech Fleece', 'Tênis Air Max Dn'],
          'carrier': 'FedEx',
          'trackingCode': 'FDX334455667BR',
          'status': 'Aguardando Postagem',
          'sentDate': 'Pendente',
          'estimatedDelivery': 'A definir',
          'history': [
            {'date': '16/06/2026 08:00', 'title': 'Solicitação de Envio Criada', 'desc': 'A marca gerou a etiqueta de postagem.'},
          ]
        },
        {
          'id': 'rec_3',
          'title': 'Presskit Perfumaria Exclusiva',
          'brandName': 'Boticário',
          'brandColor': const Color(0xFF1D9E75),
          'items': ['Perfume Malbec Ultra', 'Loção Pós Barba Pro', 'Necessaire Couro'],
          'carrier': 'Correios (Sedex)',
          'trackingCode': 'SL987654321BR',
          'status': 'Entregue',
          'sentDate': '10/06/2026',
          'estimatedDelivery': '13/06/2026',
          'history': [
            {'date': '13/06/2026 16:40', 'title': 'Entregue ao Destinatário', 'desc': 'Entregue na portaria.'},
            {'date': '12/06/2026 11:20', 'title': 'Saiu para entrega', 'desc': 'Objeto saiu para entrega.'},
          ]
        },
      ];

  void _updateShippingSettings(String address, String poBox, bool share) {
    setState(() {
      _shippingAddress = address;
      _poBox = poBox;
      _shareAddress = share;
    });
    _saveShippingToApi(address, poBox, share);
  }

  Future<void> _saveShippingToApi(String address, String poBox, bool share) async {
    try {
      await ApiService.patch('/influencer/shipping', {
        'shippingAddress': address,
        'poBox': poBox,
        'shareAddress': share,
      });
    } catch (_) {
      // Silencioso — estado local já foi salvo
    }
  }

  void _markAsReceived(String id) {
    setState(() {
      final index = _recebidos.indexWhere((e) => e['id'] == id);
      if (index != -1) {
        _recebidos[index]['status'] = 'Entregue';
        final history = List<Map<String, String>>.from(_recebidos[index]['history']);
        history.insert(0, {
          'date': 'Hoje, agora',
          'title': 'Confirmado pelo Influenciador',
          'desc': 'Você confirmou o recebimento físico via aplicativo!'
        });
        _recebidos[index]['history'] = history;
      }
    });
    _confirmReceivedApi(id);
  }

  Future<void> _confirmReceivedApi(String id) async {
    try {
      await ApiService.patch('/recebidos/$id/confirm', {});
    } catch (_) {
      // Silencioso
    }
  }

  Widget _buildNavItem(int index,
      {required IconData activeIcon,
      required IconData inactiveIcon,
      bool hasDot = false,
      bool isAvatar = false}) {
    final isSelected = _currentIndex == index;
    return GestureDetector(
      onTap: () => setState(() => _currentIndex = index),
      behavior: HitTestBehavior.opaque,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? Colors.white.withValues(alpha: 0.08) : Colors.transparent,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Stack(
          clipBehavior: Clip.none,
          children: [
            isAvatar
                ? Container(
                    width: 24,
                    height: 24,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: isSelected ? InflunextTheme.brandLight : Colors.transparent,
                        width: 1.5,
                      ),
                      color: const Color(0xFF1B113B),
                    ),
                    child: const Icon(Icons.person_rounded, size: 16, color: InflunextTheme.brandLight),
                  )
                : Icon(
                    isSelected ? activeIcon : inactiveIcon,
                    color: isSelected ? Colors.white : InflunextTheme.textMuted,
                    size: 24,
                  ),
            if (hasDot && index == 2 && _recebidos.any((p) => p['status'] != 'Entregue'))
              Positioned(
                right: -2,
                top: -2,
                child: Container(
                  width: 8,
                  height: 8,
                  decoration: const BoxDecoration(color: Colors.redAccent, shape: BoxShape.circle),
                ),
              ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        body: Container(
          decoration: const BoxDecoration(gradient: InflunextTheme.bgGradient),
          child: const Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                CircularProgressIndicator(color: InflunextTheme.brandAccent),
                SizedBox(height: 16),
                Text('Carregando seu dashboard...', style: TextStyle(color: InflunextTheme.textMuted, fontSize: 14)),
              ],
            ),
          ),
        ),
      );
    }

    final List<Widget> screens = [
      HomeScreen(recebidos: _recebidos, dashboardData: _dashboardData),
      const ReelsScreen(),
      RecebidosScreen(
        recebidos: _recebidos,
        onMarkAsReceived: _markAsReceived,
        shareAddress: _shareAddress,
        shippingAddress: _poBox.isNotEmpty && !_shareAddress ? _poBox : _shippingAddress,
      ),
      const SearchScreen(),
      ProfileScreen(
        shippingAddress: _shippingAddress,
        poBox: _poBox,
        shareAddress: _shareAddress,
        onSave: _updateShippingSettings,
      ),
    ];

    return Scaffold(
      extendBody: true,
      body: IndexedStack(index: _currentIndex, children: screens),
      bottomNavigationBar: SafeArea(
        child: Container(
          margin: const EdgeInsets.only(bottom: 16, left: 24, right: 24),
          height: 64,
          decoration: BoxDecoration(
            color: const Color(0xFF0F0F12),
            borderRadius: BorderRadius.circular(32),
            border: Border.all(color: Colors.white.withValues(alpha: 0.08), width: 1.2),
            boxShadow: [
              BoxShadow(color: Colors.black.withValues(alpha: 0.4), blurRadius: 16, offset: const Offset(0, 8)),
            ],
          ),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8.0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildNavItem(0, activeIcon: Icons.home_rounded, inactiveIcon: Icons.home_outlined),
                _buildNavItem(1, activeIcon: Icons.play_circle_fill_rounded, inactiveIcon: Icons.play_circle_outline_rounded),
                _buildNavItem(2, activeIcon: Icons.near_me_rounded, inactiveIcon: Icons.near_me_outlined, hasDot: true),
                _buildNavItem(3, activeIcon: Icons.search_rounded, inactiveIcon: Icons.search_rounded),
                _buildNavItem(4, activeIcon: Icons.person_rounded, inactiveIcon: Icons.person_outline_rounded, isAvatar: true),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
