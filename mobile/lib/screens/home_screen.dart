import 'package:flutter/material.dart';
import '../api/auth_api.dart';
import '../models/user.dart';
import 'login_screen.dart';

// Shown after login. The game, leaderboard and profile screens get linked from here.
class HomeScreen extends StatelessWidget {
  final AuthApi authApi;
  final User user;
  const HomeScreen({super.key, required this.authApi, required this.user});

  Future<void> _logout(BuildContext context) async {
    await authApi.logout();
    if (!context.mounted) return;
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => LoginScreen(authApi: authApi)),
      (_) => false,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 384),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Text('Blackjack', textAlign: TextAlign.center, style: TextStyle(fontSize: 30)),
                  const SizedBox(height: 24),
                  Text(
                    'Logged in as ${user.username}',
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 24),
                  OutlinedButton(
                    style: OutlinedButton.styleFrom(minimumSize: const Size.fromHeight(48)),
                    onPressed: () => _logout(context),
                    child: const Text('Log out'),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
