import 'package:flutter/material.dart';
import '../models/game_state.dart';
import 'playing_card_widget.dart';

class HandView extends StatelessWidget {
  final String title;
  final List<PlayingCard> cards;
  final String totalLabel;
  final int? total;

  const HandView({
    super.key,
    required this.title,
    required this.cards,
    required this.totalLabel,
    this.total,
  });

  @override
  Widget build(BuildContext context) {
    const chalk = Color(0xFFE6E6E6);
    return Column(
      children: [
        Text(title, style: const TextStyle(color: chalk, fontSize: 20)),
        const SizedBox(height: 8),
        Wrap(
          spacing: 6,
          children: [for (final card in cards) PlayingCardWidget(card: card)],
        ),
        const SizedBox(height: 8),
        if (total != null)
          Text('$totalLabel: $total', style: const TextStyle(color: chalk)),
      ],
    );
  }
}