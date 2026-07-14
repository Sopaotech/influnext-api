import 'package:flutter/material.dart';
import '../theme.dart';

class ProfileScreen extends StatefulWidget {
  final String shippingAddress;
  final String poBox;
  final bool shareAddress;
  final Function(String, String, bool) onSave;

  const ProfileScreen({
    super.key,
    required this.shippingAddress,
    required this.poBox,
    required this.shareAddress,
    required this.onSave,
  });

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  late TextEditingController _addressController;
  late TextEditingController _poBoxController;
  late bool _shareAddress;

  @override
  void initState() {
    super.initState();
    _addressController = TextEditingController(text: widget.shippingAddress);
    _poBoxController = TextEditingController(text: widget.poBox);
    _shareAddress = widget.shareAddress;
  }

  @override
  void dispose() {
    _addressController.dispose();
    _poBoxController.dispose();
    super.dispose();
  }

  void _handleSave() {
    widget.onSave(
      _addressController.text.trim(),
      _poBoxController.text.trim(),
      _shareAddress,
    );

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Row(
          children: [
            Icon(Icons.check_circle_rounded, color: InflunextTheme.success, size: 20),
            SizedBox(width: 10),
            Text('Configurações salvas com sucesso!'),
          ],
        ),
        backgroundColor: Color(0xFF160E36),
        duration: Duration(seconds: 2),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
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
                  // Profile Header Info
                  const Center(
                    child: Column(
                      children: [
                        SizedBox(height: 16),
                        CircleAvatar(
                          radius: 50,
                          backgroundColor: Color(0xFF1B113B),
                          child: Icon(Icons.person_rounded, color: InflunextTheme.brandLight, size: 54),
                        ),
                        SizedBox(height: 16),
                        Text(
                          'Alexsandro',
                          style: TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                        SizedBox(height: 4),
                        Text(
                          '@alexsandro_creator',
                          style: TextStyle(
                            fontSize: 14,
                            color: InflunextTheme.textMuted,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 36),

                  // Section Title
                  const Text(
                    'Configurações de Envio',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: InflunextTheme.brandLight,
                      letterSpacing: 0.5,
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Share Switch Card
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                    decoration: BoxDecoration(
                      color: InflunextTheme.cardBg,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFF251E44), width: 1.2),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Compartilhar endereço físico',
                                style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                _shareAddress 
                                  ? 'As marcas parceiras podem ver seu endereço.' 
                                  : 'As marcas verão apenas sua Caixa Postal.',
                                style: const TextStyle(color: InflunextTheme.textMuted, fontSize: 12),
                              ),
                            ],
                          ),
                        ),
                        Switch.adaptive(
                          value: _shareAddress,
                          activeThumbColor: InflunextTheme.brandLight,
                          activeTrackColor: InflunextTheme.brandAccent.withValues(alpha: 0.5),
                          onChanged: (val) {
                            setState(() {
                              _shareAddress = val;
                            });
                          },
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Address Input Fields
                  const Text(
                    'Endereço Físico Completo',
                    style: TextStyle(color: Colors.white70, fontWeight: FontWeight.w600, fontSize: 13),
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _addressController,
                    maxLines: 2,
                    decoration: const InputDecoration(
                      hintText: 'Rua, número, complemento, bairro, cidade, estado e CEP',
                    ),
                  ),
                  const SizedBox(height: 20),

                  // PO Box Input Fields
                  const Text(
                    'Caixa Postal (Opcional)',
                    style: TextStyle(color: Colors.white70, fontWeight: FontWeight.w600, fontSize: 13),
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _poBoxController,
                    decoration: const InputDecoration(
                      hintText: 'Caixa Postal e cidade/estado',
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Privacy explanation helper box
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFF1B1830),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Icon(Icons.info_outline_rounded, color: InflunextTheme.brandLight, size: 18),
                        SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            'Segurança: Seus dados de endereço só serão mostrados para marcas de campanhas ativas que você aprovou.',
                            style: TextStyle(color: InflunextTheme.textMuted, fontSize: 11, height: 1.4),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 36),

                  // Save Button
                  Container(
                    height: 52,
                    decoration: BoxDecoration(
                      gradient: InflunextTheme.primaryGradient,
                      borderRadius: BorderRadius.circular(12),
                      boxShadow: [
                        BoxShadow(
                          color: InflunextTheme.brandAccent.withValues(alpha: 0.25),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        )
                      ],
                    ),
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.transparent,
                        shadowColor: Colors.transparent,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      onPressed: _handleSave,
                      child: const Text(
                        'Salvar Configurações',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                      ),
                    ),
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
}
