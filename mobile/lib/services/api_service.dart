import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

import 'package:flutter/foundation.dart';

/// URL base da API — usa dev local (10.0.2.2 para emulador Android) se em debug, produção em release.
String get _kBaseUrl {
  const envUrl = String.fromEnvironment('API_BASE_URL');
  if (envUrl.isNotEmpty) return envUrl;
  return kDebugMode ? 'http://10.0.2.2:4000/v1' : 'https://api.influnext.com.br/v1';
}

/// Cliente HTTP centralizado para a API InfluNext.
/// Inclui: autenticação via Bearer token, erros tipados e timeout de 15s.
class ApiService {
  static const Duration _timeout = Duration(seconds: 15);

  // ─── Token Management ───────────────────────────────────────────────────────

  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('auth_token');
  }

  static Future<void> saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('auth_token', token);
  }

  static Future<void> clearToken() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
    await prefs.remove('user_role');
    await prefs.remove('user_id');
  }

  static Future<void> saveUserInfo({
    required String id,
    required String role,
    required String email,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('user_id', id);
    await prefs.setString('user_role', role);
    await prefs.setString('user_email', email);
  }

  static Future<Map<String, String?>> getUserInfo() async {
    final prefs = await SharedPreferences.getInstance();
    return {
      'id': prefs.getString('user_id'),
      'role': prefs.getString('user_role'),
      'email': prefs.getString('user_email'),
    };
  }

  // ─── HTTP Helpers ───────────────────────────────────────────────────────────

  static Future<Map<String, String>> _headers({bool auth = true}) async {
    final headers = <String, String>{
      'Content-Type': 'application/json',
    };
    if (auth) {
      final token = await getToken();
      if (token != null) headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  static Map<String, dynamic> _parse(http.Response response) {
    final body = jsonDecode(response.body) as Map<String, dynamic>;
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return body;
    }
    final message = body['error'] ?? body['message'] ?? 'Erro desconhecido';
    throw ApiException(message: message.toString(), statusCode: response.statusCode);
  }

  /// GET /v1/{path}
  static Future<Map<String, dynamic>> get(String path) async {
    final headers = await _headers();
    final response = await http
        .get(Uri.parse('$_kBaseUrl$path'), headers: headers)
        .timeout(_timeout);
    return _parse(response);
  }

  /// POST /v1/{path} com body JSON
  static Future<Map<String, dynamic>> post(
    String path,
    Map<String, dynamic> body, {
    bool auth = true,
  }) async {
    final headers = await _headers(auth: auth);
    final response = await http
        .post(
          Uri.parse('$_kBaseUrl$path'),
          headers: headers,
          body: jsonEncode(body),
        )
        .timeout(_timeout);
    return _parse(response);
  }

  /// PATCH /v1/{path} com body JSON
  static Future<Map<String, dynamic>> patch(
    String path,
    Map<String, dynamic> body,
  ) async {
    final headers = await _headers();
    final response = await http
        .patch(
          Uri.parse('$_kBaseUrl$path'),
          headers: headers,
          body: jsonEncode(body),
        )
        .timeout(_timeout);
    return _parse(response);
  }
}

/// Erro tipado retornado pela API.
class ApiException implements Exception {
  final String message;
  final int statusCode;

  const ApiException({required this.message, required this.statusCode});

  @override
  String toString() => 'ApiException($statusCode): $message';
}
