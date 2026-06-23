import 'package:flutter/material.dart';

import '../core/theme/admin_theme.dart';

class StatusChip extends StatelessWidget {
  const StatusChip({super.key, required this.status});

  final String status;

  @override
  Widget build(BuildContext context) {
    final (label, color) = _map(status);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withValues(alpha: 0.35)),
      ),
      child: Text(label,
          style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.bold)),
    );
  }

  (String, Color) _map(String s) => switch (s) {
        'approved' => ('مقبول', AdminColors.success),
        'rejected' => ('مرفوض', AdminColors.danger),
        'pending' => ('بانتظار', AdminColors.warning),
        'under_review' => ('قيد المراجعة', AdminColors.warning),
        'needs_info' => ('معلومات', Colors.orange),
        'open' => ('مفتوحة', AdminColors.warning),
        'resolved' => ('محلولة', AdminColors.success),
        'active' => ('نشط', AdminColors.success),
        'completed' => ('مكتمل', AdminColors.success),
        'cancelled' => ('ملغي', AdminColors.danger),
        'in_progress' => ('قيد التنفيذ', Colors.blueAccent),
        'suspended' => ('موقوف', AdminColors.danger),
        'closed' => ('مغلق', AdminColors.danger),
        _ => (s, AdminColors.muted),
      };
}

String formatMoney(num? n) => '₪${(n ?? 0).toStringAsFixed(0)}';

String formatDate(dynamic iso) {
  final d = DateTime.tryParse('$iso');
  if (d == null) return '—';
  return '${d.day}/${d.month}/${d.year} ${d.hour}:${d.minute.toString().padLeft(2, '0')}';
}
