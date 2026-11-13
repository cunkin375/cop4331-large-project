import 'package:flutter/material.dart';
import '../api/api_client.dart';
import '../api/auth_api.dart';
import '../theme.dart';

class RegisterScreen extends StatefulWidget {
  final AuthApi authApi;
  const RegisterScreen({super.key, required this.authApi});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _username = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _confirm = TextEditingController();
  bool _loading = false;
  String? _error;
  String? _notice;
  String? _sentTo;

  @override
  void dispose() {
    _username.dispose();
    _email.dispose();
    _password.dispose();
    _confirm.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_password.text != _confirm.text) {
      setState(() => _error = 'Passwords do not match.');
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await widget.authApi.register(_username.text, _email.text, _password.text);
      if (mounted) setState(() => _sentTo = _email.text.trim());
    } on ApiException catch (e) {
      if (mounted) setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _resend() async {
    setState(() {
      _loading = true;
      _error = null;
      _notice = null;
    });
    try {
      final message = await widget.authApi.resendVerification(_sentTo!);
      if (mounted) setState(() => _notice = message);
    } on ApiException catch (e) {
      if (mounted) setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Widget _field(String label, TextEditingController controller, {bool hidden = false, String? hint}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(label, style: const TextStyle(fontWeight: FontWeight.w600)),
          const SizedBox(height: 4),
          TextField(controller: controller, obscureText: hidden, autocorrect: false),
          if (hint != null) ...[
            const SizedBox(height: 4),
            Text(hint, style: const TextStyle(fontSize: 13)),
          ],
        ],
      ),
    );
  }

  List<Widget> _formView() {
    return [
      _field('Username', _username, hint: '3-20 letters, numbers, or underscores.'),
      _field('Email', _email),
      _field('Password', _password, hidden: true, hint: 'At least 12 characters.'),
      _field('Confirm password', _confirm, hidden: true),
      if (_error != null) ...[
        Text(_error!, style: const TextStyle(color: AppColors.danger)),
        const SizedBox(height: 12),
      ],
      FilledButton(
        onPressed: _loading ? null : _submit,
        child: Text(_loading ? 'Creating account...' : 'Create account'),
      ),
      const SizedBox(height: 8),
      TextButton(
        onPressed: () => Navigator.of(context).pop(),
        child: const Text('Already have an account? Log in'),
      ),
    ];
  }

  // Accounts can't log in until the emailed verification link is opened.
  List<Widget> _checkEmailView() {
    return [
      Text(
        'We sent a verification link to $_sentTo. Open it to activate your account, then log in.',
        textAlign: TextAlign.center,
      ),
      const SizedBox(height: 24),
      if (_notice != null) ...[
        Text(_notice!, textAlign: TextAlign.center),
        const SizedBox(height: 12),
      ],
      if (_error != null) ...[
        Text(_error!, textAlign: TextAlign.center, style: const TextStyle(color: AppColors.danger)),
        const SizedBox(height: 12),
      ],
      FilledButton(
        onPressed: () => Navigator.of(context).pop(),
        child: const Text('Go to log in'),
      ),
      const SizedBox(height: 8),
      TextButton(
        onPressed: _loading ? null : _resend,
        child: Text(_loading ? 'Sending...' : 'Resend the email'),
      ),
    ];
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 384),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Text('Blackjack', textAlign: TextAlign.center, style: TextStyle(fontSize: 30)),
                  const SizedBox(height: 24),
                  Text(
                    _sentTo == null ? 'Create an account' : 'Check your email',
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 24),
                  ...(_sentTo == null ? _formView() : _checkEmailView()),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}