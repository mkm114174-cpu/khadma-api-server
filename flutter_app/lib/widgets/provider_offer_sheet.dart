import 'package:flutter/material.dart';
import 'package:flutter_feather_icons/flutter_feather_icons.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/theme/app_colors.dart';
import '../core/utils/routing.dart';
import '../models/service_request.dart';
import '../providers/auth_provider.dart';
import '../providers/language_provider.dart';
import '../providers/request_providers.dart';
import '../widgets/authed_image.dart';
import '../widgets/request_video_player.dart';

/// Provider offer sheet — watch video first, then set price.
class ProviderOfferSheet extends ConsumerStatefulWidget {
  const ProviderOfferSheet({
    super.key,
    required this.request,
    this.distanceKm,
    required this.onSubmitted,
  });

  final ServiceRequest request;
  final double? distanceKm;
  final VoidCallback onSubmitted;

  static Future<void> show(
    BuildContext context, {
    required ServiceRequest request,
    double? distanceKm,
    required VoidCallback onSubmitted,
  }) {
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.tabBarBg,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
        child: ProviderOfferSheet(
          request: request,
          distanceKm: distanceKm,
          onSubmitted: onSubmitted,
        ),
      ),
    );
  }

  @override
  ConsumerState<ProviderOfferSheet> createState() => _ProviderOfferSheetState();
}

class _ProviderOfferSheetState extends ConsumerState<ProviderOfferSheet> {
  final _priceController = TextEditingController();
  final _messageController = TextEditingController();
  bool _videoWatched = false;
  bool _submitting = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    if (widget.request.videoUrl == null) _videoWatched = true;
  }

  @override
  void dispose() {
    _priceController.dispose();
    _messageController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final t = ref.read(appStringsProvider);
    final price = int.tryParse(_priceController.text.trim());
    if (price == null || price < 0) {
      setState(() => _error = t.provider.offerInvalidPrice);
      return;
    }
    if (widget.request.videoUrl != null && !_videoWatched) {
      setState(() => _error = t.provider.watchVideoHint);
      return;
    }

    setState(() {
      _submitting = true;
      _error = null;
    });

    try {
      await ref.read(khadmaApiProvider).createOffer(
            requestId: widget.request.id,
            price: price,
            message: _messageController.text.trim().isEmpty
                ? null
                : _messageController.text.trim(),
            availableTime: DateTime.now().toUtc().toIso8601String(),
          );
      if (mounted) {
        Navigator.pop(context);
        widget.onSubmitted();
      }
    } catch (_) {
      setState(() => _error = t.provider.offerSubmitFailed);
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = ref.watch(appStringsProvider);
    final req = widget.request;

    return DraggableScrollableSheet(
      expand: false,
      initialChildSize: 0.88,
      minChildSize: 0.5,
      maxChildSize: 0.95,
      builder: (_, scrollController) {
        return ListView(
          controller: scrollController,
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.white24,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: Text(
                    t.provider.offerTitle,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: const Icon(FeatherIcons.x, color: Colors.white54),
                ),
              ],
            ),
            if (widget.distanceKm != null)
              Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Row(
                  children: [
                    const Icon(FeatherIcons.mapPin, size: 14, color: AppColors.gold),
                    const SizedBox(width: 6),
                    Text(
                      '${t.provider.distanceToCustomer}: ${formatDistance(widget.distanceKm!)}',
                      style: const TextStyle(color: AppColors.gold, fontSize: 13),
                    ),
                  ],
                ),
              ),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: AppColors.gold.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: AppColors.gold.withValues(alpha: 0.25)),
              ),
              child: Row(
                children: [
                  const Icon(FeatherIcons.info, size: 16, color: AppColors.gold),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      t.provider.watchVideoHint,
                      style: const TextStyle(color: Colors.white70, fontSize: 13),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),
            if (req.imageUrl != null) ...[
              AuthedImage(objectPath: req.imageUrl, height: 180),
              const SizedBox(height: 12),
            ],
            if (req.videoUrl != null) ...[
              Text(t.req.watchVideo,
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
              const SizedBox(height: 8),
              RequestVideoPlayer(
                objectPath: req.videoUrl,
                height: 220,
              ),
              const SizedBox(height: 8),
              CheckboxListTile(
                value: _videoWatched,
                onChanged: (v) => setState(() => _videoWatched = v ?? false),
                activeColor: AppColors.gold,
                title: Text(
                  '✓ ${t.req.watchVideo}',
                  style: const TextStyle(color: Colors.white, fontSize: 14),
                ),
                controlAffinity: ListTileControlAffinity.leading,
              ),
              const SizedBox(height: 8),
            ],
            if (req.description != null) ...[
              Text(req.description!, style: const TextStyle(color: Colors.white70)),
              const SizedBox(height: 12),
            ],
            if (req.address != null)
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(FeatherIcons.mapPin, size: 14, color: AppColors.gold),
                  const SizedBox(width: 8),
                  Expanded(child: Text(req.address!, style: const TextStyle(color: Colors.white))),
                ],
              ),
            const SizedBox(height: 20),
            TextField(
              controller: _priceController,
              keyboardType: TextInputType.number,
              style: const TextStyle(color: Colors.white, fontSize: 18),
              decoration: InputDecoration(
                labelText: t.provider.priceLabel,
                labelStyle: const TextStyle(color: AppColors.gold),
                filled: true,
                fillColor: Colors.white.withValues(alpha: 0.06),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _messageController,
              maxLines: 2,
              style: const TextStyle(color: Colors.white),
              decoration: InputDecoration(
                labelText: t.provider.messageLabel,
                labelStyle: TextStyle(color: Colors.white.withValues(alpha: 0.6)),
                filled: true,
                fillColor: Colors.white.withValues(alpha: 0.06),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
            if (_error != null) ...[
              const SizedBox(height: 8),
              Text(_error!, style: const TextStyle(color: Colors.redAccent)),
            ],
            const SizedBox(height: 16),
            FilledButton(
              onPressed: _submitting ? null : _submit,
              style: FilledButton.styleFrom(
                backgroundColor: AppColors.gold,
                foregroundColor: Colors.black,
                minimumSize: const Size(double.infinity, 52),
              ),
              child: _submitting
                  ? const SizedBox(
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : Text(t.provider.submitOffer, style: const TextStyle(fontWeight: FontWeight.bold)),
            ),
          ],
        );
      },
    );
  }
}
