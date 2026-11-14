import '../models/leaderboard_entry.dart';
import 'api_client.dart';

class LeaderboardApi {
  final ApiClient client;

  LeaderboardApi(this.client);

  Future<List<LeaderboardEntry>> getLeaderboard({String query = ''}) async {
    final data = await client.request('/api/leaderboard?q=${Uri.encodeQueryComponent(query.trim())}');
    return (data['players'] as List)
        .map((p) => LeaderboardEntry.fromJson(p as Map<String, dynamic>))
        .toList();
  }
}
