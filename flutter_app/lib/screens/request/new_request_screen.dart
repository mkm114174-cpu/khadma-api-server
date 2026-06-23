import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_feather_icons/flutter_feather_icons.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geocoding/geocoding.dart';
import 'package:geolocator/geolocator.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';

import '../../constants/service_catalog.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/phone.dart';
import '../../providers/auth_provider.dart';
import '../../providers/language_provider.dart';
import '../../providers/request_providers.dart';
import '../../router/app_router.dart';
import '../../widgets/location_map_preview.dart';
import '../../widgets/step_indicator.dart';

const _timeOptions = [
  ('asap', 'timeAsap'),
  ('todayEvening', 'timeTodayEve'),
  ('tomorrowMorning', 'timeTomMorning'),
  ('tomorrowEvening', 'timeTomEve'),
  ('custom', 'timeCustom'),
];

/// 3-step request wizard
class NewRequestScreen extends ConsumerStatefulWidget {
  const NewRequestScreen({super.key, this.category = 'other'});

  final String category;

  @override
  ConsumerState<NewRequestScreen> createState() => _NewRequestScreenState();
}

class _NewRequestScreenState extends ConsumerState<NewRequestScreen> {
  final _pageController = PageController();
  final _descriptionController = TextEditingController();
  final _addressController = TextEditingController();
  final _phoneController = TextEditingController();
  final _picker = ImagePicker();

  int _step = 0;
  String _preferredTime = 'asap';
  DateTime? _customDateTime;
  bool _includesSpareParts = false;
  bool _isLocating = false;
  bool _submitting = false;
  bool _success = false;
  int? _createdId;

