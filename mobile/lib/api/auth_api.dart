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

  // Returns the logged in user, so a saved token can be checked when the app opens.
  Future<User> me() async {
    final data = await client.request('/api/me');
    return User.fromJson(data);
  }

  // The server doesn't keep sessions, so logging out just forgets the token.
  Future<void> logout() => tokens.clear();

  Future<void> register(String username, String email, String password) async {
    await client.request(
      '/api/register',
      method: 'POST',
      body: {'username': username.trim(), 'email': email.trim(), 'password': password},
    );
  }

  Future<String> resendVerification(String email) async {
    final data = await client.request(
      '/api/resend-verification',
      method: 'POST',
      body: {'email': email.trim()},
    );
    return data['message'] as String;
  }

  // The reset link in the email opens the website, so the app only asks for it to be sent.
  Future<void> forgotPassword(String email) async {
    await client.request(
      '/api/forgot-password',
      method: 'POST',
      body: {'email': email.trim()},
    );
  }
}