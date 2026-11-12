import 'package:flutter/material.dart';
import '../api/game_api.dart';
import '../api/token_storage.dart';
import '../models/game_state.dart';
import '../widgets/hand_view.dart';

class GameScreen extends StatefulWidget {
  const GameScreen({super.key});

  @override
  State<GameScreen> createState() => _GameScreenState();
}

class _GameScreenState extends State<GameScreen> {
  GameState? _game;
  String? _error;

  static final _buttonStyle = ElevatedButton.styleFrom(
    backgroundColor: const Color(0xFFF5F5F5),
    foregroundColor: const Color(0xFF171717),
    minimumSize: const Size(0, 48),
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
    textStyle: const TextStyle(fontWeight: FontWeight.w600),
  );

  @override
  void initState() {
    super.initState();
    _start();
  }

  Future<void> _start() async {
    try {
      final token = await TokenStorage().read();
      if (token == null) throw ApiException(401, 'Log in first');
      final game = await startGame(token);
      if (!mounted) return;
      setState(() => _game = game);
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = e.toString());
    }
  }

  @override
  Widget build(BuildContext context) {
    final game = _game;
    return Scaffold(
      backgroundColor: const Color(0xFF255D36),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: game == null
              ? Center(
                  child: _error != null
                      ? Text(_error!, style: const TextStyle(color: Colors.white))
                      : const CircularProgressIndicator(),
                )
              : Column(
                  children: [
                    HandView(title: "Dealer's Hand", cards: game.dealerCards, totalLabel: 'Showing', total: game.dealerValue),
                    const SizedBox(height: 24),
                    HandView(title: 'Your Hand', cards: game.playerCards, totalLabel: 'Hand Value', total: game.playerValue),
                    const Spacer(),
                    Row(
                      children: [
                        Expanded(
                          child: ElevatedButton(style: _buttonStyle, onPressed: () {}, child: const Text('Hit')),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: ElevatedButton(style: _buttonStyle, onPressed: () {}, child: const Text('Stand')),
                        ),
                      ],
                    ),
                  ],
                ),
        ),
      ),
    );
  }
}