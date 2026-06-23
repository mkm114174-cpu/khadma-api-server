import 'package:flutter/material.dart';
import 'package:flutter_feather_icons/flutter_feather_icons.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/app_colors.dart';
import '../../models/commission_summary.dart';
import '../../models/service_request.dart';
import '../../providers/auth_provider.dart';
import '../../providers/language_provider.dart';
import '../../providers/request_providers.dart';

const _commissionRate = 0.07;

class ProviderEarningsScreen extends ConsumerWidget {
  const ProviderEarningsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isRtl = ref.watch(isRtlProvider);
    final providerAsync = ref.watch(myProviderProvider);
    final commissionAsync = ref.watch(myCommissionProvider);
    final jobsAsync = ref.watch(providerCompletedJobsProvider);

    return providerAsync.when(
      loading: () => const Center(
        child: CircularProgressIndicator(color: AppColors.gold),
      ),
      error: (_, __) => Center(
        child: Text(isRtl ? 'تعذّر التحميل' : 'Failed to load'),
      ),
      data: (provider) {
        if (provider == null) {
          return Center(
            child: Text(isRtl ? 'لا يوجد ملف مزوّد' : 'No provider profile'),
          );
        }

        final jobs = jobsAsync.valueOrNull ?? [];
        final commission = commissionAsync.valueOrNull;
        final gross = jobs.fold<int>(0, (s, r) => s + _jobAmount(r));
        final fee = jobs.fold<int>(
          0,
          (s, r) => s + (commission?.freeJobsRemaining == 0 ? _jobFee(r) : 0),
        );
        final net = gross - fee;

        return RefreshIndicator(
          color: AppColors.gold,
          onRefresh: () async {
            ref.invalidate(myCommissionProvider);
            ref.invalidate(providerCompletedJobsProvider);
          },
          child: ListView(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 100),
            children: [
              Text(
                isRtl ? 'الأرباح' : 'Earnings',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 16),
              _HeroCard(
                net: net,
                gross: gross,
                fee: fee,
                isRtl: isRtl,
              ),
              if (commission != null) ...[
                const SizedBox(height: 12),
                _InfoCard(
                  icon: FeatherIcons.gift,
                  title: isRtl ? 'الطلبات المجانية' : 'Free jobs',
                  value: isRtl
                      ? '${commission.freeJobsRemaining} من ${commission.freeJobsTotal} متبقية'
                      : '${commission.freeJobsRemaining} of ${commission.freeJobsTotal} left',
                ),
                if (commission.blocked)
                  _InfoCard(
                    icon: FeatherIcons.alertTriangle,
                    title: isRtl ? 'محظور مؤقتاً' : 'Blocked',
                    value: isRtl
                        ? 'العمولة المستحقة: ${commission.owed} ₪'
                        : 'Owed: ${commission.owed} ₪',
                    danger: true,
                  )
                else
                  _InfoCard(
                    icon: FeatherIcons.percent,
                    title: isRtl ? 'عمولة المنصة' : 'Platform fee',
                    value: isRtl
                        ? 'مستحق: ${commission.owed} ₪ / حد ${commission.threshold} ₪'
                        : 'Owed: ${commission.owed} ₪ / limit ${commission.threshold} ₪',
                  ),
              ],
              const SizedBox(height: 20),
              Text(
                isRtl ? 'الطلبات المكتملة' : 'Completed jobs',
                style: const TextStyle(
                  color: AppColors.gold,
                  fontWeight: FontWeight.w700,
                  fontSize: 16,
                ),
              ),
              const SizedBox(height: 8),
              if (jobs.isEmpty)
                Padding(
                  padding: const EdgeInsets.all(24),
                  child: Text(
                    isRtl ? 'لا توجد طلبات مكتملة بعد' : 'No completed jobs yet',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Colors.white.withValues(alpha: 0.5)),
                  ),
                )
              else
                ...jobs.map((j) => _JobRow(request: j, isRtl: isRtl)),
            ],
          ),
        );
      },
    );
  }

  static int _jobAmount(ServiceRequest r) => r.priceMax ?? r.priceMin ?? 0;

  static int _jobFee(ServiceRequest r) =>
      (_jobAmount(r) * _commissionRate).round();
}

class _HeroCard extends StatelessWidget {
  const _HeroCard({
    required this.net,
    required this.gross,
    required this.fee,
    required this.isRtl,
  });

  final int net;
  final int gross;
  final int fee;
  final bool isRtl;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(18),
        gradient: const LinearGradient(
          colors: [Color(0xFF2A2418), Color(0xFF1A1814)],
        ),
        border: Border.all(color: AppColors.gold.withValues(alpha: 0.35)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Text(
            isRtl ? 'صافي الأرباح' : 'Net earnings',
            style: TextStyle(color: Colors.white.withValues(alpha: 0.7)),
          ),
          Text(
            '$net ₪',
            style: const TextStyle(
              color: AppColors.gold,
              fontSize: 32,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('${isRtl ? 'إجمالي' : 'Gross'}: $gross ₪',
                  style: const TextStyle(color: Colors.white70, fontSize: 13)),
              Text('${isRtl ? 'عمولة' : 'Fee'}: $fee ₪',
                  style: const TextStyle(color: Colors.white70, fontSize: 13)),
            ],
          ),
        ],
      ),
    );
  }
}

class _InfoCard extends StatelessWidget {
  const _InfoCard({
    required this.icon,
    required this.title,
    required this.value,
    this.danger = false,
  });

  final IconData icon;
  final String title;
  final String value;
  final bool danger;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: danger ? Colors.redAccent.withValues(alpha: 0.4) : Colors.white12,
        ),
      ),
      child: Row(
        children: [
          Icon(icon, color: danger ? Colors.redAccent : AppColors.gold, size: 20),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
                Text(value, style: TextStyle(color: Colors.white.withValues(alpha: 0.65), fontSize: 12)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _JobRow extends StatelessWidget {
  const _JobRow({required this.request, required this.isRtl});

  final ServiceRequest request;
  final bool isRtl;

  @override
  Widget build(BuildContext context) {
    final amount = ProviderEarningsScreen._jobAmount(request);
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFF1E1E28),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Text(
            '${request.requestNumber}',
            style: const TextStyle(color: AppColors.gold, fontWeight: FontWeight.bold),
          ),
          const Spacer(),
          Text(
            '$amount ₪',
            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
          ),
        ],
      ),
    );
  }
}

final myCommissionProvider = FutureProvider<CommissionSummary?>((ref) async {
  try {
    return await ref.watch(khadmaApiProvider).getMyCommission();
  } catch (_) {
    return null;
  }
});

final providerCompletedJobsProvider = FutureProvider<List<ServiceRequest>>((ref) async {
  final provider = await ref.watch(myProviderProvider.future);
  if (provider == null) return [];
  final all = await ref.watch(khadmaApiProvider).listRequests(providerId: provider.id);
  final completed = all.where((r) => r.status == 'completed').toList();
  completed.sort((a, b) => b.updatedAt.compareTo(a.updatedAt));
  return completed;
});
