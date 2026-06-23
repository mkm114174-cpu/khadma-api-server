import 'dart:async';

import 'package:flutter/material.dart';

import '../core/theme/app_colors.dart';
import '../l10n/app_strings.dart';
import 'logo_icon.dart';

/// Branded welcome animation — ported from artifacts/khadma/components/WelcomeSplash.tsx
class WelcomeSplash extends StatefulWidget {
  const WelcomeSplash({
    super.key,
    this.name,
    this.durationMs = 2500,
    required this.onDone,
    required this.strings,
  });

  final String? name;
  /// Auto-dismiss after at most 3 seconds (tap Continue to skip sooner).
  final int durationMs;
  final VoidCallback onDone;
  final AppStrings strings;

  @override
  State<WelcomeSplash> createState() => _WelcomeSplashState();
}

class _WelcomeSplashState extends State<WelcomeSplash>
    with TickerProviderStateMixin {
  late final AnimationController _logoCtrl;
  late final AnimationController _ringCtrl;
  late final AnimationController _glowCtrl;
  late final AnimationController _progressCtrl;
  late final Animation<double> _logoScale;
  late final Animation<double> _logoOpacity;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    final ms = widget.durationMs.clamp(800, 3000);
    _logoCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 700),
    );
    _ringCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2600),
    )..repeat();
    _glowCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat(reverse: true);
    _progressCtrl = AnimationController(
      vsync: this,
      duration: Duration(
        milliseconds: (ms - 300).clamp(500, ms),
      ),
    );

    _logoScale = Tween<double>(begin: 0.5, end: 1).animate(
      CurvedAnimation(parent: _logoCtrl, curve: Curves.elasticOut),
    );
    _logoOpacity = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _logoCtrl, curve: Curves.easeOut),
    );

    _logoCtrl.forward();
    _progressCtrl.forward();
    _timer = Timer(Duration(milliseconds: ms), widget.onDone);
  }

  @override
  void dispose() {
    _timer?.cancel();
    _logoCtrl.dispose();
    _ringCtrl.dispose();
    _glowCtrl.dispose();
    _progressCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final tagline = widget.name != null && widget.name!.isNotEmpty
        ? '${widget.strings.auth.welcomeBack}، ${widget.name}'
        : widget.strings.auth.welcomeBack;

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: SafeArea(
        child: Column(
          children: [
            const Spacer(),
            SizedBox(
              width: 180,
              height: 180,
              child: Stack(
                alignment: Alignment.center,
                children: [
                  AnimatedBuilder(
                    animation: _glowCtrl,
                    builder: (_, __) {
                      final scale = 1 + _glowCtrl.value * 0.35;
                      final opacity = 0.45 - _glowCtrl.value * 0.33;
                      return Transform.scale(
                        scale: scale,
                        child: Container(
                          width: 150,
                          height: 150,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: AppColors.gold.withValues(alpha: opacity),
                          ),
                        ),
                      );
                    },
                  ),
                  RotationTransition(
                    turns: _ringCtrl,
                    child: Container(
                      width: 168,
                      height: 168,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border(
                          top: BorderSide(color: AppColors.gold, width: 3),
                          right: BorderSide(
                            color: AppColors.gold.withValues(alpha: 0.33),
                            width: 3,
                          ),
                          left: BorderSide(color: Colors.transparent, width: 3),
                          bottom: BorderSide(color: Colors.transparent, width: 3),
                        ),
                      ),
                    ),
                  ),
                  FadeTransition(
                    opacity: _logoOpacity,
                    child: ScaleTransition(
                      scale: _logoScale,
                      child: Container(
                        width: 104,
                        height: 104,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: AppColors.gold.withValues(alpha: 0.15),
                          border: Border.all(color: AppColors.gold, width: 2),
                        ),
                        child: const Center(child: LogoIcon(size: 80)),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            FadeTransition(
              opacity: _logoOpacity,
              child: Text(
                widget.strings.auth.appName,
                style: const TextStyle(
                  fontSize: 40,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 2,
                ),
              ),
            ),
            const SizedBox(height: 8),
            FadeTransition(
              opacity: _logoOpacity,
              child: Text(
                tagline,
                style: TextStyle(
                  fontSize: 16,
                  color: Theme.of(context).hintColor,
                ),
              ),
            ),
            const Spacer(),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 64),
              child: Column(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(2),
                    child: AnimatedBuilder(
                      animation: _progressCtrl,
                      builder: (_, __) => LinearProgressIndicator(
                        value: _progressCtrl.value,
                        minHeight: 4,
                        backgroundColor: Theme.of(context).dividerColor,
                        color: AppColors.gold,
                      ),
                    ),
                  ),
                  const SizedBox(height: 14),
                  Text(
                    widget.strings.auth.appName,
                    style: TextStyle(
                      fontSize: 13,
                      color: Theme.of(context).hintColor,
                    ),
                  ),
                  const SizedBox(height: 8),
                  TextButton(
                    onPressed: widget.onDone,
                    child: Text(
                      widget.strings.auth.continueBtn,
                      style: const TextStyle(
                        color: AppColors.gold,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }
}
