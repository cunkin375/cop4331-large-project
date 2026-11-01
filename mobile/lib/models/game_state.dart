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