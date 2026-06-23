import {
  Scissors, Activity, Home, Wrench, Droplet, Baby, Coffee, Sun, Truck, RefreshCw, Sliders, Zap, Star, ChevronRight, Clock, ArrowLeft
} from "lucide-react";

const Y = "#F5C518";
const BG = "#0D0D0D";
const CARD = "#1A1A1A";
const TEXT = "#FFFFFF";
const MUTED = "#888888";

const mainCategories = [
  { id: "beauty", name: "الجمال", icon: Scissors, color: "#FF6B9D", sub: ["قص شعر", "مكياج", "مانيكير", "علاج وجه"],
  },
  { id: "health", name: "الصحة", icon: Activity, color: "#4CAF50", sub: ["تدليك", "علاج طبيعي", "زيارة منزلية", "تمريض"],
  },
  { id: "home", name: "المنزل", icon: Home, color: "#2196F3", sub: ["تنظيف", "طهي", "رعاية أطفال", "رعاية كبار"],
  },
  { id: "maintenance", name: "الصيانة", icon: Wrench, color: "#FF9800", sub: ["سباكة", "كهرباء", "تكييف", "دهان"],
  },
  { id: "cleaning", name: "تنظيف تعقيم", icon: Droplet, color: "#00BCD4", sub: ["تنظيف سجاد", "مكافحة", "تعقيم", "تنظيف نافذ"],
  },
  { id: "care", name: "رعاية", icon: Baby, color: "#E91E63", sub: ["رعاية أطفال", "رعاية كبار", "جليسة", "مرافقة"],
  },
  { id: "cooking", name: "طهي وحلويات", icon: Coffee, color: "#795548", sub: ["طباخ منزلي", "صانع كعك", "حلويات", "مشاريب"],
  },
  { id: "garden", name: "حدائق ونقل", icon: Sun, color: "#8BC34A", sub: ["تنسيق حدائق", "نقل أثاث", "صيانة بسات", "ري النبات"],
  },
  { id: "repair", name: "إصلاح أجهزة", icon: RefreshCw, color: "#FF5722", sub: ["غسالات", "ثلاجات", "أفران", "غسالة صحون"],
  },
  { id: "install", name: "تركيب ونجارة", icon: Sliders, color: "#9C27B0", sub: ["تركيب أثاث", "ستائر", "رفوف", "إكسسوارات"],
  },
];

export function CategorySplit() {
  return (
    <div
      className="min-h-screen w-full flex flex-col"
      style={{ backgroundColor: BG, color: TEXT, fontFamily: "Inter, sans-serif" }}
    >
      {/* Header */}
      <div className="px-4 pt-8 pb-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: CARD }}>
            <ArrowLeft size={18} color={TEXT} />
          </div>
          <p className="text-lg font-bold">الفئات</p>
        </div>
        <p className="text-xs text-gray-400">اختر الفئة المناسبة واكتشف الخدمات</p>
      </div>

      {/* Categories Grid */}
      <div className="px-4 flex-1">
        {mainCategories.map((cat, i) => (
          <div key={cat.id} className="mb-4">
            {/* Category Header */}
            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: cat.color + "20" }}
              >
                <cat.icon size={20} color={cat.color} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold">{cat.name}</p>
                <p className="text-xs text-gray-400">{cat.sub.length} خدمات</p>
              </div>
              <ChevronRight size={16} color={MUTED} />
            </div>

            {/* Sub Services */}
            <div className="flex flex-wrap gap-2 ml-13">
              {cat.sub.map((sub, j) => (
                <span
                  key={j}
                  className="px-3 py-1.5 rounded-lg text-xs"
                  style={{ backgroundColor: CARD, border: "1px solid #333" }}
                >
                  {sub}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Add Custom Service */}
      <div className="px-4 pb-6">
        <div className="p-4 rounded-xl" style={{ backgroundColor: CARD, border: "1px dashed " + Y }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: Y + "20" }}>
              <span style={{ color: Y, fontSize: 20 }}>+</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold" style={{ color: Y }}>أضف خدمة مخصصة</p>
              <p className="text-xs text-gray-400">لم تجد ما تبحث عنه؟ اكتبه وسنأضيفها</p>
            </div>
            <ChevronRight size={16} color={Y} />
          </div>
        </div>
      </div>
    </div>
  );
}
