import 'package:flutter/material.dart';
import '../api/api_client.dart';
import '../api/auth_api.dart';
import '../theme.dart';

class ForgotPasswordScreen extends StatefulWidget {
  final AuthApi authApi;
  const ForgotPasswordScreen({super.key, required this.authApi});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _email = TextEditingController();
  bool _loading = false;
  String? _error;
  String? _success;

  @override
  void dispose() {
    _email.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() {
      _loading = true;
      _error = null;
      _success = null;
    });
    try {
      await widget.authApi.forgotPassword(_email.text);
      // Same message whether or not the account exists, so emails can't be probed.
      if (mounted) setState(() => _success = 'If an account uses that email, a reset link is on its way.');
    } on ApiException catch (e) {
      if (mounted) setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
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
                  const Text(
                    'Reset your password',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 24),
                  const Text('Email', style: TextStyle(fontWeight: FontWeight.w600)),
                  const SizedBox(height: 4),
                  TextField(
                    controller: _email,
                    autocorrect: false,
                    keyboardType: TextInputType.emailAddress,
                  ),
                  if (_error != null) ...[
                    const SizedBox(height: 12),
                    Text(_error!, style: const TextStyle(color: AppColors.danger)),
                  ],
                  if (_success != null) ...[
                    const SizedBox(height: 12),
                    Text(_success!),
                  ],
                  const SizedBox(height: 24),
                  FilledButton(
                    onPressed: _loading ? null : _submit,
                    child: Text(_loading ? 'Sending...' : 'Send reset link'),
                  ),
                  const SizedBox(height: 8),
                  TextButton(
                    onPressed: () => Navigator.of(context).pop(),
                    child: const Text('Back to log in'),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
