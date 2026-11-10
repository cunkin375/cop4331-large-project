import 'package:flutter/material.dart';
import 'api/api_client.dart';
import 'api/auth_api.dart';
import 'api/token_storage.dart';
import 'models/user.dart';
import 'screens/home_screen.dart';
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

// If a saved token still works, skip the login screen. Any problem means logging in again.
Future<User?> restoreSession() async {
  try {
    if (await tokens.read() == null) return null;
    return await authApi.me().timeout(const Duration(seconds: 8));
  } catch (_) {
    return null;
  }
}

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  client.onUnauthorized = onSessionExpired;
  final user = await restoreSession();
  runApp(BlackjackApp(user: user));
}

class BlackjackApp extends StatelessWidget {
  final User? user;
  const BlackjackApp({super.key, this.user});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Blackjack',
      theme: appTheme,
      navigatorKey: navigatorKey,
      scaffoldMessengerKey: messengerKey,
      home: user == null ? LoginScreen(authApi: authApi) : HomeScreen(authApi: authApi, user: user!),
    );
  }
}
