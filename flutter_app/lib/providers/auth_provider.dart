import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../config/env.dart';
import '../core/api/api_client.dart';
import '../core/api/api_exception.dart';
import '../core/api/khadma_api.dart';
import '../core/auth/neon_auth_service.dart';
import '../core/utils/email.dart';
import '../models/user.dart';
import 'theme_provider.dart';

const _demoStorageKey = 'khadma:demo';

enum AuthStatus {
  loading,
  signedOut,
  needsProvision,
  ready,
  error,
  guest,
}

class ProvisionInput {
  const ProvisionInput({
    required this.name,
    required this.role,
    this.email,
    this.phone,
    this.commissionAgreed,
    this.language,
  });

  final String name;
  final String role;
  final String? email;
  final String? phone;
  final bool? commissionAgreed;
  final String? language;
}

class AuthState {
  const AuthState({
    required this.status,
    this.user,
    this.isGuest = false,
    this.loadError = false,
    this.hasLocalSession = false,
  });

  final AuthStatus status;
  final User? user;
  final bool isGuest;
  final bool loadError;
  /// True after OTP/sign-in until logout — prevents router sending user to onboarding.
  final bool hasLocalSession;

  bool get isLoggedIn => status == AuthStatus.ready || status == AuthStatus.guest;

  AppRole? get role {
    if (isGuest) return AppRole.customer;
    return user?.role;
  }

  String get name => isGuest ? 'Guest' : (user?.name ?? '');
  String get phone => isGuest ? '' : (user?.phone ?? '');
  String get address => isGuest ? '' : (user?.address ?? '');
  double? get lat => user?.lat;
  double? get lng => user?.lng;

  AuthState copyWith({
    AuthStatus? status,
    User? user,
    bool? isGuest,
    bool? loadError,
    bool? hasLocalSession,
    bool clearUser = false,
  }) {
    return AuthState(
      status: status ?? this.status,
      user: clearUser ? null : (user ?? this.user),
      isGuest: isGuest ?? this.isGuest,
      loadError: loadError ?? this.loadError,
      hasLocalSession: hasLocalSession ?? this.hasLocalSession,
    );
  }
}

final neonAuthServiceProvider = Provider<NeonAuthService>((ref) {
  return NeonAuthService(prefs: ref.watch(sharedPreferencesProvider));
});

final apiClientProvider = Provider<ApiClient>((ref) {
  final auth = ref.watch(neonAuthServiceProvider);
  final client = ApiClient(authTokenGetter: auth.getAccessToken);
  if (Env.apiBaseUrl.isNotEmpty) {
    client.setBaseUrl(Env.apiBaseUrl);
  }
  return client;
});

final khadmaApiProvider = Provider<KhadmaApi>((ref) {
  return KhadmaApi(ref.watch(apiClientProvider));
});

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(
    ref.watch(neonAuthServiceProvider),
    ref.watch(khadmaApiProvider),
    ref.watch(sharedPreferencesProvider),
  );
});

class AuthNotifier extends StateNotifier<AuthState> {
  AuthNotifier(this._auth, this._api, this._prefs)
      : super(const AuthState(status: AuthStatus.loading)) {
    _init();
  }

  final NeonAuthService _auth;
  final KhadmaApi _api;
  final SharedPreferences _prefs;

  bool _sessionLoaded = false;
  bool _guestResolved = false;
  bool _isSignedIn = false;

  Future<void> _init() async {
    final isGuest = _prefs.getString(_demoStorageKey) == 'true';
    _guestResolved = true;

    if (isGuest) {
      state = state.copyWith(status: AuthStatus.guest, isGuest: true);
      return;
    }

    await refreshSession();
    _sessionLoaded = true;
    await _resolveUser();
  }

  Future<void> refreshSession() async {
    final active = await _auth.hasActiveSession();
    _isSignedIn = active;
    if (active) {
      await _auth.refreshAccessToken();
    }
    _sessionLoaded = true;
    await _resolveUser();
  }

  /// Call immediately after OTP / email sign-in succeeds (matches Expo refresh()).
  Future<void> finalizeAuthAfterLogin() async {
    await _auth.ensureAccessToken(retries: 8);

    var active = await _auth.hasActiveSession();
    if (!active) {
      await Future<void>.delayed(const Duration(milliseconds: 500));
      active = await _auth.hasActiveSession();
    }

    if (!active) {
      final token = await _auth.ensureAccessToken(retries: 4);
      active = token != null && token.isNotEmpty;
    }

    if (!active) {
      final token = await _auth.getAccessToken();
      if (token != null && token.isNotEmpty) {
        _isSignedIn = true;
        _sessionLoaded = true;
        state = state.copyWith(
          hasLocalSession: true,
          status: AuthStatus.needsProvision,
          clearUser: true,
          loadError: false,
        );
        return;
      }
      _isSignedIn = false;
      _sessionLoaded = true;
      state = state.copyWith(
        status: AuthStatus.signedOut,
        clearUser: true,
        loadError: false,
      );
      return;
    }

    _isSignedIn = true;
    _sessionLoaded = true;
    state = state.copyWith(hasLocalSession: true);
    await _auth.ensureAccessToken(retries: 5);
    await _resolveUser(afterLogin: true);
  }

