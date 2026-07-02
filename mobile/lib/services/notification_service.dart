import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter/foundation.dart';
import 'api_service.dart';

/// Função top-level necessária para tratar mensagens em background
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  // Inicializa o Firebase se necessário para tarefas em segundo plano
  await Firebase.initializeApp();
  debugPrint("📩 [PUSH BACKGROUND] Mensagem recebida: ${message.notification?.title}");
}

class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  final FlutterLocalNotificationsPlugin _localNotifications = FlutterLocalNotificationsPlugin();
  bool _initialized = false;
  String? _fcmToken;

  /// Inicializa o Firebase e configura os canais de push notifications
  Future<void> initialize() async {
    if (_initialized) return;

    try {
      // Inicialização defensiva do Firebase.
      // Caso google-services.json/GoogleService-Info.plist não existam, o app não crasha.
      await Firebase.initializeApp();
      
      // Solicita permissão para notificações (iOS e Android 13+)
      final messaging = FirebaseMessaging.instance;
      final settings = await messaging.requestPermission(
        alert: true,
        badge: true,
        sound: true,
      );

      if (settings.authorizationStatus == AuthorizationStatus.authorized) {
        debugPrint('🔔 [PUSH] Permissões concedidas para push notifications.');
        
        // Registra o handler para mensagens em background
        FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

        // Inicializa as notificações locais (foreground)
        await _initializeLocalNotifications();

        // Configura listeners de eventos do FCM
        _setupFcmListeners();

        // Obtém o token FCM inicial
        _fcmToken = await messaging.getToken();
        debugPrint('🔑 [PUSH] FCM Token obtido: $_fcmToken');
      } else {
        debugPrint('⚠️ [PUSH] Permissão para push notifications recusada pelo usuário.');
      }
      
      _initialized = true;
    } catch (e) {
      debugPrint('❌ [PUSH] Falha ao inicializar o Firebase Cloud Messaging: $e');
      debugPrint('💡 [PUSH] Certifique-se de configurar as credenciais do Firebase (google-services.json).');
    }
  }

  /// Inicializa o plugin de notificações locais para exibir pushs enquanto o app está em primeiro plano
  Future<void> _initializeLocalNotifications() async {
    const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosSettings = DarwinInitializationSettings();
    const initSettings = InitializationSettings(android: androidSettings, iOS: iosSettings);

    await _localNotifications.initialize(
      initSettings,
      onDidReceiveNotificationResponse: (NotificationResponse details) {
        debugPrint("👉 [PUSH CLICK] Notificação local clicada: ${details.payload}");
      },
    );

    // Cria canal de alta importância para Android 8.0+
    const channel = AndroidNotificationChannel(
      'high_importance_channel',
      'Notificações Importantes',
      description: 'Este canal é usado para notificações críticas da aplicação.',
      importance: Importance.max,
      playSound: true,
    );

    await _localNotifications
        .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(channel);
  }

  /// Configura listeners do FCM para mensagens em primeiro plano e cliques
  void _setupFcmListeners() {
    // Quando o app está aberto (foreground)
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      debugPrint("📩 [PUSH FOREGROUND] Recebida: ${message.notification?.title}");
      _showLocalNotification(message);
    });

    // Quando o app é aberto a partir de uma notificação (background click)
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      debugPrint("👉 [PUSH OPENED] App aberto via push: ${message.data}");
    });
  }

  /// Exibe um push em primeiro plano usando o gerenciador de notificações locais
  Future<void> _showLocalNotification(RemoteMessage message) async {
    final notification = message.notification;
    final android = message.notification?.android;

    if (notification != null) {
      await _localNotifications.show(
        notification.hashCode,
        notification.title,
        notification.body,
        NotificationDetails(
          android: AndroidNotificationDetails(
            'high_importance_channel',
            'Notificações Importantes',
            channelDescription: 'Este canal é usado para notificações críticas da aplicação.',
            importance: Importance.max,
            priority: Priority.high,
            icon: android?.smallIcon ?? '@mipmap/ic_launcher',
            playSound: true,
          ),
          iOS: const DarwinNotificationDetails(
            presentAlert: true,
            presentBadge: true,
            presentSound: true,
          ),
        ),
        payload: message.data.toString(),
      );
    }
  }

  /// Sincroniza o token FCM com o backend quando o usuário se autentica
  Future<void> syncToken(String jwtToken) async {
    try {
      // Garante que o FCM está inicializado
      await initialize();

      if (_fcmToken == null) {
        _fcmToken = await FirebaseMessaging.instance.getToken();
      }

      if (_fcmToken != null) {
        debugPrint('🔄 [PUSH] Sincronizando token FCM com o backend...');
        // O ApiService gerencia o token JWT salvo em SharedPreferences
        await ApiService.post('/auth/fcm-token', {
          'token': _fcmToken,
        });
        debugPrint('✅ [PUSH] Token FCM registrado com sucesso no backend.');
      } else {
        debugPrint('⚠️ [PUSH] Não foi possível sincronizar o token (FCM Token é nulo).');
      }
    } catch (e) {
      debugPrint('❌ [PUSH] Falha ao sincronizar token FCM: $e');
    }
  }
}
