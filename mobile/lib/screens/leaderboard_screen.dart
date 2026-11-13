import 'package:flutter/material.dart';
import '../api/leaderboard_api.dart';
import '../models/leaderboard_entry.dart';
import '../theme.dart';

class LeaderboardScreen extends StatefulWidget {
  final LeaderboardApi leaderboardApi;

  const LeaderboardScreen({super.key, required this.leaderboardApi});

  @override
  State<LeaderboardScreen> createState() => _LeaderboardScreenState();
}

class _LeaderboardScreenState extends State<LeaderboardScreen> {
  List<LeaderboardEntry>? _players;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final players = await widget.leaderboardApi.getLeaderboard();
      if (!mounted) return;
      setState(() {
        _players = players;
        _error = null;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = e.toString());
    }
  }

  Widget _row(String rank, String player, String score, {bool header = false}) {
    final style = TextStyle(fontSize: 16, fontWeight: header ? FontWeight.w600 : FontWeight.normal);
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12),
      decoration: BoxDecoration(
        border: Border(bottom: BorderSide(color: Colors.white.withValues(alpha: header ? 0.3 : 0.1))),
      ),
      child: Row(
        children: [
          SizedBox(width: 56, child: Text(rank, style: style)),
          Expanded(child: Text(player, style: style)),
          Text(score, style: style),
        ],
      ),
    );
  }

  Widget _body() {
    final players = _players;
    if (_error != null) {
      return Text(_error!, textAlign: TextAlign.center,
          style: const TextStyle(color: AppColors.danger, fontWeight: FontWeight.w600));
    }
    if (players == null) return const Center(child: CircularProgressIndicator());
    if (players.isEmpty) return const Text('No completed attempts yet.', textAlign: TextAlign.center);
    return Column(
      children: [
        _row('Rank', 'Player', 'Score', header: true),
        for (final p in players) _row('${p.rank}', p.username, '${p.score}'),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Leaderboard'), backgroundColor: AppColors.felt),
      body: RefreshIndicator(
        onRefresh: _load,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Text('Best score from a completed 10-round attempt.',
                textAlign: TextAlign.center,
                style: TextStyle(color: AppColors.chalk.withValues(alpha: 0.75))),
            const SizedBox(height: 24),
            _body(),
          ],
        ),
      ),
    );
  }
}
