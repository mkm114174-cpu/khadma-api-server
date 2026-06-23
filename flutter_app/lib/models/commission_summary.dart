class CommissionSummary {
  const CommissionSummary({
    required this.owed,
    required this.totalCommission,
    required this.totalSettled,
    required this.threshold,
    required this.blocked,
    required this.jobsCount,
    required this.freeJobsTotal,
    required this.freeJobsRemaining,
  });

  final int owed;
  final int totalCommission;
  final int totalSettled;
  final int threshold;
  final bool blocked;
  final int jobsCount;
  final int freeJobsTotal;
  final int freeJobsRemaining;

  factory CommissionSummary.fromJson(Map<String, dynamic> json) {
    return CommissionSummary(
      owed: (json['owed'] as num?)?.toInt() ?? 0,
      totalCommission: (json['totalCommission'] as num?)?.toInt() ?? 0,
      totalSettled: (json['totalSettled'] as num?)?.toInt() ?? 0,
      threshold: (json['threshold'] as num?)?.toInt() ?? 500,
      blocked: json['blocked'] as bool? ?? false,
      jobsCount: (json['jobsCount'] as num?)?.toInt() ?? 0,
      freeJobsTotal: (json['freeJobsTotal'] as num?)?.toInt() ?? 5,
      freeJobsRemaining: (json['freeJobsRemaining'] as num?)?.toInt() ?? 0,
    );
  }
}
