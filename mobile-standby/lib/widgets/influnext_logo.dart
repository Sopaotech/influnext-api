import 'package:flutter/material.dart';

class InflunextLogoPainter extends CustomPainter {
  const InflunextLogoPainter();

  @override
  void paint(Canvas canvas, Size size) {
    final rect = Offset.zero & size;
    final gradient = const LinearGradient(
      colors: [
        Color(0xFF7C3AED), // #7c3aed (Purple)
        Color(0xFFEC4899), // #ec4899 (Pink)
      ],
      begin: Alignment.bottomLeft,
      end: Alignment.topRight,
    );

    final double scale = size.width / 32.0;

    // Define Paths based on SVG Q (quadratic Bezier) curves
    // Path 1 (outer): M5 27 Q5 7 16 7 Q27 7 27 27
    final path1 = Path()
      ..moveTo(5 * scale, 27 * scale)
      ..quadraticBezierTo(5 * scale, 7 * scale, 16 * scale, 7 * scale)
      ..quadraticBezierTo(27 * scale, 7 * scale, 27 * scale, 27 * scale);

    // Path 2 (middle): M9 27 Q9 12 16 12 Q23 12 23 27
    final path2 = Path()
      ..moveTo(9 * scale, 27 * scale)
      ..quadraticBezierTo(9 * scale, 12 * scale, 16 * scale, 12 * scale)
      ..quadraticBezierTo(23 * scale, 12 * scale, 23 * scale, 27 * scale);

    // Path 3 (inner): M13 27 Q13 17 16 17 Q19 17 19 27
    final path3 = Path()
      ..moveTo(13 * scale, 27 * scale)
      ..quadraticBezierTo(13 * scale, 17 * scale, 16 * scale, 17 * scale)
      ..quadraticBezierTo(19 * scale, 17 * scale, 19 * scale, 27 * scale);

    final paintArc = Paint()
      ..shader = gradient.createShader(rect)
      ..strokeWidth = 2.5 * scale
      ..strokeCap = StrokeCap.round
      ..style = PaintingStyle.stroke;

    // Draw Arc 1 (outer) with 0.35 opacity
    canvas.saveLayer(rect, Paint()..color = Colors.white.withValues(alpha: 0.35));
    canvas.drawPath(path1, paintArc);
    canvas.restore();

    // Draw Arc 2 (middle) with 0.65 opacity
    canvas.saveLayer(rect, Paint()..color = Colors.white.withValues(alpha: 0.65));
    canvas.drawPath(path2, paintArc);
    canvas.restore();

    // Draw Arc 3 (inner) with full opacity
    canvas.drawPath(path3, paintArc);

    // Draw base Dot: Circle at cx=16, cy=27.5, r=1.8
    final dotPaint = Paint()
      ..shader = gradient.createShader(rect)
      ..style = PaintingStyle.fill;
    canvas.drawCircle(Offset(16 * scale, 27.5 * scale), 1.8 * scale, dotPaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class InflunextLogo extends StatelessWidget {
  final double size;
  const InflunextLogo({super.key, this.size = 48.0});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: CustomPaint(
        painter: const InflunextLogoPainter(),
      ),
    );
  }
}
