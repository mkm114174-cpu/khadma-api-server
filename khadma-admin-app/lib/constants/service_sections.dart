const kServiceSections = <Map<String, String>>[
  {'id': 'painting', 'label': 'دهان وديكور'},
  {'id': 'plumbing', 'label': 'سباكة'},
  {'id': 'electricity', 'label': 'كهرباء'},
  {'id': 'cleaning', 'label': 'تنظيف'},
  {'id': 'ac', 'label': 'تكييف'},
  {'id': 'carpentry', 'label': 'نجارة'},
  {'id': 'cars', 'label': 'سيارات'},
  {'id': 'appliances', 'label': 'أجهزة منزلية'},
  {'id': 'pest_control', 'label': 'مكافحة حشرات'},
  {'id': 'furniture', 'label': 'أثاث'},
  {'id': 'landscaping', 'label': 'تنسيق حدائق'},
  {'id': 'moving', 'label': 'نقل أثاث'},
  {'id': 'other', 'label': 'أخرى'},
];

String sectionLabel(String? id) {
  if (id == null) return '—';
  return kServiceSections
          .firstWhere((s) => s['id'] == id, orElse: () => {'label': id})['label'] ??
      id;
}
