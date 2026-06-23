import '../../config/env.dart';

/// Build API storage URL — ported from artifacts/khadma/lib/storage.ts
String? storageUrl(String? objectPath) {
  if (objectPath == null || objectPath.isEmpty) return null;
  if (objectPath.startsWith('http://') || objectPath.startsWith('https://')) {
    return objectPath;
  }
  final base = Env.apiBaseUrl;
  if (base.isEmpty) return objectPath;
  final path = objectPath.startsWith('/') ? objectPath : '/$objectPath';
  return '$base/api/storage$path';
}

bool isPrivateStorageUrl(String? uri) {
  if (uri == null || uri.isEmpty) return false;
  final base = Env.apiBaseUrl;
  if (base.isNotEmpty) {
    return uri.startsWith('$base/api/storage/objects/');
  }
  return uri.startsWith('/api/storage/objects/');
}
