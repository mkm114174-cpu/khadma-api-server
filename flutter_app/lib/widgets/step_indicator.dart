import 'package:flutter/material.dart';

import '../core/theme/app_colors.dart';

/// Simple 3-step progress — keeps the form easy without overwhelming the user.
class StepIndicator extends StatelessWidget {
  const StepIndicator({
    super.key,
    required this.currentStep,
    required this.labels,
    this.totalSteps = 3,
  });

  final int currentStep;
  final int totalSteps;
  final List<String> labels;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 12),
      child: Row(
        children: List.generate(totalSteps, (i) {
          final active = i <= currentStep;
          final isLast = i == totalSteps - 1;
          return Expanded(
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    children: [
                      AnimatedContainer(
                        duration: const Duration(milliseconds: 250),
                        width: 32,
                        height: 32,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: active ? AppColors.gold : Colors.white12,
                          border: Border.all(
                            color: active ? AppColors.gold : Colors.white24,
                          ),
                        ),
                        child: Center(
                          child: active
                              ? Icon(
                                  i < currentStep ? Icons.check : Icons.circle,
                                  size: i < currentStep ? 18 : 10,
                                  color: i < currentStep ? Colors.black : Colors.black,
                                )
                              : Text(
                                  '${i + 1}',
                                  style: const TextStyle(
                                    color: Colors.white54,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        labels.length > i ? labels[i] : '',
                        textAlign: TextAlign.center,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: active ? FontWeight.w600 : FontWeight.normal,
                          color: active ? AppColors.gold : Colors.white54,
                        ),
                      ),
                    ],
                  ),
                ),
                if (!isLast)
                  Expanded(
                    child: Container(
                      height: 2,
                      margin: const EdgeInsets.only(bottom: 28),
                      color: i < currentStep ? AppColors.gold : Colors.white12,
                    ),
                  ),
              ],
            ),
          );
        }),
      ),
    );
  }
}
