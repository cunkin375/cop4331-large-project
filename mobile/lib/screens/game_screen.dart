import 'package:flutter/material.dart';
import '../models/game_state.dart';
import '../widgets/hand_view.dart';

class GameScreen extends StatelessWidget {
  const GameScreen({super.key});

  //placeholders until screen is connected to the game API
  static const _dealerCards = [PlayingCard(rank: 'K', suit: 'spades')];
  static const _playerCards = [
    PlayingCard(rank: 'A', suit: 'hearts'),
    PlayingCard(rank: '7', suit: 'clubs'),
  ];

  static final _buttonStyle = ElevatedButton.styleFrom(
    backgroundColor: const Color(0xFFF5F5F5),
    foregroundColor: const Color(0xFF171717),
    minimumSize: const Size(0, 48),
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
    textStyle: const TextStyle(fontWeight: FontWeight.w600),
  );

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF255D36),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              const HandView(title: "Dealer's Hand", cards: _dealerCards, totalLabel: 'Showing', total: 10),
              const SizedBox(height: 24),
              const HandView(title: 'Your Hand', cards: _playerCards, totalLabel: 'Hand Value', total: 18),
              const Spacer(),
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton(
                      style: _buttonStyle,
                      onPressed: () {},
                      child: const Text('Hit'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      style: _buttonStyle,
                      onPressed: () {},
                      child: const Text('Stand'),
                    ),
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