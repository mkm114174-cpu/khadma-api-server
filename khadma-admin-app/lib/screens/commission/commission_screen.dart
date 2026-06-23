import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/admin_theme.dart';
import '../../providers/admin_providers.dart';
import '../../widgets/admin_drawer.dart';
import '../../widgets/status_chip.dart';
import '../../widgets/status_chip.dart' show formatMoney;

class CommissionScreen extends ConsumerStatefulWidget {
  const CommissionScreen({super.key});

  @override
  ConsumerState<CommissionScreen> createState() => _CommissionScreenState();
}

class _CommissionScreenState extends ConsumerState<CommissionScreen> {
  @override
  Widget build(BuildContext context) {
    final data = ref.watch(commissionProvider);
    final analytics = ref.watch(analyticsProvider);

    return AdminPage(
      title: 'العمولات والأرباح',
      actions: [
        IconButton(
          icon: const Icon(Icons.refresh),
          onPressed: () {
            ref.invalidate(commissionProvider);
            ref.invalidate(analyticsProvider);
          },
        ),
      ],
      child: data.when(
        loading: () => const Center(child: CircularProgressIndicator(color: AdminColors.gold)),
        error: (e, _) => Center(child: Text('$e')),
        data: (c) {
          final platform = analytics.valueOrNull?['platform'] as Map<String, dynamic>? ?? {};
          final providers = (c['providers'] as List?)?.cast<Map<String, dynamic>>() ?? [];

          return RefreshIndicator(
            color: AdminColors.gold,
            onRefresh: () async {
              ref.invalidate(commissionProvider);
              ref.invalidate(analyticsProvider);
            },
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                _statGrid([
                  _Stat('إجمالي العمولة', formatMoney(c['totalCommission']), AdminColors.gold),
                  _Stat('المُسدَّد', formatMoney(c['totalSettled']), AdminColors.success),
                  _Stat('المستحق', formatMoney(c['totalOutstanding']), AdminColors.warning),
                  _Stat('حجم الأعمال', formatMoney(platform['grossVolume']), Colors.white),
                  _Stat('صافي المزوّدين', formatMoney(platform['providerNetEarnings']), AdminColors.success),
                  _Stat('طلبات مكتملة', '${platform['completedJobs'] ?? 0}', Colors.white),
                ]),
                const SizedBox(height: 20),
                const Text('عمولات المزوّدين',
                    style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                const SizedBox(height: 8),
                if (providers.isEmpty)
                  const Text('لا بيانات بعد', style: TextStyle(color: AdminColors.muted)),
                ...providers.map((p) => Card(
                      child: ListTile(
                        title: Text('${p['name'] ?? p['serviceType'] ?? 'مزوّد'}',
                            style: const TextStyle(color: Colors.white)),
                        subtitle: Text(
                          'طلبات: ${p['jobsCount']} · مستحق: ${formatMoney(p['owed'])}',
                          style: const TextStyle(color: AdminColors.muted, fontSize: 12),
                        ),
                        trailing: p['blocked'] == true
                            ? const StatusChip(status: 'suspended')
                            : Text(formatMoney(p['totalCommission']),
                                style: const TextStyle(color: AdminColors.gold, fontWeight: FontWeight.bold)),
                        onTap: () => _settleDialog(p),
                      ),
                    )),
              ],
            ),
          );
        },
      ),
    );
  }

  Future<void> _settleDialog(Map<String, dynamic> p) async {
    final amountCtrl = TextEditingController(text: '${p['owed'] ?? 0}');
    final noteCtrl = TextEditingController();
    final ok = await showDialog<bool>(
      context: context,
      builder: (c) => AlertDialog(
        backgroundColor: AdminColors.card,
        title: const Text('تسجيل تسوية', style: TextStyle(color: Colors.white)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: amountCtrl,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'المبلغ ₪'),
            ),
            TextField(
              controller: noteCtrl,
              decoration: const InputDecoration(labelText: 'ملاحظة'),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(c, false), child: const Text('إلغاء')),
          FilledButton(
            onPressed: () => Navigator.pop(c, true),
            child: const Text('تسجيل'),
          ),
        ],
      ),
    );
    if (ok != true) return;
    final amount = int.tryParse(amountCtrl.text.trim()) ?? 0;
    if (amount < 1) return;
    await ref.read(adminApiProvider).recordSettlement(
          providerId: p['providerId'] as int,
          amount: amount,
          note: noteCtrl.text.trim().isEmpty ? null : noteCtrl.text.trim(),
        );
    ref.invalidate(commissionProvider);
    amountCtrl.dispose();
    noteCtrl.dispose();
  }

  Widget _statGrid(List<_Stat> stats) {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 10,
      crossAxisSpacing: 10,
      childAspectRatio: 1.6,
      children: stats
          .map((s) => Card(
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(s.value,
                          style: TextStyle(
                              color: s.color, fontSize: 18, fontWeight: FontWeight.bold)),
                      Text(s.label, style: const TextStyle(color: AdminColors.muted, fontSize: 11)),
                    ],
                  ),
                ),
              ))
          .toList(),
    );
  }
}

class _Stat {
  _Stat(this.label, this.value, this.color);
  final String label;
  final String value;
  final Color color;
}
