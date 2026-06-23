import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Main bottom-nav tab index (0=more hidden, 1=services, 2=home, 3=orders, 4=profile).
final mainTabIndexProvider = StateProvider<int>((ref) => 2);

void goToMainTab(WidgetRef ref, int index) {
  ref.read(mainTabIndexProvider.notifier).state = index;
}
