import 'package:flutter/material.dart';
import '../api/leaderboard_api.dart';
import '../models/leaderboard_entry.dart';

class LeaderboardScreen extends StatefulWidget {
  final LeaderboardApi leaderboardApi;

  const LeaderboardScreen({super.key, required this.leaderboardApi});

  @override
  State<LeaderboardScreen> createState() => _LeaderboardScreenState();
}

class _LeaderboardScreenState extends State<LeaderboardScreen> {
  List<LeaderboardEntry>? _players;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final players = await widget.leaderboardApi.getLeaderboard();
    if (!mounted) return;
    setState(() => _players = players);
  }

  @override
  Widget build(BuildContext context) {
    final players = _players;
    return Scaffold(
      appBar: AppBar(title: const Text('Leaderboard')),
      body: players == null
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                for (final p in players)
                  ListTile(
                    leading: Text('${p.rank}', style: const TextStyle(fontSize: 16)),
                    title: Text(p.username),
                    trailing: Text('${p.score}', style: const TextStyle(fontSize: 16)),
                  ),
              ],
            ),
    );
  }
}
