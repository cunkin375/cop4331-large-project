import 'package:flutter/material.dart';

import '../api/auth_api.dart';
import '../api/leaderboard_api.dart';
import '../api/profile_api.dart';
import '../models/user.dart';
import '../theme.dart';
import 'game_screen.dart';
import 'leaderboard_screen.dart';
import 'login_screen.dart';
import 'profile_screen.dart';

// Shown after login, with the same destinations as the web navigation.
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
                  const Text(
                    'Blackjack',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 30),
                  ),
                  const SizedBox(height: 24),
                  Text(
                    'Logged in as ${user.username}',
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 24),
                  FilledButton(
                    style: FilledButton.styleFrom(
                      minimumSize: const Size.fromHeight(48),
                    ),
                    onPressed: () => Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => const GameScreen()),
                    ),
                    child: const Text('Play'),
                  ),
                  const SizedBox(height: 12),
                  OutlinedButton.icon(
                    style: _navigationStyle,
                    onPressed: () => Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => LeaderboardScreen(
                          leaderboardApi: LeaderboardApi(authApi.client),
                        ),
                      ),
                    ),
                    icon: const Icon(Icons.leaderboard_outlined),
                    label: const Text('Leaderboard'),
                  ),
                  const SizedBox(height: 12),
                  OutlinedButton.icon(
                    style: _navigationStyle,
                    onPressed: () => Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => ProfileScreen(
                          profileApi: ProfileApi(authApi.client),
                        ),
                      ),
                    ),
                    icon: const Icon(Icons.person_outline),
                    label: const Text('My stats'),
                  ),
                  const SizedBox(height: 12),
                  OutlinedButton(
                    style: _navigationStyle,
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

  static final _navigationStyle = OutlinedButton.styleFrom(
    foregroundColor: AppColors.chalk,
    backgroundColor: AppColors.feltDark,
    side: BorderSide(color: AppColors.chalk.withValues(alpha: 0.3)),
    minimumSize: const Size.fromHeight(48),
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
  );
}
