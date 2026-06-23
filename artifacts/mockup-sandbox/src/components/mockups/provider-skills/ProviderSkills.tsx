import { useState } from "react";
import {
  Wrench, Zap, Droplet, RefreshCw, Sliders, Star, Check, ChevronDown, Plus, X, MapPin, ArrowLeft
} from "lucide-react";

const Y = "#F5C518";
const BG = "#0D0D0D";
const CARD = "#1A1A1A";
const TEXT = "#FFFFFF";
const MUTED = "#888888";

const allSkills = [
  { id: "plumbing", name: "سباكة", icon: Droplet, color: "#2196F3" },
  { id: "electrical", name: "كهرباء", icon: Zap, color: "#FFC107" },
  { id: "ac", name: "تكييف", icon: Wrench, color: "#00BCD4" },
  { id: "painting", name: "دهان", icon: Wrench, color: "#FF5722" },
  { id: "washer", name: "غسالات", icon: RefreshCw, color: "#9C27B0" },
  { id: "fridge", name: "ثلاجات", icon: RefreshCw, color: "#E91E63" },
  { id: "oven", name: "أفران", icon: RefreshCw, color: "#FF9800" },
  { id: "dishwasher", name: "غسالة صحون", icon: RefreshCw, color: "#795548" },
  { id: "carpentry", name: "نجارة", icon: Sliders, color: "#8BC34A" },
  { id: "curtains", name: "ستائر", icon: Sliders, color: "#607D8B" },
  { id: "furniture", name: "تركيب أثاث", icon: Sliders, color: "#3F51B5" },
  { id: "custom", name: "مهارة مخصصة", icon: Plus, color: Y },
];

export function ProviderSkills() {
  const [selected, setSelected] = useState<string[]>(["plumbing", "electrical"]);
  const [customSkill, setCustomSkill] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const toggleSkill = (id: string) => {
    if (selected.includes(id)) {
      setSelected(selected.filter((s) => s !== id));
    } else {
      setSelected([...selected, id]);
    }
  };

  const addCustom = () => {
    if (customSkill.trim()) {
      setSelected([...selected, customSkill]);
      setCustomSkill("");
      setShowAdd(false);
    }
  };

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
          <p className="text-lg font-bold">مهاراتي</p>
        </div>
        <p className="text-xs text-gray-400">اختر المهارات اللي بتتقنها. الطلبات بتتبع بس للمزودين المناسبين.</p>
      </div>

      {/* Selected Skills */}
      {selected.length > 0 && (
        <div className="px-4 mb-4">
          <p className="text-xs text-gray-400 mb-2">المهارات المختارة ({selected.length})</p>
          <div className="flex flex-wrap gap-2">
            {selected.map((s) => {
              const skill = allSkills.find((sk) => sk.id === s);
              const name = skill ? skill.name : s;
              const color = skill ? skill.color : Y;
              return (
                <div
                  key={s}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl"
                  style={{ backgroundColor: color + "20", border: "1px solid " + color + "40" }}
                >
                  <span className="text-sm font-semibold" style={{ color }}>{name}</span>
                  <button onClick={() => toggleSkill(s)}>
                    <X size={14} color={color} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* All Skills */}
      <div className="px-4 flex-1">
        <p className="text-xs text-gray-400 mb-3">المهارات المتاحة</p>
        <div className="grid grid-cols-2 gap-3">
          {allSkills.map((skill) => {
            const isSelected = selected.includes(skill.id);
            return (
              <button
                key={skill.id}
                onClick={() => toggleSkill(skill.id)}
                className="relative p-4 rounded-xl flex flex-col items-center gap-2 text-center"
                style={{
                  backgroundColor: isSelected ? skill.color + "20" : CARD,
                  border: isSelected ? "2px solid " + skill.color : "1px solid #333",
                }}
              >
                {isSelected && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: skill.color }}>
                    <Check size={12} color="#FFF" />
                  </div>
                )}
                <skill.icon size={24} color={isSelected ? skill.color : MUTED} />
                <span className="text-sm font-semibold" style={{ color: isSelected ? skill.color : TEXT }}>
                  {skill.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Add Custom Skill */}
      <div className="px-4 py-4">
        {!showAdd ? (
          <button
            onClick={() => setShowAdd(true)}
            className="w-full h-12 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold"
            style={{ backgroundColor: CARD, border: "1px dashed " + Y, color: Y }}
          >
            <Plus size={18} /> أضف مهارة مخصصة
          </button>
        ) : (
          <div className="p-4 rounded-xl" style={{ backgroundColor: CARD }}>
            <p className="text-sm font-bold mb-2">مهارة جديدة</p>
            <input
              type="text"
              placeholder="مثال: صيانة دراجات"
              value={customSkill}
              onChange={(e) => setCustomSkill(e.target.value)}
              className="w-full h-10 rounded-lg px-3 mb-3 text-sm outline-none"
              style={{ backgroundColor: BG, border: "1px solid #333", color: TEXT }}
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowAdd(false)}
                className="flex-1 h-10 rounded-lg text-sm font-semibold"
                style={{ backgroundColor: BG, color: MUTED, border: "1px solid #333" }}
              >
                إلغاء
              </button>
              <button
                onClick={addCustom}
                className="flex-1 h-10 rounded-lg text-sm font-semibold"
                style={{ backgroundColor: Y, color: "#000" }}
              >
                إضافة
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="px-4 pb-6">
        <button className="w-full h-12 rounded-xl text-sm font-bold" style={{ backgroundColor: Y, color: "#000" }}>
          حفظ المهارات ({selected.length})
        </button>
      </div>
    </div>
  );
}
