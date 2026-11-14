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
