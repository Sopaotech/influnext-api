import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../theme.dart';

class RecebidosScreen extends StatefulWidget {
  final List<Map<String, dynamic>> recebidos;
  final Function(String) onMarkAsReceived;
  final bool shareAddress;
  final String shippingAddress;

  const RecebidosScreen({
    super.key,
    required this.recebidos,
    required this.onMarkAsReceived,
    required this.shareAddress,
    required this.shippingAddress,
  });

  @override
  State<RecebidosScreen> createState() => _RecebidosScreenState();
}

class _RecebidosScreenState extends State<RecebidosScreen> {
  String _searchQuery = '';

  Color _getStatusColor(String status) {
    switch (status) {
      case 'Entregue':
        return InflunextTheme.success;
      case 'Em Trânsito':
        return InflunextTheme.brandAccent;
      case 'Aguardando Postagem':
      default:
        return InflunextTheme.warning;
    }
  }

  void _showDetails(BuildContext context, Map<String, dynamic> pacote) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            // Re-fetch package status inside modal in case it changes
            final currentPkg = widget.recebidos.firstWhere((p) => p['id'] == pacote['id']);
            final String status = currentPkg['status'];
            final List<dynamic> history = currentPkg['history'];

            return DraggableScrollableSheet(
              initialChildSize: 0.85,
              minChildSize: 0.5,
              maxChildSize: 0.95,
              builder: (context, scrollController) {
                return Container(
                  decoration: const BoxDecoration(
                    color: Color(0xFF0F0A29),
                    borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
                    boxShadow: [BoxShadow(color: Colors.black54, blurRadius: 20, spreadRadius: 5)],
                  ),
                  child: Column(
                    children: [
                      // Pull drag indicator
                      Center(
                        child: Container(
                          margin: const EdgeInsets.only(top: 12, bottom: 20),
                          width: 40,
                          height: 5,
                          decoration: BoxDecoration(
                            color: Colors.white24,
                            borderRadius: BorderRadius.circular(10),
                          ),
                        ),
                      ),
                      Expanded(
                        child: ListView(
                          controller: scrollController,
                          padding: const EdgeInsets.symmetric(horizontal: 24),
                          children: [
                            // Header Info
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                  decoration: BoxDecoration(
                                    color: (pacote['brandColor'] as Color).withValues(alpha: 0.15),
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(color: (pacote['brandColor'] as Color).withValues(alpha: 0.3)),
                                  ),
                                  child: Text(
                                    pacote['brandName'],
                                    style: TextStyle(
                                      color: pacote['brandColor'],
                                      fontWeight: FontWeight.bold,
                                      fontSize: 12,
                                    ),
                                  ),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                  decoration: BoxDecoration(
                                    color: _getStatusColor(status).withValues(alpha: 0.15),
                                    borderRadius: BorderRadius.circular(30),
                                  ),
                                  child: Text(
                                    status,
                                    style: TextStyle(
                                      color: _getStatusColor(status),
                                      fontWeight: FontWeight.bold,
                                      fontSize: 11,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),
                            Text(
                              pacote['title'],
                              style: const TextStyle(
                                fontSize: 22,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                              ),
                            ),
                            const SizedBox(height: 24),

                            // Items Card
                            _buildSectionTitle('Itens inclusos no pacote'),
                            const SizedBox(height: 8),
                            Container(
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: const Color(0xFF160E36),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: const Color(0xFF2E2452)),
                              ),
                              child: Column(
                                children: (pacote['items'] as List<String>).map((item) {
                                  return Padding(
                                    padding: const EdgeInsets.symmetric(vertical: 6.0),
                                    child: Row(
                                      children: [
                                        const Icon(Icons.check_circle_outline, color: InflunextTheme.brandLight, size: 18),
                                        const SizedBox(width: 12),
                                        Expanded(
                                          child: Text(
                                            item,
                                            style: const TextStyle(color: Colors.white, fontSize: 14),
                                          ),
                                        ),
                                      ],
                                    ),
                                  );
                                }).toList(),
                              ),
                            ),
                            const SizedBox(height: 24),

                            // Shipping Info
                            _buildSectionTitle('Informações de Envio'),
                            const SizedBox(height: 8),
                            Container(
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: const Color(0xFF160E36),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: const Color(0xFF2E2452)),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  _buildShippingInfoRow('Transportadora', pacote['carrier']),
                                  const Divider(color: Colors.white12, height: 20),
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          const Text('Código de Rastreamento', style: TextStyle(color: InflunextTheme.textMuted, fontSize: 12)),
                                          const SizedBox(height: 4),
                                          Text(pacote['trackingCode'], style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                                        ],
                                      ),
                                      IconButton(
                                        icon: const Icon(Icons.copy_rounded, color: InflunextTheme.brandLight, size: 20),
                                        onPressed: () {
                                          Clipboard.setData(ClipboardData(text: pacote['trackingCode']));
                                          ScaffoldMessenger.of(context).showSnackBar(
                                            const SnackBar(
                                              content: Text('Código de rastreamento copiado!'),
                                              duration: Duration(seconds: 1),
                                            ),
                                          );
                                        },
                                      ),
                                    ],
                                  ),
                                  const Divider(color: Colors.white12, height: 20),
                                  _buildShippingInfoRow('Previsão de Entrega', pacote['estimatedDelivery']),
                                  const Divider(color: Colors.white12, height: 20),
                                  Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      const Text('Endereço de Destino', style: TextStyle(color: InflunextTheme.textMuted, fontSize: 12)),
                                      const SizedBox(height: 6),
                                      Text(
                                        widget.shippingAddress,
                                        style: const TextStyle(color: Colors.white, fontSize: 13, height: 1.3),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 24),

                            // Tracking Timeline
                            _buildSectionTitle('Linha do Tempo de Rastreamento'),
                            const SizedBox(height: 12),
                            ...history.map((step) {
                              final int index = history.indexOf(step);
                              return Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Column(
                                    children: [
                                      Container(
                                        width: 14,
                                        height: 14,
                                        decoration: BoxDecoration(
                                          shape: BoxShape.circle,
                                          color: index == 0 ? _getStatusColor(status) : const Color(0xFF2E2452),
                                          border: Border.all(color: Colors.white10, width: 2),
                                        ),
                                      ),
                                      if (index != history.length - 1)
                                        Container(
                                          width: 2,
                                          height: 50,
                                          color: const Color(0xFF2E2452),
                                        ),
                                    ],
                                  ),
                                  const SizedBox(width: 16),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          step['title']!,
                                          style: TextStyle(
                                            color: index == 0 ? Colors.white : Colors.white70,
                                            fontWeight: index == 0 ? FontWeight.bold : FontWeight.normal,
                                            fontSize: 14,
                                          ),
                                        ),
                                        const SizedBox(height: 2),
                                        Text(
                                          step['desc']!,
                                          style: const TextStyle(color: InflunextTheme.textMuted, fontSize: 12),
                                        ),
                                        const SizedBox(height: 4),
                                        Text(
                                          step['date']!,
                                          style: TextStyle(color: Colors.grey[600], fontSize: 10),
                                        ),
                                        const SizedBox(height: 16),
                                      ],
                                    ),
                                  ),
                                ],
                              );
                            }),
                            const SizedBox(height: 24),

                            // Interactive Confirmation Button
                            if (status != 'Entregue' && status != 'Aguardando Postagem')
                              Padding(
                                padding: const EdgeInsets.only(bottom: 24.0),
                                child: Container(
                                  height: 54,
                                  decoration: BoxDecoration(
                                    gradient: const LinearGradient(
                                      colors: [InflunextTheme.success, Color(0xFF137052)],
                                      begin: Alignment.topLeft,
                                      end: Alignment.bottomRight,
                                    ),
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: ElevatedButton(
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: Colors.transparent,
                                      shadowColor: Colors.transparent,
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                    ),
                                    onPressed: () {
                                      widget.onMarkAsReceived(pacote['id']);
                                      setModalState(() {
                                        // Update local state within bottom sheet dialog instantly
                                      });
                                    },
                                    child: const Row(
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      children: [
                                        Icon(Icons.check_circle, color: Colors.white, size: 20),
                                        SizedBox(width: 10),
                                        Text(
                                          'Marcar como Recebido',
                                          style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.white),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ),
                          ],
                        ),
                      ),
                    ],
                  ),
                );
              },
            );
          },
        );
      },
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: const TextStyle(
        fontSize: 15,
        fontWeight: FontWeight.bold,
        color: InflunextTheme.brandLight,
        letterSpacing: 0.5,
      ),
    );
  }

  Widget _buildShippingInfoRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(color: InflunextTheme.textMuted, fontSize: 13)),
        Text(value, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final filteredRecebidos = widget.recebidos.where((item) {
      final title = item['title'].toString().toLowerCase();
      final brand = item['brandName'].toString().toLowerCase();
      final query = _searchQuery.toLowerCase();
      return title.contains(query) || brand.contains(query);
    }).toList();

    return Scaffold(
      body: Stack(
        children: [
          // Background Gradient
          Container(
            decoration: const BoxDecoration(gradient: InflunextTheme.bgGradient),
          ),
          SafeArea(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Top header
                Padding(
                  padding: const EdgeInsets.fromLTRB(24, 24, 24, 8),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Recebidos 🎁',
                        style: TextStyle(
                          fontSize: 26,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                          letterSpacing: -0.5,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'Acompanhe e confirme o envio de mimos das marcas',
                        style: TextStyle(color: Colors.grey[400], fontSize: 13),
                      ),
                    ],
                  ),
                ),
                // Search Input
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                  child: TextField(
                    onChanged: (val) {
                      setState(() {
                        _searchQuery = val;
                      });
                    },
                    decoration: const InputDecoration(
                      hintText: 'Buscar recebidos ou marcas...',
                      prefixIcon: Icon(Icons.search_rounded, color: InflunextTheme.textMuted),
                    ),
                  ),
                ),
                // List of packages
                Expanded(
                  child: filteredRecebidos.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.card_giftcard_outlined, size: 48, color: Colors.grey[600]),
                              const SizedBox(height: 16),
                              const Text(
                                'Nenhum recebido encontrado',
                                style: TextStyle(color: InflunextTheme.textMuted, fontSize: 14),
                              ),
                            ],
                          ),
                        )
                      : RefreshIndicator(
                          color: InflunextTheme.brandAccent,
                          backgroundColor: const Color(0xFF160E36),
                          onRefresh: () async {
                            await Future.delayed(const Duration(seconds: 1));
                          },
                          child: ListView.builder(
                            padding: const EdgeInsets.fromLTRB(24, 8, 24, 100),
                            itemCount: filteredRecebidos.length,
                            itemBuilder: (context, index) {
                              final item = filteredRecebidos[index];
                              final String status = item['status'];
                              final Color statusColor = _getStatusColor(status);

                              return Container(
                                margin: const EdgeInsets.only(bottom: 16),
                                decoration: BoxDecoration(
                                  color: InflunextTheme.cardBg,
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(color: const Color(0xFF251E44), width: 1.2),
                                ),
                                child: InkWell(
                                  borderRadius: BorderRadius.circular(16),
                                  onTap: () => _showDetails(context, item),
                                  child: Padding(
                                    padding: const EdgeInsets.all(20),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Row(
                                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                          children: [
                                            Text(
                                              item['brandName'],
                                              style: TextStyle(
                                                color: item['brandColor'],
                                                fontSize: 12,
                                                fontWeight: FontWeight.bold,
                                                letterSpacing: 0.5,
                                              ),
                                            ),
                                            Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                              decoration: BoxDecoration(
                                                color: statusColor.withValues(alpha: 0.15),
                                                borderRadius: BorderRadius.circular(12),
                                              ),
                                              child: Text(
                                                status,
                                                style: TextStyle(
                                                  color: statusColor,
                                                  fontSize: 10,
                                                  fontWeight: FontWeight.bold,
                                                ),
                                              ),
                                            ),
                                          ],
                                        ),
                                        const SizedBox(height: 10),
                                        Text(
                                          item['title'],
                                          style: const TextStyle(
                                            fontSize: 16,
                                            fontWeight: FontWeight.bold,
                                            color: Colors.white,
                                          ),
                                        ),
                                        const SizedBox(height: 12),
                                        Row(
                                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                          children: [
                                            Row(
                                              children: [
                                                const Icon(Icons.local_shipping_outlined, color: InflunextTheme.textMuted, size: 16),
                                                const SizedBox(width: 6),
                                                Text(
                                                  item['carrier'],
                                                  style: const TextStyle(color: InflunextTheme.textMuted, fontSize: 12),
                                                ),
                                              ],
                                            ),
                                            const Row(
                                              children: [
                                                Text(
                                                  'Ver detalhes',
                                                  style: TextStyle(color: InflunextTheme.brandLight, fontSize: 12, fontWeight: FontWeight.bold),
                                                ),
                                                SizedBox(width: 4),
                                                Icon(Icons.arrow_forward_ios_rounded, color: InflunextTheme.brandLight, size: 10),
                                              ],
                                            ),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              );
                            },
                          ),
                        ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