  XFile? _image;
  XFile? _video;
  double? _lat;
  double? _lng;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final savedPhone = ref.read(authProvider).phone;
      if (savedPhone.isNotEmpty && _phoneController.text.isEmpty) {
        _phoneController.text = savedPhone;
      }
    });
  }

  @override
  void dispose() {
    _pageController.dispose();
    _descriptionController.dispose();
    _addressController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  String _timeLabel(String key, dynamic t) {
    return switch (key) {
      'timeAsap' => t.req.timeAsap,
      'timeTodayEve' => t.req.timeTodayEve,
      'timeTomMorning' => t.req.timeTomMorning,
      'timeTomEve' => t.req.timeTomEve,
      'timeCustom' => t.req.timeCustom,
      _ => key,
    };
  }

  Future<void> _pickMedia(ImageSource source, {required bool video}) async {
    final t = ref.read(appStringsProvider);
    final XFile? file;
    if (video) {
      file = await _picker.pickVideo(source: source);
    } else {
      file = await _picker.pickImage(source: source, maxWidth: 1920, imageQuality: 85);
    }
    if (file == null) return;
    setState(() {
      if (video) {
        _video = file;
      } else {
        _image = file;
      }
    });
  }

  void _snack(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
  }

  Future<void> _getLocation() async {
    final t = ref.read(appStringsProvider);
    setState(() => _isLocating = true);
    try {
      var perm = await Geolocator.checkPermission();
      if (perm == LocationPermission.denied) {
        perm = await Geolocator.requestPermission();
      }
      if (perm == LocationPermission.denied ||
          perm == LocationPermission.deniedForever) {
        _snack(t.home.locationDenied);
        return;
      }
      final pos = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.best,
          timeLimit: Duration(seconds: 20),
        ),
      );
      if (!mounted) return;
      setState(() {
        _lat = pos.latitude;
        _lng = pos.longitude;
      });
      final marks = await placemarkFromCoordinates(pos.latitude, pos.longitude);
      if (marks.isNotEmpty) {
        final p = marks.first;
        final parts = [p.street, p.subLocality, p.locality]
            .where((e) => e != null && e.isNotEmpty)
            .cast<String>();
        if (parts.isNotEmpty) {
          _addressController.text = parts.join('، ');
        }
      }
    } catch (_) {
      _snack(t.req.locationFailed);
    } finally {
      if (mounted) setState(() => _isLocating = false);
    }
  }

  bool _validateStep(int step) {
    final t = ref.read(appStringsProvider);
    switch (step) {
      case 0:
        if (_descriptionController.text.trim().isEmpty) {
          _snack(t.req.descRequired);
          return false;
        }
        if (_image == null && _video == null) {
          _snack(t.req.mediaRequired);
          return false;
        }
        return true;
      case 1:
        if (_lat == null || _lng == null) {
          _snack(t.req.locationGpsRequired);
          return false;
        }
        if (_addressController.text.trim().isEmpty) {
          _snack(t.req.addressRequired);
          return false;
        }
        if (normalizeIlPhone(_phoneController.text) == null) {
          _snack(t.req.phoneRequired);
          return false;
        }
        return true;
      default:
        if (_preferredTime == 'custom' && _customDateTime == null) {
          _snack(t.req.timeCustom);
          return false;
        }
        return true;
    }
  }

  void _next() {
    if (!_validateStep(_step)) return;
    if (_step == 0) {
      setState(() => _step++);
      _pageController.nextPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
      );
      if (_lat == null) _getLocation();
      return;
    }
    if (_step < 2) {
      setState(() => _step++);
      _pageController.nextPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
      );
    } else {
      _submit();
    }
  }

  void _back() {
    if (_step == 0) {
      context.pop();
      return;
    }
    setState(() => _step--);
    _pageController.previousPage(
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeOut,
    );
  }

  Future<void> _submit() async {
    final t = ref.read(appStringsProvider);
    final auth = ref.read(authProvider);

    if (auth.status == AuthStatus.guest) {
      _snack(t.req.guestSignIn);
      context.push(AppRoutes.signIn);
      return;
    }

    if (!_validateStep(0) || !_validateStep(1)) return;
    if (_lat == null || _lng == null) {
      _snack(t.req.locationGpsRequired);
      return;
    }

    final skillsAsync = ref.read(skillsProvider);
    final skills = skillsAsync.valueOrNull;
    if (skills == null || skills.isEmpty) {
      _snack(t.req.submitFailed);
      return;
    }

    final catalog = skills
        .map((s) => (id: s.id, slug: s.slug, category: s.category))
        .toList();
    final skillId = resolveCategorySkillId(widget.category, catalog);
    if (skillId == null) {
      _snack(t.req.submitFailed);
      return;
    }

    final phone = normalizeIlPhone(_phoneController.text)!;
    setState(() => _submitting = true);

    try {
      final api = ref.read(khadmaApiProvider);
      final upload = ref.read(uploadServiceProvider);

      if (phone != auth.phone) {
        await api.updateCurrentUser(phone: phone);
        await ref.read(authProvider.notifier).refresh();
      }

      String? imageUrl;
      String? videoUrl;

      if (_image != null) {
        imageUrl = await upload.uploadFile(
          filePath: _image!.path,
          fileName: _image!.name,
          contentType: _image!.mimeType ?? 'image/jpeg',
        );
      }
      if (_video != null) {
        videoUrl = await upload.uploadFile(
          filePath: _video!.path,
          fileName: _video!.name,
          contentType: _video!.mimeType ?? 'video/mp4',
        );
      }

      final when = _preferredTime == 'custom' && _customDateTime != null
          ? _customDateTime!
          : timeFromPreset(_preferredTime);
      final iso = when.toUtc().toIso8601String();

      final result = await api.createRequest(
        skillId: skillId,
        description: _descriptionController.text.trim(),
        address: _addressController.text.trim(),
        lat: _lat!,
        lng: _lng!,
        imageUrl: imageUrl,
        videoUrl: videoUrl,
        includesSpareParts: _includesSpareParts,
        preferredTime: iso,
        scheduledTime: _preferredTime == 'custom' ? iso : null,
      );

      ref.invalidate(myRequestsProvider);
      setState(() {
        _success = true;
        _createdId = result.id;
      });
    } catch (_) {
      _snack(t.req.submitFailed);
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = ref.watch(appStringsProvider);
    final categoryLabel = t.categoryLabel(widget.category);

    if (_success) {
      return _SuccessView(
        t: t,
        onView: () {
          if (_createdId != null) context.go('/request/$_createdId');
        },
        onHome: () => context.go(AppRoutes.tabs),
      );
    }

    return Scaffold(
      backgroundColor: AppColors.tabBarBg,
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 8),
              child: Row(
                children: [
                  IconButton(
                    onPressed: _back,
                    icon: Icon(
                      Directionality.of(context) == TextDirection.rtl
                          ? FeatherIcons.arrowRight
                          : FeatherIcons.arrowLeft,
                      color: Colors.white,
                    ),
                  ),
                  Expanded(
                    child: Text(
                      t.req.newTitle,
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  const SizedBox(width: 48),
                ],
              ),
            ),
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: AppColors.gold.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.gold.withValues(alpha: 0.3)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(FeatherIcons.tag, size: 16, color: AppColors.gold),
                  const SizedBox(width: 8),
                  Text(
                    categoryLabel,
                    style: const TextStyle(
                      color: AppColors.gold,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
            StepIndicator(
              currentStep: _step,
              labels: [t.req.stepWhat, t.req.stepWhere, t.req.stepWhen],
            ),
            Expanded(
              child: PageView(
                controller: _pageController,
                physics: const NeverScrollableScrollPhysics(),
                children: [
                  _StepWhat(
                    t: t,
                    descriptionController: _descriptionController,
                    image: _image,
                    video: _video,
                    includesSpareParts: _includesSpareParts,
                    onPickImage: () => _showMediaSheet(video: false),
                    onPickVideo: () => _showMediaSheet(video: true),
                    onRemoveImage: () => setState(() => _image = null),
                    onRemoveVideo: () => setState(() => _video = null),
                    onSpareParts: (v) => setState(() => _includesSpareParts = v),
                  ),
                  _StepWhere(
                    t: t,
                    addressController: _addressController,
                    phoneController: _phoneController,
                    isLocating: _isLocating,
                    lat: _lat,
                    lng: _lng,
                    onGps: _getLocation,
                  ),
                  _StepWhen(
                    t: t,
                    preferredTime: _preferredTime,
                    customDateTime: _customDateTime,
                    onCustomDateTime: (dt) => setState(() => _customDateTime = dt),
                    categoryLabel: categoryLabel,
                    description: _descriptionController.text,
                    address: _addressController.text,
                    phone: _phoneController.text,
                    hasMedia: _image != null || _video != null,
                    onTime: (id) => setState(() => _preferredTime = id),
                    timeLabel: (key) => _timeLabel(key, t),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(16),
              child: FilledButton(
                onPressed: _submitting ? null : _next,
                style: FilledButton.styleFrom(
                  backgroundColor: AppColors.gold,
                  foregroundColor: Colors.black,
                  minimumSize: const Size(double.infinity, 54),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                ),
                child: _submitting
                    ? const SizedBox(
                        width: 22,
                        height: 22,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : Text(
                        _step == 2 ? t.req.submit : t.req.next,
                        style: const TextStyle(
                          fontSize: 17,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showMediaSheet({required bool video}) {
    final t = ref.read(appStringsProvider);
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: const Color(0xFF1E1E2E),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(FeatherIcons.camera, color: AppColors.gold),
              title: Text(video ? t.req.videoBtn : t.req.photoBtn,
                  style: const TextStyle(color: Colors.white)),
              onTap: () {
                Navigator.pop(ctx);
                _pickMedia(ImageSource.camera, video: video);
              },
            ),
            ListTile(
              leading: const Icon(FeatherIcons.image, color: AppColors.gold),
              title: Text(t.req.photoBtn, style: const TextStyle(color: Colors.white)),
              onTap: () {
                Navigator.pop(ctx);
                _pickMedia(ImageSource.gallery, video: video);
              },
            ),
          ],
        ),
      ),
    );
  }
}

class _StepWhat extends StatelessWidget {
  const _StepWhat({
    required this.t,
    required this.descriptionController,
    required this.image,
    required this.video,
    required this.includesSpareParts,
    required this.onPickImage,
    required this.onPickVideo,
    required this.onRemoveImage,
    required this.onRemoveVideo,
    required this.onSpareParts,
  });

  final dynamic t;
  final TextEditingController descriptionController;
  final XFile? image;
  final XFile? video;
  final bool includesSpareParts;
  final VoidCallback onPickImage;
  final VoidCallback onPickVideo;
  final VoidCallback onRemoveImage;
  final VoidCallback onRemoveVideo;
  final ValueChanged<bool> onSpareParts;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(t.req.descLabel,
              style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w600)),
          const SizedBox(height: 4),
          Text(t.req.newSub, style: TextStyle(color: Colors.white.withValues(alpha: 0.6), fontSize: 13)),
          const SizedBox(height: 12),
          TextField(
            controller: descriptionController,
            maxLines: 5,
            style: const TextStyle(color: Colors.white),
            decoration: InputDecoration(
              hintText: t.req.descPlaceholder,
              hintStyle: TextStyle(color: Colors.white.withValues(alpha: 0.35)),
              filled: true,
              fillColor: Colors.white.withValues(alpha: 0.06),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
            ),
          ),
          const SizedBox(height: 20),
          Text(t.req.mediaSectionTitle,
              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
          Text(t.req.mediaSectionSub,
              style: TextStyle(color: Colors.white.withValues(alpha: 0.5), fontSize: 12)),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _MediaSlot(
                  label: t.req.photoBtn,
                  icon: FeatherIcons.image,
                  file: image,
                  onTap: onPickImage,
                  onRemove: onRemoveImage,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _MediaSlot(
                  label: t.req.videoBtn,
                  icon: FeatherIcons.video,
                  file: video,
                  isVideo: true,
                  onTap: onPickVideo,
                  onRemove: onRemoveVideo,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          CheckboxListTile(
            value: includesSpareParts,
            onChanged: (v) => onSpareParts(v ?? false),
            activeColor: AppColors.gold,
            title: Text(t.req.sparePartsLabel, style: const TextStyle(color: Colors.white, fontSize: 14)),
            subtitle: Text(t.req.sparePartsHint,
                style: TextStyle(color: Colors.white.withValues(alpha: 0.5), fontSize: 12)),
            controlAffinity: ListTileControlAffinity.leading,
          ),
        ],
      ),
    );
  }
}

class _MediaSlot extends StatelessWidget {
  const _MediaSlot({
    required this.label,
    required this.icon,
    required this.onTap,
    required this.onRemove,
    this.file,
    this.isVideo = false,
  });

  final String label;
  final IconData icon;
  final XFile? file;
  final bool isVideo;
  final VoidCallback onTap;
  final VoidCallback onRemove;

  @override
  Widget build(BuildContext context) {
    if (file != null) {
      return Stack(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(14),
            child: SizedBox(
              height: 110,
              width: double.infinity,
              child: isVideo
                  ? ColoredBox(
                      color: Colors.white10,
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(FeatherIcons.video, color: AppColors.gold, size: 32),
                          Text(label, style: const TextStyle(color: AppColors.gold, fontSize: 12)),
                        ],
                      ),
                    )
                  : Image.file(File(file!.path), fit: BoxFit.cover),
            ),
          ),
          Positioned(
            top: 6,
            left: 6,
            child: GestureDetector(
              onTap: onRemove,
              child: Container(
                padding: const EdgeInsets.all(4),
                decoration: const BoxDecoration(color: Colors.black54, shape: BoxShape.circle),
                child: const Icon(FeatherIcons.x, size: 14, color: Colors.white),
              ),
            ),
          ),
        ],
      );
    }
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 110,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.gold.withValues(alpha: 0.35)),
          color: AppColors.gold.withValues(alpha: 0.08),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: AppColors.gold, size: 28),
            const SizedBox(height: 6),
            Text(label, style: const TextStyle(color: AppColors.gold, fontWeight: FontWeight.w600)),
          ],
        ),
      ),
    );
  }
}

