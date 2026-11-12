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
  String? _token;
  bool _busy = false;

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
      _token = token;
      final game = await startGame(token);
      if (!mounted) return;
      setState(() => _game = game);
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = e.toString());
    }
  }

  Future<void> _play(Future<GameState> Function(String token, String gameId) move) async {
    final game = _game;
    final token = _token;
    if (game == null || token == null) return;
    setState(() => _busy = true);
    try {
      final next = await move(token, game.gameId);
      if (!mounted) return;
      setState(() => _game = next);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  // same messages as resultMessage() in the web app's GamePage.tsx
  String _resultMessage(GameState game) {
    final playerNatural = game.playerCards.length == 2 && game.playerValue == 21;
    switch (game.outcome) {
      case 'win':
        if (playerNatural) return 'Blackjack! You win.';
        return (game.dealerValue ?? 0) > 21 ? 'Dealer busts. You win!' : 'You win!';
      case 'loss':
        return game.playerValue > 21 ? 'Bust! You lose.' : 'Dealer wins.';
      case 'tie':
        return "Push. It's a tie.";
      default:
        return '';
    }
  }

  @override
  Widget build(BuildContext context) {
    final game = _game;
    const chalk = TextStyle(color: Color(0xFFE6E6E6), fontSize: 16);
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
                    Text('Round ${game.round} / 10     Score: ${game.totalPoints}', style: chalk),
                    const SizedBox(height: 16),
                    HandView(title: "Dealer's Hand", cards: game.dealerCards, totalLabel: 'Showing', total: game.dealerValue),
                    const SizedBox(height: 24),
                    HandView(title: 'Your Hand', cards: game.playerCards, totalLabel: 'Hand Value', total: game.playerValue),
                    const SizedBox(height: 24),
                    if (game.roundOver)
                      Text(
                        _resultMessage(game) +
                            (game.attemptComplete ? ' Attempt complete: ${game.totalPoints} points.' : ''),
                        style: chalk.copyWith(fontSize: 18, fontWeight: FontWeight.w600),
                        textAlign: TextAlign.center,
                      ),
                    const Spacer(),
                    if (game.roundOver)
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          style: _buttonStyle,
                          // same as web: keep the gameId for the next round, drop it to start a new attempt
                          onPressed: _busy
                              ? null
                              : () => _play((token, gameId) =>
                                  startGame(token, gameId: game.attemptComplete ? null : gameId)),
                          child: Text(game.attemptComplete ? 'Start New Attempt' : 'Next Round'),
                        ),
                      )
                    else
                    Row(
                      children: [
                        Expanded(
                          child: ElevatedButton(style: _buttonStyle, onPressed: _busy ? null : () => _play(hit), child: const Text('Hit')),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: ElevatedButton(style: _buttonStyle, onPressed: _busy ? null : () => _play(stand), child: const Text('Stand')),
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