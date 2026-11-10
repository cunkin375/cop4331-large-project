import 'package:flutter/material.dart';
import 'api/api_client.dart';
import 'api/auth_api.dart';
import 'api/token_storage.dart';
import 'screens/login_screen.dart';
import 'theme.dart';

final tokens = TokenStorage();
final client = ApiClient(tokens);
final authApi = AuthApi(client, tokens);

// Lets the API client move to the login screen from outside any widget.
final navigatorKey = GlobalKey<NavigatorState>();
final messengerKey = GlobalKey<ScaffoldMessengerState>();

// Tokens expire after 2 hours. When the server rejects ours, start over at login.
Future<void> onSessionExpired() async {
  await tokens.clear();
  navigatorKey.currentState?.pushAndRemoveUntil(
    MaterialPageRoute(builder: (_) => LoginScreen(authApi: authApi)),
    (_) => false,
  );
  messengerKey.currentState?.showSnackBar(
    const SnackBar(content: Text('Your session expired. Please log in again.')),
  );
}

void main() {
  client.onUnauthorized = onSessionExpired;
  runApp(const BlackjackApp());
}

class BlackjackApp extends StatelessWidget {
  const BlackjackApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Blackjack',
      theme: appTheme,
      navigatorKey: navigatorKey,
      scaffoldMessengerKey: messengerKey,
      home: LoginScreen(authApi: authApi),
    );
  }
}
