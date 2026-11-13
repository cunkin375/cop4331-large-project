class LeaderboardEntry {
  final int rank;
  final String username;
  final int score;

  const LeaderboardEntry({required this.rank, required this.username, required this.score});

  factory LeaderboardEntry.fromJson(Map<String, dynamic> json) {
    return LeaderboardEntry(
      rank: json['rank'] as int,
      username: json['username'] as String,
      score: json['score'] as int,
    );
  }
}
