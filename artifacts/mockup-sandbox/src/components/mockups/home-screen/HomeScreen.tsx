import { useState } from "react";
import {
  MapPin,
  Search,
  PlusCircle,
  Star,
  Zap,
  Scissors,
  Home,
  Wrench,
  Activity,
  ChevronRight,
  Bell,
  Clock,
  Heart,
  Truck,
  Sun,
  Baby,
  Coffee,
  Shield,
  Wind,
  RefreshCw,
  Thermometer,
  Gift,
  Droplet,
  Grid,
  Sliders,
  Edit3,
  MessageCircle,
  User,
} from "lucide-react";

const Y = "#F5C518";
const BG = "#0D0D0D";
const CARD = "#1A1A1A";
const TEXT = "#FFFFFF";
const MUTED = "#888888";

const categories = [
  { id: "beauty", name: "الجمال", icon: Scissors, color: "#FF6B9D" },
  { id: "health", name: "الصحة", icon: Activity, color: "#4CAF50" },
  { id: "home", name: "المنزل", icon: Home, color: "#2196F3" },
  { id: "maintenance", name: "الصيانة", icon: Wrench, color: "#FF9800" },
  { id: "cleaning", name: "تنظيف", icon: Droplet, color: "#00BCD4" },
  { id: "care", name: "رعاية", icon: Baby, color: "#E91E63" },
  { id: "cooking", name: "طهي", icon: Coffee, color: "#795548" },
  { id: "garden", name: "حدائق", icon: Sun, color: "#8BC34A" },
  { id: "transport", name: "نقل", icon: Truck, color: "#607D8B" },
  { id: "repair", name: "إصلاح", icon: RefreshCw, color: "#FF5722" },
  { id: "install", name: "تركيب", icon: Sliders, color: "#9C27B0" },
  { id: "electrical", name: "كهرباء", icon: Zap, color: "#FFC107" },
];

const featured = [
  { name: "سباكة", icon: Droplet, price: "100₪", rating: 4.8 },
  { name: "كهرباء", icon: Zap, price: "120₪", rating: 4.9 },
  { name: "تنظيف", icon: Shield, price: "150₪", rating: 4.7 },
  { name: "تدليك", icon: Heart, price: "200₪", rating: 4.9 },
];

const recent = [
  { name: "قص شعر", date: "قبل 3 أيام", icon: Scissors },
  { name: "صيانة تكييف", date: "قبل أسبوع", icon: Wind },
];

const topProviders = [
  { name: "أحمد", skill: "سباكة", rating: 4.9, jobs: 127, color: "#FF6B9D" },
  { name: "سارة", skill: "تدليك", rating: 4.8, jobs: 89, color: "#4CAF50" },
  { name: "محمد", skill: "كهرباء", rating: 4.7, jobs: 203, color: "#2196F3" },
];

export function HomeScreen() {
  const [search, setSearch] = useState("");

  return (
    <div
      className="min-h-screen w-full flex flex-col"
      style={{ backgroundColor: BG, color: TEXT, fontFamily: "Inter, sans-serif" }}
    >
      {/* Header */}
      <div className="px-4 pt-8 pb-3">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: Y }}>
              <span className="text-black font-bold text-lg">خ</span>
            </div>
            <div>
              <p className="text-xs text-gray-400">موقعك</p>
              <p className="text-sm font-semibold flex items-center gap-1">
                <MapPin size={14} color={Y} /> شفاعمرو
              </p>
            </div>
          </div>
          <div className="relative">
            <Bell size={22} color={TEXT} />
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center text-[10px] font-bold">3</div>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2" color={MUTED} />
          <input
            type="text"
            placeholder="ابحث عن خدمة..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-12 rounded-xl pl-10 pr-4 text-sm outline-none"
            style={{ backgroundColor: CARD, color: TEXT, border: "1px solid #333" }}
          />
        </div>

        {/* Quick Actions */}
        <div className="flex gap-3 mb-4">
          <button className="flex-1 h-10 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold" style={{ backgroundColor: Y, color: "#000" }}>
            <PlusCircle size={16} /> خدمة جديدة
          </button>
          <button className="flex-1 h-10 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold" style={{ backgroundColor: CARD, color: TEXT, border: "1px solid #333" }}>
            <Clock size={16} /> طلباتي
          </button>
        </div>
      </div>

      {/* Categories */}
      <div className="px-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold">الفئات</p>
          <p className="text-xs" style={{ color: Y }}>عرض الكل</p>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {categories.map((cat) => (
            <div key={cat.id} className="flex flex-col items-center gap-1">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: cat.color + "20" }}
              >
                <cat.icon size={22} color={cat.color} />
              </div>
              <p className="text-[10px] text-center">{cat.name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Featured Services */}
      <div className="px-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold">خدمات شائعة</p>
          <p className="text-xs" style={{ color: Y }}>عرض الكل</p>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {featured.map((s, i) => (
            <div key={i} className="flex-shrink-0 w-32 rounded-xl p-3" style={{ backgroundColor: CARD }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-2" style={{ backgroundColor: Y + "20" }}>
                <s.icon size={20} color={Y} />
              </div>
              <p className="text-sm font-semibold mb-1">{s.name}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: Y }}>{s.price}</span>
                <span className="text-xs flex items-center gap-1">
                  <Star size={10} color={Y} fill={Y} /> {s.rating}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="px-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold">طلبات سابقة</p>
          <p className="text-xs" style={{ color: Y }}>عرض الكل</p>
        </div>
        {recent.map((r, i) => (
          <div key={i} className="flex items-center justify-between p-3 rounded-xl mb-2" style={{ backgroundColor: CARD }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: Y + "20" }}>
                <r.icon size={18} color={Y} />
              </div>
              <div>
                <p className="text-sm font-semibold">{r.name}</p>
                <p className="text-xs text-gray-400">{r.date}</p>
              </div>
            </div>
            <button className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ backgroundColor: Y + "20", color: Y }}>
              أطلب مرة أخرى
            </button>
          </div>
        ))}
      </div>

      {/* Top Providers */}
      <div className="px-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold">أفضل المزودين</p>
          <p className="text-xs" style={{ color: Y }}>عرض الكل</p>
        </div>
        {topProviders.map((p, i) => (
          <div key={i} className="flex items-center justify-between p-3 rounded-xl mb-2" style={{ backgroundColor: CARD }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: p.color }}>
                {p.name[0]}
              </div>
              <div>
                <p className="text-sm font-semibold">{p.name}</p>
                <p className="text-xs text-gray-400">{p.skill} · {p.jobs} خدمة</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Star size={12} color={Y} fill={Y} />
              <span className="text-xs font-semibold">{p.rating}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Tab Bar */}
      <div className="mt-auto px-4 pb-4">
        <div className="flex items-center justify-around h-16 rounded-2xl" style={{ backgroundColor: CARD }}>
          {[
            { icon: MapPin, label: "الخريطة", active: true },
            { icon: Grid, label: "الخدمات", active: false },
            { icon: PlusCircle, label: "طلب", active: false },
            { icon: MessageCircle, label: "الرسائل", active: false },
            { icon: User, label: "حسابي", active: false },
          ].map((tab, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <tab.icon size={20} color={tab.active ? Y : MUTED} />
              <span className="text-[10px]" style={{ color: tab.active ? Y : MUTED }}>{tab.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
