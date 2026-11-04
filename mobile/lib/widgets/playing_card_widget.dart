import 'package:flutter/material.dart';
import '../models/game_state.dart';

class PlayingCardWidget extends StatelessWidget {
  final PlayingCard card;
  final double width;

  const PlayingCardWidget({super.key, required this.card, this.width = 70});

  @override
  Widget build(BuildContext context) {
    return Image.asset(card.imagePath, width: width);
  }
}