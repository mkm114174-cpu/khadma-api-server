import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:video_player/video_player.dart';

import '../core/storage/storage_urls.dart';
import '../core/theme/app_colors.dart';
import '../providers/auth_provider.dart';

/// Request video with auth headers — ported from RequestVideo.tsx
class RequestVideoPlayer extends ConsumerStatefulWidget {
  const RequestVideoPlayer({
    super.key,
    required this.objectPath,
    this.height = 220,
  });

  final String? objectPath;
  final double height;

  @override
  ConsumerState<RequestVideoPlayer> createState() => _RequestVideoPlayerState();
}

class _RequestVideoPlayerState extends ConsumerState<RequestVideoPlayer> {
  VideoPlayerController? _controller;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _init();
  }

  @override
  void didUpdateWidget(covariant RequestVideoPlayer oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.objectPath != widget.objectPath) {
      _disposeController();
      _init();
    }
  }

  Future<void> _init() async {
    final uri = storageUrl(widget.objectPath);
    if (uri == null) {
      setState(() {
        _loading = false;
        _error = 'no video';
      });
      return;
    }

    try {
      Map<String, String>? headers;
      if (isPrivateStorageUrl(uri)) {
        final token = await ref.read(neonAuthServiceProvider).getAccessToken();
        if (token != null && token.isNotEmpty) {
          headers = {'Authorization': 'Bearer $token'};
        }
      }

      final controller = VideoPlayerController.networkUrl(
        Uri.parse(uri),
        httpHeaders: headers ?? {},
      );
      await controller.initialize();
      controller.setLooping(false);
      if (!mounted) {
        controller.dispose();
        return;
      }
      setState(() {
        _controller = controller;
        _loading = false;
      });
    } catch (e) {
      if (mounted) {
        setState(() {
          _loading = false;
          _error = e.toString();
        });
      }
    }
  }

  void _disposeController() {
    _controller?.dispose();
    _controller = null;
  }

  @override
  void dispose() {
    _disposeController();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (widget.objectPath == null || widget.objectPath!.isEmpty) {
      return const SizedBox.shrink();
    }

    if (_loading) {
      return SizedBox(
        height: widget.height,
        child: const Center(
          child: CircularProgressIndicator(color: AppColors.gold),
        ),
      );
    }

    if (_error != null || _controller == null || !_controller!.value.isInitialized) {
      return Container(
        height: widget.height,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: Colors.white10,
          borderRadius: BorderRadius.circular(12),
        ),
        child: const Icon(Icons.videocam_off, color: Colors.white38, size: 40),
      );
    }

    final c = _controller!;
    return ClipRRect(
      borderRadius: BorderRadius.circular(12),
      child: Stack(
        alignment: Alignment.center,
        children: [
          SizedBox(
            height: widget.height,
            width: double.infinity,
            child: FittedBox(
              fit: BoxFit.cover,
              child: SizedBox(
                width: c.value.size.width,
                height: c.value.size.height,
                child: VideoPlayer(c),
              ),
            ),
          ),
          GestureDetector(
            onTap: () {
              setState(() {
                c.value.isPlaying ? c.pause() : c.play();
              });
            },
            child: Container(
              color: Colors.transparent,
              height: widget.height,
              width: double.infinity,
              child: Center(
                child: Icon(
                  c.value.isPlaying ? Icons.pause_circle_filled : Icons.play_circle_filled,
                  size: 56,
                  color: Colors.white.withValues(alpha: 0.9),
                ),
              ),
            ),
          ),
          if (c.value.isPlaying)
            Positioned(
              bottom: 8,
              right: 8,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.black54,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  _fmt(c.value.position, c.value.duration),
                  style: const TextStyle(color: Colors.white, fontSize: 11),
                ),
              ),
            ),
        ],
      ),
    );
  }

  String _fmt(Duration pos, Duration dur) {
    String f(Duration d) {
      final m = d.inMinutes.remainder(60).toString().padLeft(2, '0');
      final s = d.inSeconds.remainder(60).toString().padLeft(2, '0');
      return '$m:$s';
    }

    return '${f(pos)} / ${f(dur)}';
  }
}
