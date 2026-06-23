import 'package:flutter/material.dart';
import 'package:flutter_feather_icons/flutter_feather_icons.dart';

import '../core/theme/app_colors.dart';

/// Logo widget — ported from artifacts/khadma/components/LogoIcon.tsx
class LogoIcon extends StatelessWidget {
  const LogoIcon({super.key, this.size = 56});

  final double size;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        border: Border.all(color: AppColors.gold, width: 2),
        color: AppColors.gold.withValues(alpha: 0.12),
      ),
      child: Center(
        child: Container(
          width: size * 0.78,
          height: size * 0.78,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: AppColors.gold.withValues(alpha: 0.25),
          ),
          child: Icon(
            FeatherIcons.home,
            size: size * 0.38,
            color: AppColors.gold,
          ),
        ),
      ),
    );
  }
}
