import 'package:flutter/material.dart';
import '../api/profile_api.dart';
import '../models/attempt.dart';
import '../models/user.dart';
import '../theme.dart';

class ProfileScreen extends StatefulWidget {
  final ProfileApi profileApi;

  const ProfileScreen({super.key, required this.profileApi});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  User? _user;
  List<Attempt>? _attempts;
  int _bestScore = 0;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final results = await Future.wait([widget.profileApi.getMe(), widget.profileApi.getMyAttempts()]);
      if (!mounted) return;
      final mine = results[1] as ({List<Attempt> attempts, int bestScore});
      setState(() {
        _user = results[0] as User;
        _attempts = mine.attempts;
        _bestScore = mine.bestScore;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = e.toString());
    }
  }

  static final _boxDecoration = BoxDecoration(
    color: AppColors.feltDark.withValues(alpha: 0.7),
    border: Border.all(color: Colors.white.withValues(alpha: 0.15)),
    borderRadius: BorderRadius.circular(8),
  );

  Widget _stat(String label, String value) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: _boxDecoration,
        child: Column(
          children: [
            Text(value, style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w600)),
            Text(label,
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 13, color: AppColors.chalk.withValues(alpha: 0.75))),
          ],
        ),
      ),
    );
  }

  static const _months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  String _formatDate(DateTime utc) {
    final d = utc.toLocal();
    final hour = d.hour % 12 == 0 ? 12 : d.hour % 12;
    final minute = d.minute.toString().padLeft(2, '0');
    return '${_months[d.month - 1]} ${d.day}, ${d.year}, $hour:$minute ${d.hour < 12 ? 'AM' : 'PM'}';
  }

  String _tally(Attempt attempt) {
    int count(String outcome) => attempt.rounds.where((r) => r.outcome == outcome).length;
    return '${count('win')} · ${count('tie')} · ${count('loss')}';
  }

  Widget _row(String finished, String tally, String score, {bool header = false, bool best = false}) {
    final style = TextStyle(
      fontSize: 15,
      fontWeight: header || best ? FontWeight.w600 : FontWeight.normal,
    );
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12),
      decoration: BoxDecoration(
        border: Border(bottom: BorderSide(color: Colors.white.withValues(alpha: header ? 0.3 : 0.1))),
      ),
      child: Row(
        children: [
          Expanded(flex: 5, child: Text(finished, style: style)),
          Expanded(flex: 4, child: Text(tally, style: style)),
          Text(score, style: best ? style.copyWith(color: AppColors.gold) : style),
        ],
      ),
    );
  }

  Widget _body() {
    final user = _user;
    final attempts = _attempts;
    if (_error != null) {
      return Text(_error!,
          textAlign: TextAlign.center,
          style: const TextStyle(color: AppColors.danger, fontWeight: FontWeight.w600));
    }
    if (user == null || attempts == null) return const Center(child: CircularProgressIndicator());

    final average = attempts.isEmpty
        ? '–'
        : (attempts.fold(0, (sum, a) => sum + a.score) / attempts.length).toStringAsFixed(1);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Container(
          padding: const EdgeInsets.all(16),
          decoration: _boxDecoration,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(user.username, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w600)),
              Text(user.email, style: TextStyle(color: AppColors.chalk.withValues(alpha: 0.75))),
            ],
          ),
        ),
        const SizedBox(height: 24),
        Row(
          children: [
            _stat('Best score / 30', attempts.isEmpty ? '–' : '$_bestScore'),
            const SizedBox(width: 12),
            _stat('Attempts', '${attempts.length}'),
            const SizedBox(width: 12),
            _stat('Average score', average),
          ],
        ),
        const SizedBox(height: 32),
        const Text('Past attempts', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
        const SizedBox(height: 12),
        if (attempts.isEmpty)
          const Text('No finished attempts yet. Play all 10 rounds to get a score.', textAlign: TextAlign.center)
        else ...[
          _row('Finished', 'Win · Tie · Loss', 'Score', header: true),
          for (final a in attempts)
            _row(_formatDate(a.completedAt), _tally(a), '${a.score}', best: a.score == _bestScore),
        ],
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('My stats'), backgroundColor: AppColors.felt),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [_body()],
      ),
    );
  }
}