class _StepWhere extends StatelessWidget {
  const _StepWhere({
    required this.t,
    required this.addressController,
    required this.phoneController,
    required this.isLocating,
    required this.onGps,
    this.lat,
    this.lng,
  });

  final dynamic t;
  final TextEditingController addressController;
  final TextEditingController phoneController;
  final bool isLocating;
  final VoidCallback onGps;
  final double? lat;
  final double? lng;

  @override
  Widget build(BuildContext context) {
    final hasGps = lat != null && lng != null;
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: hasGps
                  ? Colors.green.withValues(alpha: 0.12)
                  : Colors.orange.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: hasGps
                    ? Colors.green.withValues(alpha: 0.35)
                    : Colors.orange.withValues(alpha: 0.35),
              ),
            ),
            child: Text(
              hasGps ? t.req.locationConfirmed : t.req.locationGpsRequired,
              style: TextStyle(
                color: hasGps ? Colors.greenAccent : Colors.orangeAccent,
                fontSize: 13,
              ),
            ),
          ),
          const SizedBox(height: 14),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(t.req.location,
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
              FilledButton.icon(
                onPressed: isLocating ? null : onGps,
                icon: isLocating
                    ? const SizedBox(
                        width: 14,
                        height: 14,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black),
                      )
                    : const Icon(FeatherIcons.mapPin, size: 16),
                label: Text(t.req.useGps),
                style: FilledButton.styleFrom(
                  backgroundColor: AppColors.gold,
                  foregroundColor: Colors.black,
                ),
              ),
            ],
          ),
          if (hasGps) ...[
            const SizedBox(height: 12),
            LocationMapPreview(latitude: lat!, longitude: lng!),
            const SizedBox(height: 8),
            Text(t.req.located, style: const TextStyle(color: AppColors.gold, fontSize: 13)),
          ],
          const SizedBox(height: 12),
          TextField(
            controller: addressController,
            style: const TextStyle(color: Colors.white),
            decoration: InputDecoration(
              hintText: t.req.addressPlaceholder,
              hintStyle: TextStyle(color: Colors.white.withValues(alpha: 0.35)),
              filled: true,
              fillColor: Colors.white.withValues(alpha: 0.06),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
            ),
          ),
          const SizedBox(height: 20),
          Text(t.req.phoneLabel,
              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          TextField(
            controller: phoneController,
            keyboardType: TextInputType.phone,
            style: const TextStyle(color: Colors.white),
            decoration: InputDecoration(
              hintText: '05XXXXXXXX',
              hintStyle: TextStyle(color: Colors.white.withValues(alpha: 0.35)),
              filled: true,
              fillColor: Colors.white.withValues(alpha: 0.06),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
            ),
          ),
        ],
      ),
    );
  }
}

