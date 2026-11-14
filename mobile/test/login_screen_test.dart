import 'dart:convert';

import 'package:blackjack/api/api_client.dart';
import 'package:blackjack/api/auth_api.dart';
import 'package:blackjack/screens/login_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';

import 'fake_token_storage.dart';

void main() {
  late FakeTokenStorage tokens;
  late AuthApi auth;

  setUp(() {
    tokens = FakeTokenStorage();
    auth = AuthApi(ApiClient(tokens), tokens);
  });

  // Fills in the form and taps Log in, with the server answering [reply].
  Future<void> logIn(WidgetTester tester, http.Response reply) async {
    await tester.pumpWidget(MaterialApp(home: LoginScreen(authApi: auth)));
    await tester.enterText(find.byType(TextField).at(0), 'tester');
    await tester.enterText(find.byType(TextField).at(1), 'pw123456');
    await http.runWithClient(
      () async {
        await tester.tap(find.widgetWithText(FilledButton, 'Log in'));
        await tester.runAsync(() => Future<void>.delayed(const Duration(milliseconds: 50)));
      },
      () => MockClient((_) async => reply),
    );
    await tester.pumpAndSettle();
  }

  testWidgets('a wrong password shows the error from the server', (tester) async {
    await logIn(tester, http.Response(jsonEncode({'error': 'Invalid credentials'}), 401));

    expect(find.text('Invalid credentials'), findsOneWidget);
    expect(tokens.value, isNull);
  });

  testWidgets('logging in opens the home screen', (tester) async {
    final body = {
      'token': 'abc',
      'user': {'id': '1', 'username': 'tester', 'email': 'tester@example.com'},
    };
    await logIn(tester, http.Response(jsonEncode(body), 200));

    expect(find.text('Logged in as tester'), findsOneWidget);
    expect(tokens.value, 'abc');
  });

  testWidgets('log out goes back to the login screen and forgets the token', (tester) async {
    final body = {
      'token': 'abc',
      'user': {'id': '1', 'username': 'tester', 'email': 'tester@example.com'},
    };
    await logIn(tester, http.Response(jsonEncode(body), 200));

    await tester.tap(find.text('Log out'));
    await tester.pumpAndSettle();

    expect(find.widgetWithText(FilledButton, 'Log in'), findsOneWidget);
    expect(tokens.value, isNull);
  });
}
