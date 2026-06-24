import 'package:flutter/material.dart';
import '../theme.dart';

class SearchScreen extends StatelessWidget {
  const SearchScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final List<Map<String, String>> brands = [
      {'name': 'Nike Brasil', 'category': 'Esportes / Lifestyle', 'campaigns': '2 Campanhas ativas'},
      {'name': 'Sony Audio', 'category': 'Tecnologia / Música', 'campaigns': '1 Campanha ativa'},
      {'name': 'O Boticário', 'category': 'Beleza / Perfumaria', 'campaigns': '3 Campanhas ativas'},
      {'name': 'Adidas Group', 'category': 'Esportes / Moda', 'campaigns': '1 Campanha ativa'},
      {'name': 'Samsung Tech', 'category': 'Smartphones / Acessórios', 'campaigns': '4 Campanhas ativas'},
      {'name': 'RedBull BR', 'category': 'Bebidas / Eventos', 'campaigns': '2 Campanhas ativas'},
    ];

    return Scaffold(
      body: Stack(
        children: [
          Container(
            decoration: const BoxDecoration(gradient: InflunextTheme.bgGradient),
          ),
          SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Search Bar Title
                  const Text(
                    'Explorar Marcas',
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                      letterSpacing: -0.5,
                    ),
                  ),
                  const SizedBox(height: 16),
                  
                  // Search TextField
                  TextField(
                    decoration: InputDecoration(
                      hintText: 'Buscar marcas, nichos ou campanhas...',
                      prefixIcon: const Icon(Icons.search_rounded, color: InflunextTheme.textMuted),
                      suffixIcon: IconButton(
                        icon: const Icon(Icons.tune_rounded, color: InflunextTheme.brandLight),
                        onPressed: () {},
                      ),
                    ),
                  ),
                  const SizedBox(height: 28),

                  // Categories Horizontal List
                  const Text(
                    'Categorias Populares',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    height: 40,
                    child: ListView(
                      scrollDirection: Axis.horizontal,
                      children: [
                        _buildCategoryChip('Todos', isSelected: true),
                        _buildCategoryChip('Tecnologia'),
                        _buildCategoryChip('Moda'),
                        _buildCategoryChip('Esportes'),
                        _buildCategoryChip('Beleza'),
                        _buildCategoryChip('Gastronomia'),
                      ],
                    ),
                  ),
                  const SizedBox(height: 28),

                  // Brands List
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Marcas Recomendadas',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                      ),
                      TextButton(
                        onPressed: () {},
                        child: const Text('Ver mais', style: TextStyle(color: InflunextTheme.brandLight)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),

                  ListView.separated(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: brands.length,
                    separatorBuilder: (context, index) => const SizedBox(height: 14),
                    itemBuilder: (context, index) {
                      final brand = brands[index];
                      return Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: InflunextTheme.cardBg,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: const Color(0xFF251E44), width: 1.2),
                        ),
                        child: Row(
                          children: [
                            CircleAvatar(
                              radius: 24,
                              backgroundColor: const Color(0xFF1F183C),
                              child: Text(
                                brand['name']![0],
                                style: const TextStyle(
                                  color: InflunextTheme.brandLight,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 18,
                                ),
                              ),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    brand['name']!,
                                    style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                      color: Colors.white,
                                      fontSize: 15,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    brand['category']!,
                                    style: const TextStyle(color: InflunextTheme.textMuted, fontSize: 12),
                                  ),
                                ],
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                              decoration: BoxDecoration(
                                color: InflunextTheme.brandAccent.withValues(alpha: 0.15),
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Text(
                                brand['campaigns']!,
                                style: const TextStyle(
                                  color: InflunextTheme.brandLight,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 11,
                                ),
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                  const SizedBox(height: 80), // extra padding for bottom navigation bar
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCategoryChip(String label, {bool isSelected = false}) {
    return Container(
      margin: const EdgeInsets.only(right: 10),
      child: ChoiceChip(
        label: Text(label),
        selected: isSelected,
        selectedColor: InflunextTheme.brandAccent,
        backgroundColor: InflunextTheme.cardBg,
        labelStyle: TextStyle(
          color: isSelected ? Colors.white : InflunextTheme.textMuted,
          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: BorderSide(
            color: isSelected ? Colors.transparent : const Color(0xFF2E2452),
          ),
        ),
        onSelected: (val) {},
      ),
    );
  }
}
