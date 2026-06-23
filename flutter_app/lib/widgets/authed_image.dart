import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/auth/neon_auth_service.dart';
import '../core/storage/storage_urls.dart';
import '../../providers/auth_provider.dart';

/// Authenticated image from private object storage.
class AuthedImage extends ConsumerStatefulWidget {
  const AuthedImage({
    super.key,
    required this.objectPath,
    this.height = 200,
    this.borderRadius = 12,
    this.fit = BoxFit.cover,
  });

  final String? objectPath;
  final double height;
  final double borderRadius;
  final BoxFit fit;

  @override
  ConsumerState<AuthedImage> createState() => _AuthedImageState();
}

class _AuthedImageState extends ConsumerState<AuthedImage> {
  String? _token;

  @override
  void initState() {
    super.initState();
    _loadToken();
  }

  @override
  void didUpdateWidget(covariant AuthedImage oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.objectPath != widget.objectPath) _loadToken();
  }

  Future<void> _loadToken() async {
    final uri = storageUrl(widget.objectPath);
    if (uri == null) return;
    if (isPrivateStorageUrl(uri)) {
      final token = await ref.read(neonAuthServiceProvider).getAccessToken();
      if (mounted) setState(() => _token = token);
    } else {
      setState(() => _token = '');
    }
  }

  @override
  Widget build(BuildContext context) {
    final uri = storageUrl(widget.objectPath);
    if (uri == null) return const SizedBox.shrink();

    final private = isPrivateStorageUrl(uri);
    if (private && (_token == null || _token!.isEmpty)) {
      return SizedBox(
        height: widget.height,
        child: const Center(child: CircularProgressIndicator(strokeWidth: 2)),
      );
    }

    return ClipRRect(
      borderRadius: BorderRadius.circular(widget.borderRadius),
      child: CachedNetworkImage(
        imageUrl: uri,
        height: widget.height,
        width: double.infinity,
        fit: widget.fit,
        httpHeaders: private && _token != null && _token!.isNotEmpty
            ? {'Authorization': 'Bearer $_token'}
            : null,
        placeholder: (_, __) => Container(
          height: widget.height,
          color: Colors.white10,
          child: const Center(child: CircularProgressIndicator(strokeWidth: 2)),
        ),
        errorWidget: (_, __, ___) => Container(
          height: widget.height,
          color: Colors.white10,
          child: const Icon(Icons.broken_image, color: Colors.white38),
        ),
      ),
    );
  }
}
