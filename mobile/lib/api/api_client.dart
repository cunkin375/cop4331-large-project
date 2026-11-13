import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config.dart';
import 'token_storage.dart';

class ApiException implements Exception {
  final int status;
  final String message;
  ApiException(this.status, this.message);

  @override
  String toString() => message;
}

class ApiClient {
  final TokenStorage tokens;
  // Called when the server rejects our token (it expires after 2 hours).
  void Function()? onUnauthorized;

  ApiClient(this.tokens);

  Future<Map<String, dynamic>> request(String path, {String method = 'GET', Object? body}) async {
    final token = await tokens.read();
    final headers = <String, String>{
      if (token != null) 'Authorization': 'Bearer $token',
      if (body != null) 'Content-Type': 'application/json',
    };

    http.Response response;
    try {
      final req = http.Request(method, Uri.parse('$apiBaseUrl$path'))..headers.addAll(headers);
      if (body != null) req.body = jsonEncode(body);
      response = await http.Response.fromStream(await req.send());
    } catch (_) {
      throw ApiException(0, 'Unable to reach the server. Check your connection and try again.');
    }

    Map<String, dynamic> data = {};
    try {
      data = jsonDecode(response.body) as Map<String, dynamic>;
    } catch (_) {}

    if (response.statusCode >= 400) {
      if (response.statusCode == 401 && token != null) onUnauthorized?.call();
      throw ApiException(response.statusCode, data['error'] as String? ?? 'Something went wrong. Please try again.');
    }
    return data;
  }
}