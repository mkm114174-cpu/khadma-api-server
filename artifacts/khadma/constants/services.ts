export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: string;
  icon: string;
  categoryId: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  featherIcon: string;
  color: string;
}

export const categories: Category[] = [
  { id: "beauty", name: "خدمات الجمال", icon: "scissors", featherIcon: "scissors", color: "#FF6B9D" },
  { id: "home", name: "خدمات المنزل", icon: "home", featherIcon: "home", color: "#2196F3" },
  { id: "maintenance", name: "خدمات الصيانة", icon: "tool", featherIcon: "tool", color: "#FF9800" },
];

export const services: Service[] = [
  { id: "s1", name: "قص شعر", description: "قص وتشكيل احترافي للشعر", price: 50, duration: "٤٥ دقيقة", icon: "scissors", categoryId: "beauty" },
  { id: "s2", name: "مكياج كامل", description: "مكياج فاخر بمنتجات عالمية", price: 120, duration: "٦٠ دقيقة", icon: "star", categoryId: "beauty" },
  { id: "s3", name: "مانيكير وبديكير", description: "عناية شاملة بالأظافر", price: 80, duration: "٥٠ دقيقة", icon: "droplet", categoryId: "beauty" },
  { id: "s4", name: "علاج الوجه", description: "تنظيف وترطيب بشرة الوجه", price: 150, duration: "٧٥ دقيقة", icon: "sun", categoryId: "beauty" },
  { id: "s9", name: "تنظيف المنزل", description: "تنظيف شامل واحترافي", price: 150, duration: "١٨٠ دقيقة", icon: "home", categoryId: "home" },
  { id: "s10", name: "خدمة طهي", description: "طاهٍ محترف يطبخ في منزلك", price: 200, duration: "١٢٠ دقيقة", icon: "coffee", categoryId: "home" },
  { id: "s11", name: "رعاية أطفال", description: "جليسة أطفال موثوقة ومدربة", price: 100, duration: "٢٤٠ دقيقة", icon: "smile", categoryId: "home" },
  { id: "s12", name: "رعاية كبار السن", description: "مرافقة وعناية متخصصة", price: 120, duration: "٢٤٠ دقيقة", icon: "heart", categoryId: "home" },
  { id: "s13", name: "سباكة", description: "إصلاح جميع مشاكل السباكة", price: 100, duration: "٦٠ دقيقة", icon: "tool", categoryId: "maintenance" },
  { id: "s14", name: "كهرباء", description: "أعمال كهربائية آمنة ومعتمدة", price: 120, duration: "٦٠ دقيقة", icon: "zap", categoryId: "maintenance" },
  { id: "s15", name: "صيانة تكييف", description: "تنظيف وصيانة مكيفات", price: 150, duration: "٩٠ دقيقة", icon: "wind", categoryId: "maintenance" },
  { id: "s16", name: "دهانات", description: "دهان وتلوين احترافي للجدران", price: 300, duration: "٤٨٠ دقيقة", icon: "edit", categoryId: "maintenance" },
  { id: "s17", name: "صانع كعك منزلي", description: "كعكات وحلويات طازجة حسب الطلب", price: 120, duration: "١٢٠ دقيقة", icon: "gift", categoryId: "home" },
  { id: "s18", name: "حلويات منزلية", description: "حلويات شرقية وغربية محضّرة منزلياً", price: 90, duration: "٩٠ دقيقة", icon: "coffee", categoryId: "home" },
  { id: "s19", name: "تنظيف سجاد وكنب", description: "غسيل وتعقيم السجاد والكنب بالبخار", price: 130, duration: "١٢٠ دقيقة", icon: "grid", categoryId: "home" },
  { id: "s20", name: "مكافحة حشرات", description: "رش وتعقيم آمن ضد الحشرات", price: 160, duration: "٦٠ دقيقة", icon: "shield", categoryId: "home" },
  { id: "s21", name: "تنسيق وصيانة حدائق", description: "قص وتنسيق وري النباتات", price: 140, duration: "٩٠ دقيقة", icon: "sun", categoryId: "home" },
  { id: "s22", name: "نقل أثاث", description: "فك وتغليف ونقل الأثاث بأمان", price: 250, duration: "١٨٠ دقيقة", icon: "truck", categoryId: "home" },
  { id: "s23", name: "تصليح غسالات", description: "صيانة وإصلاح الغسالات بجميع أنواعها", price: 130, duration: "٦٠ دقيقة", icon: "refresh-cw", categoryId: "maintenance" },
  { id: "s24", name: "تصليح ثلاجات وبرّادات", description: "إصلاح أعطال التبريد وتغيير القطع", price: 150, duration: "٧٥ دقيقة", icon: "thermometer", categoryId: "maintenance" },
  { id: "s25", name: "تصليح أفران ومايكروويف", description: "صيانة الأفران والمواقد الكهربائية", price: 120, duration: "٦٠ دقيقة", icon: "zap", categoryId: "maintenance" },
  { id: "s26", name: "تصليح غسالة صحون", description: "صيانة وإصلاح غسالات الصحون", price: 120, duration: "٦٠ دقيقة", icon: "droplet", categoryId: "maintenance" },
  { id: "s27", name: "نجارة وتركيب أثاث", description: "تركيب وإصلاح الأثاث الخشبي", price: 140, duration: "٩٠ دقيقة", icon: "tool", categoryId: "maintenance" },
  { id: "s28", name: "تركيب ستائر وإكسسوارات", description: "تعليق الستائر والرفوف والإكسسوارات", price: 110, duration: "٦٠ دقيقة", icon: "sliders", categoryId: "maintenance" },
];
