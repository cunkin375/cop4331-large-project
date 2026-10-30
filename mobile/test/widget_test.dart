import 'package:flutter_test/flutter_test.dart';
import 'package:blackjack/main.dart';

void main() {
  testWidgets('app starts', (tester) async {
    await tester.pumpWidget(const BlackjackApp());
    expect(find.text('Blackjack'), findsOneWidget);
  });
}