class _StepWhen extends StatelessWidget {
  const _StepWhen({
    required this.t,
    required this.preferredTime,
    required this.customDateTime,
    required this.onCustomDateTime,
    required this.categoryLabel,
    required this.description,
    required this.address,
    required this.phone,
    required this.hasMedia,
    required this.onTime,
    required this.timeLabel,
  });

  final dynamic t;
  final String preferredTime;
  final DateTime? customDateTime;
  final ValueChanged<DateTime?> onCustomDateTime;
  final String categoryLabel;
  final String description;
  final String address;
  final String phone;
  final bool hasMedia;
  final ValueChanged<String> onTime;
  final String Function(String) timeLabel;

  Future<void> _pickCustom(BuildContext context) async {
    final now = DateTime.now();
    final date = await showDatePicker(
      context: context,
      initialDate: customDateTime ?? now.add(const Duration(days: 1)),
      firstDate: now,
      lastDate: now.add(const Duration(days: 90)),
    );
    if (date == null || !context.mounted) return;
    final time = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.fromDateTime(customDateTime ?? now),
    );
    if (time == null) return;
    onCustomDateTime(DateTime(date.year, date.month, date.day, time.hour, time.minute));
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(t.req.preferredTime,
              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: _timeOptions.map((opt) {
              final selected = preferredTime == opt.$1;
              return ChoiceChip(
                label: Text(timeLabel(opt.$2)),
                selected: selected,
                onSelected: (_) => onTime(opt.$1),
                selectedColor: AppColors.gold,
                labelStyle: TextStyle(
                  color: selected ? Colors.black : Colors.white70,
                  fontWeight: FontWeight.w600,
                ),
                backgroundColor: Colors.white.withValues(alpha: 0.06),
              );
            }).toList(),
          ),
          if (preferredTime == 'custom') ...[
            const SizedBox(height: 12),
            OutlinedButton.icon(
              onPressed: () => _pickCustom(context),
              icon: const Icon(FeatherIcons.calendar, color: AppColors.gold),
              label: Text(
                customDateTime != null
                    ? '${customDateTime!.day}/${customDateTime!.month} ${customDateTime!.hour}:${customDateTime!.minute.toString().padLeft(2, '0')}'
                    : timeLabel('timeCustom'),
                style: const TextStyle(color: Colors.white),
              ),
              style: OutlinedButton.styleFrom(
                side: BorderSide(color: AppColors.gold.withValues(alpha: 0.5)),
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
            ),
          ],
          const SizedBox(height: 24),
          Text(t.req.reviewTitle,
              style: const TextStyle(color: AppColors.gold, fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 12),
          _ReviewRow(icon: FeatherIcons.tag, label: categoryLabel),
          _ReviewRow(icon: FeatherIcons.alignRight, label: description, maxLines: 3),
          _ReviewRow(icon: FeatherIcons.mapPin, label: address),
          _ReviewRow(icon: FeatherIcons.phone, label: phone),
          _ReviewRow(
            icon: FeatherIcons.paperclip,
            label: hasMedia ? '✓ ${t.req.mediaSectionTitle}' : t.req.mediaRequired,
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.05),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                const Icon(FeatherIcons.dollarSign, color: AppColors.gold, size: 18),
                const SizedBox(width: 8),
                Text(t.req.payOnSite, style: const TextStyle(color: Colors.white70)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ReviewRow extends StatelessWidget {
  const _ReviewRow({
    required this.icon,
    required this.label,
    this.maxLines = 1,
  });

  final IconData icon;
  final String label;
  final int maxLines;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 16, color: AppColors.gold),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              label,
              maxLines: maxLines,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(color: Colors.white, fontSize: 14),
            ),
          ),
        ],
      ),
    );
  }
}

class _SuccessView extends StatelessWidget {
  const _SuccessView({
    required this.t,
    required this.onView,
    required this.onHome,
  });

  final dynamic t;
  final VoidCallback onView;
  final VoidCallback onHome;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.tabBarBg,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(FeatherIcons.checkCircle, size: 80, color: AppColors.gold),
              const SizedBox(height: 24),
              Text(
                t.req.created,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 12),
              Text(
                t.req.createdMsg,
                style: TextStyle(color: Colors.white.withValues(alpha: 0.7)),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 32),
              FilledButton(
                onPressed: onView,
                style: FilledButton.styleFrom(
                  backgroundColor: AppColors.gold,
                  foregroundColor: Colors.black,
                  minimumSize: const Size(double.infinity, 50),
                ),
                child: Text(t.req.viewRequest),
              ),
              const SizedBox(height: 12),
              OutlinedButton(
                onPressed: onHome,
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColors.gold,
                  minimumSize: const Size(double.infinity, 50),
                ),
                child: Text(t.tabs.home),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
