import 'package:blackjack/api/token_storage.dart';

// Keeps the token in memory, since secure storage needs a real phone.
class FakeTokenStorage extends TokenStorage {
  String? value;
  FakeTokenStorage([this.value]);

  @override
  Future<String?> read() async => value;

  @override
  Future<void> save(String token) async => value = token;

  @override
  Future<void> clear() async => value = null;
}
