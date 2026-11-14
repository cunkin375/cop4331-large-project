import '../models/attempt.dart';
import '../models/user.dart';
import 'api_client.dart';

class ProfileApi {
  final ApiClient client;

  ProfileApi(this.client);

  Future<User> getMe() async {
    final data = await client.request('/api/me');
    return User.fromJson(data);
  }

  Future<({List<Attempt> attempts, int bestScore})> getMyAttempts() async {
    final data = await client.request('/api/attempts/me');
    final attempts = (data['attempts'] as List)
        .map((a) => Attempt.fromJson(a as Map<String, dynamic>))
        .toList();
    return (attempts: attempts, bestScore: data['bestScore'] as int);
  }
}
