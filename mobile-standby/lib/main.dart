import 'package:flutter/material.dart';
import 'theme.dart';
import 'screens/pwa_webview_screen.dart';
import 'services/notification_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Inicialização assíncrona/defensiva do serviço de push notifications
  final notifService = NotificationService();
  await notifService.initialize();

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
