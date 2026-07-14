import 'package:flutter/material.dart';
import '../theme.dart';

class ReelsScreen extends StatelessWidget {
  const ReelsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // Background Gradient representing a video preview
          Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [Color(0xFF0F0822), Color(0xFF1A093D), Color(0xFF070415)],
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
              ),
            ),
          ),
          
          // Simulated Video Content Center Play Icon overlay
          Center(
            child: Opacity(
              opacity: 0.15,
              child: Container(
                padding: const EdgeInsets.all(20),
                decoration: const BoxDecoration(
                  color: Colors.white,
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.play_arrow_rounded,
                  size: 80,
                  color: Colors.black,
                ),
              ),
            ),
          ),

          // Reels UI overlays
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Header
                  const Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Reels',
                        style: TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                      Icon(Icons.camera_alt_outlined, color: Colors.white),
                    ],
                  ),
                  const Spacer(),
                  
                  // Bottom Content and Right Actions Row
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      // Video info (Bottom-Left)
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Row(
                              children: [
                                const CircleAvatar(
                                  radius: 16,
                                  backgroundColor: Color(0xFF3B2880),
                                  child: Icon(Icons.person_rounded, size: 18, color: InflunextTheme.brandLight),
                                ),
                                const SizedBox(width: 10),
                                const Text(
                                  '@alexsandro_creator',
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    color: Colors.white,
                                    fontSize: 14,
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                  decoration: BoxDecoration(
                                    border: Border.all(color: Colors.white54),
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                  child: const Text(
                                    'Seguir',
                                    style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),
                            const Text(
                              'Recebi esse presskit incrível da Nike Brasil! O novo AirMax Dn é super confortável e o design futurista está sensacional. Logo mais sai review completo! 👟🔥 #publi #nikeairmax',
                              maxLines: 3,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(color: Colors.white, fontSize: 13, height: 1.4),
                            ),
                            const SizedBox(height: 12),
                            const Row(
                              children: [
                                Icon(Icons.music_note_rounded, size: 16, color: Colors.white),
                                SizedBox(width: 6),
                                Expanded(
                                  child: Text(
                                    'Som original • alexsandro_creator',
                                    style: TextStyle(color: Colors.white70, fontSize: 12),
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                      
                      const SizedBox(width: 16),

                      // Actions column (Bottom-Right)
                      Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          _buildActionButton(Icons.favorite_rounded, '12.4K', color: Colors.redAccent),
                          const SizedBox(height: 18),
                          _buildActionButton(Icons.mode_comment_rounded, '382'),
                          const SizedBox(height: 18),
                          _buildActionButton(Icons.near_me_rounded, '1.2K'),
                          const SizedBox(height: 18),
                          _buildActionButton(Icons.more_vert_rounded, ''),
                          const SizedBox(height: 18),
                          // Music disc rotate animation mock
                          Container(
                            width: 32,
                            height: 32,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              border: Border.all(color: Colors.white, width: 2),
                              color: Colors.black87,
                            ),
                            child: const Icon(Icons.music_note, size: 18, color: Colors.white),
                          ),
                        ],
                      ),
                    ],
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

  Widget _buildActionButton(IconData icon, String label, {Color color = Colors.white}) {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: Colors.black38,
            shape: BoxShape.circle,
            border: Border.all(color: Colors.white10),
          ),
          child: Icon(icon, color: color, size: 24),
        ),
        if (label.isNotEmpty) ...[
          const SizedBox(height: 4),
          Text(
            label,
            style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w600),
          ),
        ],
      ],
    );
  }
}
