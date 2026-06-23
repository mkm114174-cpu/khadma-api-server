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
