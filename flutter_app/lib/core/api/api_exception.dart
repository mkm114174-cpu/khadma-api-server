/// API error — mirrors lib/api-client-react/src/custom-fetch.ts ApiError
class ApiException implements Exception {
  ApiException({
    required this.status,
    required this.message,
    this.data,
    this.url,
    this.method,
  });

  final int status;
  final String message;
  final dynamic data;
  final String? url;
  final String? method;

  @override
  String toString() => 'ApiException($status): $message';
}

class ResponseParseException implements Exception {
  ResponseParseException(this.message, {this.cause});

  final String message;
  final Object? cause;

  @override
  String toString() => message;
}
