import 'package:flutter_test/flutter_test.dart';
import 'package:blackjack/main.dart';

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
}