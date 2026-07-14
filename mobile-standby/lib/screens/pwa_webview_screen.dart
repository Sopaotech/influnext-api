import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:flutter/foundation.dart';
import '../services/notification_service.dart';
import '../services/api_service.dart';

class PwaWebViewScreen extends StatefulWidget {
  const PwaWebViewScreen({super.key});

  @override
  State<PwaWebViewScreen> createState() => _PwaWebViewScreenState();
}

class _PwaWebViewScreenState extends State<PwaWebViewScreen> {
  late final WebViewController _controller;
  bool _isLoading = true;
  double _progress = 0.0;

  @override
  void initState() {
    super.initState();
    
    // Configura a URL do PWA: em desenvolvimento local usa o host do emulador (10.0.2.2) na porta 3000
    const envUrl = String.fromEnvironment('PWA_URL');
    final String targetUrl;
    if (envUrl.isNotEmpty) {
      targetUrl = envUrl;
    } else {
      targetUrl = kDebugMode ? 'http://10.0.2.2:3000' : 'https://influnext.com.br';
    }

    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1 InfluNextMobile/1.0')
      ..setBackgroundColor(const Color(0xFF0A0A0F)) // Fundo combinando com o tema dark
      ..setNavigationDelegate(
        NavigationDelegate(
          onProgress: (int progress) {
            setState(() {
              _progress = progress / 100;
            });
          },
          onPageStarted: (String url) {
            setState(() {
              _isLoading = true;
            });
          },
          onPageFinished: (String url) async {
            setState(() {
              _isLoading = false;
            });
            
            try {
              final cookieManager = WebViewCookieManager();
              final cookies = await cookieManager.getCookies(Uri.parse(url));
              for (var cookie in cookies) {
                if (cookie.name == 'influnext_token') {
                  final jwtToken = cookie.value;
                  debugPrint('🔑 [WEBVIEW SESSION] Token de login detectado nos cookies.');
                  
                  // Salva o token localmente no app para requisições nativas
                  await ApiService.saveToken(jwtToken);
                  
                  // Sincroniza o token de push notifications (FCM) com o servidor
                  await NotificationService().syncToken(jwtToken);
                  break;
                }
              }
            } catch (e) {
              debugPrint('❌ [WEBVIEW SESSION] Erro ao buscar cookies: $e');
            }
          },
          onWebResourceError: (WebResourceError error) {
            debugPrint('Erro no WebView: ${error.description}');
          },
        ),
      )
      ..loadRequest(Uri.parse(targetUrl));
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (bool didPop, dynamic result) async {
        if (didPop) return;
        if (await _controller.canGoBack()) {
          await _controller.goBack();
        } else {
          // Se não há histórico para voltar no WebView, permite fechar o app/tela
          if (context.mounted) {
            Navigator.of(context).pop();
          }
        }
      },
      child: Scaffold(
        backgroundColor: const Color(0xFF0A0A0F),
        body: SafeArea(
          child: Stack(
            children: [
              WebViewWidget(controller: _controller),
              if (_isLoading)
                Positioned(
                  top: 0,
                  left: 0,
                  right: 0,
                  child: LinearProgressIndicator(
                    value: _progress > 0 ? _progress : null,
                    backgroundColor: Colors.transparent,
                    valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF7C3AED)),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
