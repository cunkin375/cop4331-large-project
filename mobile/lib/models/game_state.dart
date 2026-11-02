class PlayingCard {
  final String rank;
  final String suit;

  const PlayingCard({required this.rank, required this.suit});

  factory PlayingCard.fromJson(Map<String, dynamic> json) {
    return PlayingCard(
      rank: json['rank'] as String,
      suit: json['suit'] as String,
    );
  }
  
  static const _rankNames = {
    'A': 'ace', '2': 'two', '3': 'three', '4': 'four', '5': 'five',
    '6': 'six', '7': 'seven', '8': 'eight', '9': 'nine', '10': 'ten',
    'J': 'jack', 'Q': 'queen', 'K': 'king',
  };

  String get imagePath => 'assets/cards/${_rankNames[rank]}_of_$suit.png';
}

class GameState {
  final String gameId;
  final int round;
  final int roundsCompleted;
  final List<PlayingCard> playerCards;
  final int playerValue;
  final List<PlayingCard> dealerCards;
  final int? dealerValue;
  final bool roundOver;
  final String? outcome;
  final int? points;
  final int totalPoints;
  final bool attemptComplete;

  const GameState({
    required this.gameId,
    required this.round,
    required this.roundsCompleted,
    required this.playerCards,
    required this.playerValue,
    required this.dealerCards,
    this.dealerValue,
    required this.roundOver,
    this.outcome,
    this.points,
    required this.totalPoints,
    required this.attemptComplete,
  });

    factory GameState.fromJson(Map<String, dynamic> json) {
    List<PlayingCard> cards(String key) => (json[key] as List)
        .map((c) => PlayingCard.fromJson(c as Map<String, dynamic>))
        .toList();

    return GameState(
      gameId: json['gameId'] as String,
      round: json['round'] as int,
      roundsCompleted: json['roundsCompleted'] as int,
      playerCards: cards('playerCards'),
      playerValue: json['playerValue'] as int,
      dealerCards: cards('dealerCards'),
      dealerValue: json['dealerValue'] as int?,
      roundOver: json['roundOver'] as bool,
      outcome: json['outcome'] as String?,
      points: json['points'] as int?,
      totalPoints: json['totalPoints'] as int,
      attemptComplete: json['attemptComplete'] as bool,
    );
  }
}