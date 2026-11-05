import 'package:flutter/material.dart';
import '../models/game_state.dart';
import 'playing_card_widget.dart';

class HandView extends StatelessWidget {
  final String label;
  final List<PlayingCard> cards;
  final int? value;

  const HandView({super.key, required this.label, required this.cards, this.value});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(
          value == null ? label : '$label: $value',
          style: const TextStyle(color: Colors.white, fontSize: 18),
        ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 6,
          children: [for (final card in cards) PlayingCardWidget(card: card)],
        ),
      ],
    );
  }
}