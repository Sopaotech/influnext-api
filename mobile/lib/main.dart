import 'package:flutter/material.dart';
import 'theme.dart';
import 'screens/pwa_webview_screen.dart';

void main() {
  runApp(const InflunextApp());
}

class InflunextApp extends StatelessWidget {
  const InflunextApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Influnext Mobile',
      debugShowCheckedModeBanner: false,
      theme: InflunextTheme.darkTheme,
      home: const PwaWebViewScreen(),
    );
  }
}
