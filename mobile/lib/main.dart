import 'package:flutter/material.dart';

void main() => runApp(const BlackjackApp());

class BlackjackApp extends StatelessWidget {
  const BlackjackApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Blackjack',
      theme: ThemeData(colorSchemeSeed: Colors.green, useMaterial3: true),
      home: const Scaffold(
        body: Center(child: Text('Blackjack')),
      ),
    );
  }
}