import 'package:flutter/material.dart';
import 'api/api_client.dart';
import 'api/auth_api.dart';
import 'api/token_storage.dart';
import 'screens/login_screen.dart';
import 'theme.dart';

final tokens = TokenStorage();
final client = ApiClient(tokens);
final authApi = AuthApi(client, tokens);

void main() => runApp(const BlackjackApp());

class BlackjackApp extends StatelessWidget {
  const BlackjackApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Blackjack',
      theme: appTheme,
      home: LoginScreen(authApi: authApi),
    );
  }
}