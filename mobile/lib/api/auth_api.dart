import '../models/user.dart';
import 'api_client.dart';
import 'token_storage.dart';

class AuthApi {
  final ApiClient client;
  final TokenStorage tokens;

  AuthApi(this.client, this.tokens);

  // The server accepts either a username or an email to log in.
  Future<User> login(String identifier, String password) async {
    final id = identifier.trim();
    final field = id.contains('@') ? 'email' : 'username';
    final data = await client.request(
      '/api/login',
      method: 'POST',
      body: {field: id, 'password': password},
    );
    await tokens.save(data['token'] as String);
    return User.fromJson(data['user'] as Map<String, dynamic>);
  }
}