  Future<void> _resolveUser({bool afterLogin = false}) async {
    if (!_sessionLoaded || !_guestResolved) {
      state = state.copyWith(status: AuthStatus.loading);
      return;
    }

    if (state.isGuest) {
      state = state.copyWith(status: AuthStatus.guest);
      return;
    }

    if (!_isSignedIn) {
      final sessionToken = await _auth.ensureAccessToken(retries: 1);
      if (sessionToken != null && sessionToken.isNotEmpty) {
        _isSignedIn = true;
      } else {
        state = state.copyWith(
          status: AuthStatus.signedOut,
          clearUser: true,
          loadError: false,
        );
        return;
      }
    }

    state = state.copyWith(status: AuthStatus.loading);
    final maxAttempts = afterLogin ? 5 : 2;
    for (var attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        final user = await _api.getCurrentUser();
        state = state.copyWith(
          status: AuthStatus.ready,
          user: user,
          loadError: false,
        );
        return;
      } on ApiException catch (e) {
        if (e.status == 404) {
          state = state.copyWith(
            status: AuthStatus.needsProvision,
            clearUser: true,
            loadError: false,
          );
          return;
        }
        if (e.status == 401) {
          await _auth.ensureAccessToken(retries: 2);
          if (afterLogin && attempt >= maxAttempts - 1) {
            state = state.copyWith(
              status: AuthStatus.needsProvision,
              clearUser: true,
              loadError: false,
            );
            return;
          }
          continue;
        }
        if (e.status == 0 || e.status >= 500) {
          if (attempt < maxAttempts - 1) {
            await Future<void>.delayed(Duration(seconds: 5 + attempt * 2));
            continue;
          }
          if (afterLogin) {
            state = state.copyWith(
              status: AuthStatus.needsProvision,
              clearUser: true,
              loadError: false,
            );
            return;
          }
        }
        state = state.copyWith(
          status: AuthStatus.error,
          clearUser: true,
          loadError: true,
        );
        return;
      } catch (_) {
        if (attempt < maxAttempts - 1) {
          await Future<void>.delayed(Duration(seconds: 5 + attempt * 2));
          continue;
        }
        if (afterLogin) {
          state = state.copyWith(
            status: AuthStatus.needsProvision,
            clearUser: true,
            loadError: false,
          );
          return;
        }
        state = state.copyWith(
          status: AuthStatus.error,
          clearUser: true,
          loadError: true,
        );
        return;
      }
    }
  }

  Future<void> provision(ProvisionInput input) async {
    Object? lastError;
    for (var attempt = 0; attempt < 4; attempt++) {
      try {
        final token = await _auth.ensureAccessToken(retries: 5);
        if (token == null) {
          throw ApiException(status: 401, message: 'Missing auth token');
        }

        final user = await _api.provisionUser(
          name: input.name,
          role: input.role,
          email: input.email != null ? normalizeEmail(input.email!) : null,
          phone: input.phone,
          commissionAgreed: input.commissionAgreed,
          language: input.language,
        );
        state = state.copyWith(status: AuthStatus.ready, user: user);
        return;
      } catch (e) {
        lastError = e;
        if (attempt < 3) {
          await Future<void>.delayed(Duration(seconds: 4 + attempt * 2));
        }
      }
    }
    throw lastError ?? Exception('Provision failed');
  }

  Future<void> logout() async {
    await _prefs.remove(_demoStorageKey);
    await _auth.signOut();
    _isSignedIn = false;
    state = state.copyWith(
      status: AuthStatus.signedOut,
      isGuest: false,
      clearUser: true,
      loadError: false,
      hasLocalSession: false,
    );
  }

  Future<void> setGuest(bool guest) async {
    if (guest) {
      await _prefs.setString(_demoStorageKey, 'true');
      state = state.copyWith(status: AuthStatus.guest, isGuest: true, clearUser: true);
    } else {
      await _prefs.remove(_demoStorageKey);
      state = state.copyWith(isGuest: false);
      await _resolveUser();
    }
  }

  Future<void> refresh() async {
    await refreshSession();
    if (_isSignedIn) await _resolveUser();
  }

  Future<void> updateProfile({required String name, required String phone}) async {
    final user = await _api.updateCurrentUser(name: name, phone: phone);
    state = state.copyWith(user: user);
  }
}
