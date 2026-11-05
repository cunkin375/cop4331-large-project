import 'dart:convert';

import 'package:http/http.dart' as http;

import '../config.dart';
import '../models/game_state.dart';

class ApiException implements Exception {
  final int status;
  final String message;

  ApiException(this.status, this.message);

  @override
  String toString() => message;
}

Map<String, String> _headers(String token) => {
      'Authorization': 'Bearer $token',
      'Content-Type': 'application/json',
    };


GameState _toGameState(http.Response response) {
  final data = jsonDecode(response.body) as Map<String, dynamic>;
  if (response.statusCode != 200) {
    throw ApiException(response.statusCode, data['error'] ?? 'Something went wrong');
  }
  return GameState.fromJson(data);
}


Future<GameState> startGame(String token, {String? gameId}) async {
  final response = await http.post(
    Uri.parse('$apiBaseUrl/api/game/start'),
    headers: _headers(token),
    body: jsonEncode(gameId == null ? {} : {'gameId': gameId}),
  );

    return _toGameState(response);
}

Future<GameState> hit(String token, String gameId) async {
  final response = await http.post(
    Uri.parse('$apiBaseUrl/api/game/hit'),
    headers: _headers(token),
    body: jsonEncode({'gameId': gameId}),
  );
  return _toGameState(response);
}

Future<GameState> stand(String token, String gameId) async {
  final response = await http.post(
    Uri.parse('$apiBaseUrl/api/game/stand'),
    headers: _headers(token),
    body: jsonEncode({'gameId': gameId}),
  );
  return _toGameState(response);
}