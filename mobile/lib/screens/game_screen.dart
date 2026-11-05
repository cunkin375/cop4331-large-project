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

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      backgroundColor: Color(0xFF255D36),
      body: SafeArea(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: [
            HandView(label: 'Dealer', cards: _dealerCards),
            HandView(label: 'You', cards: _playerCards, value: 18),
          ],
        ),
      ),
    );
  }
}