import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:blackjack/main.dart';
import 'package:blackjack/models/user.dart';
import 'package:blackjack/screens/home_screen.dart';

void main() {
  testWidgets('app starts', (tester) async {
    await tester.pumpWidget(const BlackjackApp());
    expect(find.text('Blackjack'), findsOneWidget);
  });

  testWidgets('forgot password link opens the reset screen', (tester) async {
    await tester.pumpWidget(const BlackjackApp());
    await tester.tap(find.text('Forgot your password?'));
    await tester.pumpAndSettle();
    expect(find.text('Reset your password'), findsOneWidget);

    await tester.tap(find.text('Back to log in'));
    await tester.pumpAndSettle();
    expect(find.text('Log in'), findsWidgets);
  });

  testWidgets('home screen shows the user and a log out button', (tester) async {
    const user = User(id: '1', username: 'tester', email: 'tester@example.com');
    await tester.pumpWidget(MaterialApp(home: HomeScreen(authApi: authApi, user: user)));
    expect(find.text('Logged in as tester'), findsOneWidget);
    expect(find.text('Log out'), findsOneWidget);
  });
}