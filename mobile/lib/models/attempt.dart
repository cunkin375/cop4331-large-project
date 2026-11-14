class RoundResult {
  final int round;
  final String outcome;
  final int points;

  const RoundResult({required this.round, required this.outcome, required this.points});

  factory RoundResult.fromJson(Map<String, dynamic> json) {
    return RoundResult(
      round: json['round'] as int,
      outcome: json['outcome'] as String,
      points: json['points'] as int,
    );
  }
}

class Attempt {
  final String id;
  final int score;
  final List<RoundResult> rounds;
  final DateTime completedAt;

  const Attempt({required this.id, required this.score, required this.rounds, required this.completedAt});

  factory Attempt.fromJson(Map<String, dynamic> json) {
    return Attempt(
      id: json['_id'] as String,
      score: json['score'] as int,
      rounds: (json['rounds'] as List)
          .map((r) => RoundResult.fromJson(r as Map<String, dynamic>))
          .toList(),
      completedAt: DateTime.parse(json['completedAt'] as String),
    );
  }
}
