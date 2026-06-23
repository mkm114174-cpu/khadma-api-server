import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/theme/admin_theme.dart';
import '../providers/admin_providers.dart';

/// صورة/مستند محمي بـ Bearer token.
class AuthedImage extends ConsumerStatefulWidget {
  const AuthedImage({
    super.key,
    required this.url,
    this.height = 160,
    this.fit = BoxFit.cover,
  });

  final String url;
  final double height;
  final BoxFit fit;

  @override
  ConsumerState<AuthedImage> createState() => _AuthedImageState();
}

class _AuthedImageState extends ConsumerState<AuthedImage> {
  Uint8List? _bytes;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final token = await ref.read(clerkAuthProvider).getSessionToken();
      final dio = Dio();
      final headers = <String, dynamic>{};
      if (token != null && token.isNotEmpty) {
        headers['Authorization'] = 'Bearer $token';
      }
      final res = await dio.get<List<int>>(
        widget.url,
        options: Options(
          responseType: ResponseType.bytes,
          headers: headers,
        ),
      );
      if (mounted) {
        setState(() {
          _bytes = Uint8List.fromList(res.data ?? []);
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() {
        _error = 'تعذّر التحميل';
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return SizedBox(
        height: widget.height,
        child: const Center(
          child: CircularProgressIndicator(color: AdminColors.gold, strokeWidth: 2),
        ),
      );
    }
    if (_error != null || _bytes == null) {
      return SizedBox(
        height: widget.height,
        child: Center(
          child: Text(_error ?? '—', style: const TextStyle(color: AdminColors.muted)),
        ),
      );
    }
    return Image.memory(_bytes!, height: widget.height, width: double.infinity, fit: widget.fit);
  }
}
