import 'dart:io';

import 'package:dio/dio.dart';

import '../api/api_client.dart';

class UploadService {
  UploadService(this._client, {Dio? rawDio}) : _rawDio = rawDio ?? Dio();

  final ApiClient _client;
  final Dio _rawDio;

  Future<String> uploadFile({
    required String filePath,
    required String fileName,
    required String contentType,
  }) async {
    final file = File(filePath);
    final size = await file.length();
    final meta = await _client.fetch<Map<String, dynamic>>(
      '/storage/uploads/request-url',
      method: 'POST',
      body: {
        'name': fileName,
        'size': size > 0 ? size : 1,
        'contentType': contentType,
      },
    );
    final uploadUrl = meta['uploadURL'] as String;
    final objectPath = meta['objectPath'] as String;
    final bytes = await file.readAsBytes();
    final response = await _rawDio.put<void>(
      uploadUrl,
      data: bytes,
      options: Options(headers: {'Content-Type': contentType}),
    );
    if (response.statusCode == null || response.statusCode! >= 400) {
      throw Exception('Upload failed');
    }
    return objectPath;
  }
}
