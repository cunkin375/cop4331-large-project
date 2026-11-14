import 'dart:convert';

import 'package:blackjack/api/api_client.dart';
import 'package:blackjack/api/auth_api.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';

import 'fake_token_storage.dart';

const userJson = {'id': '1', 'username': 'tester', 'email': 'tester@example.com'};

void main() {
  late FakeTokenStorage tokens;
  late ApiClient client;
  late AuthApi auth;
  late List<http.Request> sent;

  setUp(() {
    tokens = FakeTokenStorage();
    client = ApiClient(tokens);
    auth = AuthApi(client, tokens);
    sent = [];
  });

  // Runs [body] with every request answered by [reply] instead of the real server.
  Future<T> withServer<T>(Future<T> Function() body, http.Response Function(http.Request) reply) {
    return http.runWithClient(body, () => MockClient((req) async {
          sent.add(req);
          return reply(req);
        }));
  }

  http.Response json(Object body, [int status = 200]) => http.Response(jsonEncode(body), status);

  Map<String, dynamic> sentBody() => jsonDecode(sent.single.body) as Map<String, dynamic>;

  test('login with a username sends the username field and saves the token', () async {
    final user = await withServer(
      () => auth.login('  tester ', 'pw123456'),
      (_) => json({'token': 'abc', 'user': userJson}),
    );

    expect(sent.single.url.path, '/api/login');
    expect(sentBody(), {'username': 'tester', 'password': 'pw123456'});
    expect(tokens.value, 'abc');
    expect(user.username, 'tester');
  });

  test('login with an email sends the email field', () async {
    await withServer(
      () => auth.login('tester@example.com', 'pw123456'),
      (_) => json({'token': 'abc', 'user': userJson}),
    );

    expect(sentBody(), {'email': 'tester@example.com', 'password': 'pw123456'});
  });

  test('a wrong password shows the server error and is not treated as an expired session', () async {
    tokens.value = 'old';
    var expired = false;
    client.onUnauthorized = () => expired = true;

    final call = withServer(
      () => auth.login('tester', 'wrong'),
      (_) => json({'error': 'Invalid credentials'}, 401),
    );

    await expectLater(call, throwsA(isA<ApiException>().having((e) => e.message, 'message', 'Invalid credentials')));
    expect(expired, isFalse);
    expect(tokens.value, isNull);
  });

  test('me sends the saved token', () async {
    tokens.value = 'abc';

    final user = await withServer(() => auth.me(), (_) => json(userJson));

    expect(sent.single.headers['Authorization'], 'Bearer abc');
    expect(user.email, 'tester@example.com');
  });

  test('an expired token calls onUnauthorized', () async {
    tokens.value = 'expired';
    var expired = false;
    client.onUnauthorized = () => expired = true;

    final call = withServer(() => auth.me(), (_) => json({'error': 'Invalid or expired token'}, 401));

    await expectLater(call, throwsA(isA<ApiException>()));
    expect(expired, isTrue);
  });

  test('logout forgets the token', () async {
    tokens.value = 'abc';

    await auth.logout();

    expect(tokens.value, isNull);
  });

  test('register sends trimmed fields', () async {
    await withServer(
      () => auth.register(' tester ', ' tester@example.com ', 'pw123456'),
      (_) => json({'message': 'ok'}, 201),
    );

    expect(sent.single.url.path, '/api/register');
    expect(sentBody(), {'username': 'tester', 'email': 'tester@example.com', 'password': 'pw123456'});
  });

  test('register shows the error for a taken username', () async {
    final call = withServer(
      () => auth.register('tester', 'tester@example.com', 'pw123456'),
      (_) => json({'error': 'Username or email already in use'}, 409),
    );

    await expectLater(
      call,
      throwsA(isA<ApiException>()
          .having((e) => e.status, 'status', 409)
          .having((e) => e.message, 'message', 'Username or email already in use')),
    );
  });

  test('resend verification returns the server message', () async {
    final message = await withServer(
      () => auth.resendVerification('tester@example.com'),
      (_) => json({'message': 'Verification email sent'}),
    );

    expect(sent.single.url.path, '/api/resend-verification');
    expect(message, 'Verification email sent');
  });

  test('forgot password sends the trimmed email', () async {
    await withServer(
      () => auth.forgotPassword(' tester@example.com '),
      (_) => json({'message': 'If that email exists, a reset link was sent.'}),
    );

    expect(sent.single.url.path, '/api/forgot-password');
    expect(sentBody(), {'email': 'tester@example.com'});
  });

  test('no connection gives a friendly error', () async {
    final call = http.runWithClient(
      () => auth.login('tester', 'pw123456'),
      () => MockClient((_) async => throw http.ClientException('offline')),
    );

    await expectLater(
      call,
      throwsA(isA<ApiException>().having((e) => e.message, 'message', contains('Unable to reach the server'))),
    );
  });
}
