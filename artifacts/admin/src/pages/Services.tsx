import { useState, useEffect, useRef } from "react";
import {
  useListSkills,
  useUpdateSkill,
  useDeleteSkill,
  getListSkillsQueryKey,
  type Skill,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AuthedImage } from "@/components/AuthedImage";
import { uploadFile } from "@/lib/upload";
import { toast } from "@/hooks/use-toast";
import {
  CheckCircle2, Clock, XCircle, Upload, Trash2, ImageIcon, Layers, Tag,
} from "lucide-react";

// The 13 customer-facing sections a service can be assigned to. Admin chooses
// from these only — no new sections can be created.
const SECTIONS: { id: string; label: string }[] = [
  { id: "painting", label: "دهان وديكور" },
  { id: "plumbing", label: "سباكة" },
  { id: "electricity", label: "كهرباء" },
  { id: "cleaning", label: "تنظيف" },
  { id: "ac", label: "تكييف" },
  { id: "carpentry", label: "نجارة" },
  { id: "cars", label: "سيارات" },
  { id: "appliances", label: "أجهزة منزلية" },
  { id: "pest_control", label: "مكافحة حشرات" },
  { id: "furniture", label: "أثاث" },
  { id: "landscaping", label: "تنسيق حدائق" },
  { id: "moving", label: "نقل أثاث" },
  { id: "other", label: "أخرى" },
];

function sectionLabel(id: string | null | undefined): string {
  if (!id) return "—";
  return SECTIONS.find((s) => s.id === id)?.label ?? id;
}

function statusBadge(status: string) {
  switch (status) {
    case "approved":
      return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">معتمد</Badge>;
    case "rejected":
      return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">مرفوض</Badge>;
    default:
      return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">بانتظار المراجعة</Badge>;
  }
}

interface FormState {
  name: string;
  nameEn: string;
  nameHe: string;
  description: string;
  descriptionEn: string;
  descriptionHe: string;
  category: string;
  image: string;
}

function emptyForm(skill: Skill | null): FormState {
  return {
    name: skill?.name ?? "",
    nameEn: skill?.nameEn ?? "",
    nameHe: skill?.nameHe ?? "",
    description: skill?.description ?? "",
    descriptionEn: skill?.descriptionEn ?? "",
    descriptionHe: skill?.descriptionHe ?? "",
    category: skill?.category ?? "",
    image: skill?.image ?? "",
  };
}

function ServiceCard({
  skill,
  onReview,
}: {
  skill: Skill;
  onReview: (s: Skill) => void;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-start gap-4 p-4">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-secondary flex items-center justify-center">
          {skill.image ? (
            <AuthedImage objectPath={skill.image} className="h-full w-full object-cover" alt={skill.name} />
          ) : (
            <ImageIcon className="h-6 w-6 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-foreground truncate">{skill.name}</h3>
            {statusBadge(skill.status)}
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
            {skill.description || "بدون وصف"}
          </p>
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Layers className="h-3 w-3" /> {sectionLabel(skill.category)}</span>
            <span className="flex items-center gap-1"><Tag className="h-3 w-3" /> {skill.type === "custom" ? "مقترح" : "أساسي"}</span>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={() => onReview(skill)}>
          مراجعة
        </Button>
      </div>
    </Card>
  );
}

export function ServicesPage() {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<Skill | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm(null));
  const [uploading, setUploading] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Skill | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch all skills (admin sees every status).
  const { data: skills, isLoading } = useListSkills({ status: "all" });
  const updateSkill = useUpdateSkill();
  const deleteSkill = useDeleteSkill();

  useEffect(() => {
    if (selected) {
      setForm(emptyForm(selected));
      setLocalPreview(null);
    }
  }, [selected]);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: getListSkillsQueryKey({ status: "all" }) });

  const pending = (skills ?? []).filter((s) => s.status === "pending");
  const approved = (skills ?? []).filter((s) => s.status === "approved");
  const rejected = (skills ?? []).filter((s) => s.status === "rejected");

  const closeDialog = () => {
    setSelected(null);
    setLocalPreview(null);
  };

  const handleFilePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLocalPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const objectPath = await uploadFile(file);
      setForm((f) => ({ ...f, image: objectPath }));
      toast({ title: "تم رفع الصورة" });
    } catch {
      toast({ variant: "destructive", title: "فشل رفع الصورة" });
      setLocalPreview(null);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const buildPayload = () => ({
    name: form.name.trim(),
    nameEn: form.nameEn.trim() || undefined,
    nameHe: form.nameHe.trim() || undefined,
    description: form.description.trim() || undefined,
    descriptionEn: form.descriptionEn.trim() || undefined,
    descriptionHe: form.descriptionHe.trim() || undefined,
    category: form.category || undefined,
    image: form.image || undefined,
  });

  const save = (status?: "approved" | "rejected") => {
    if (!selected) return;
    if (!form.name.trim()) {
      toast({ variant: "destructive", title: "الاسم بالعربية مطلوب" });
      return;
    }
    if (status === "approved" && !form.category) {
      toast({ variant: "destructive", title: "اختر القسم قبل الاعتماد" });
      return;
    }
    updateSkill.mutate(
      { id: selected.id, data: { ...buildPayload(), ...(status ? { status } : {}) } },
      {
        onSuccess: () => {
          invalidate();
          closeDialog();
          toast({
            title: status === "approved" ? "تم الاعتماد" : status === "rejected" ? "تم الرفض" : "تم الحفظ",
          });
        },
        onError: () => toast({ variant: "destructive", title: "حدث خطأ أثناء الحفظ" }),
      },
    );
  };

  const doDelete = () => {
    if (!confirmDelete) return;
    deleteSkill.mutate(
      { id: confirmDelete.id },
      {
        onSuccess: () => {
          invalidate();
          setConfirmDelete(null);
          if (selected?.id === confirmDelete.id) closeDialog();
          toast({ title: "تم الحذف" });
        },
        onError: () => toast({ variant: "destructive", title: "حدث خطأ أثناء الحذف" }),
      },
    );
  };

  const previewSrc = localPreview ?? null;
  const isSaving = updateSkill.isPending;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">الخدمات</h1>
        <p className="text-muted-foreground mt-1">
          راجع الخدمات المقترحة من مزودي الخدمة واعتمدها لتصبح متاحة للعملاء.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              <h2 className="text-lg font-bold text-foreground">بانتظار المراجعة</h2>
              <Badge variant="secondary">{pending.length}</Badge>
            </div>
            {pending.length === 0 ? (
              <p className="text-sm text-muted-foreground">لا توجد خدمات بانتظار المراجعة.</p>
            ) : (
              <div className="grid gap-3">
                {pending.map((s) => (
                  <ServiceCard key={s.id} skill={s} onReview={setSelected} />
                ))}
              </div>
            )}
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <h2 className="text-lg font-bold text-foreground">الخدمات المعتمدة</h2>
              <Badge variant="secondary">{approved.length}</Badge>
            </div>
            {approved.length === 0 ? (
              <p className="text-sm text-muted-foreground">لا توجد خدمات معتمدة.</p>
            ) : (
              <div className="grid gap-3">
                {approved.map((s) => (
                  <ServiceCard key={s.id} skill={s} onReview={setSelected} />
                ))}
              </div>
            )}
          </section>

          {rejected.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-500" />
                <h2 className="text-lg font-bold text-foreground">مرفوضة</h2>
                <Badge variant="secondary">{rejected.length}</Badge>
              </div>
              <div className="grid gap-3">
                {rejected.map((s) => (
                  <ServiceCard key={s.id} skill={s} onReview={setSelected} />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* Review / edit dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>مراجعة الخدمة</DialogTitle>
            <DialogDescription>
              عدّل الاسم والوصف بثلاث لغات، عيّن القسم، وارفع صورة قبل الاعتماد.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Image */}
            <div className="space-y-2">
              <Label>صورة الخدمة</Label>
              <div className="flex items-center gap-4">
                <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-secondary flex items-center justify-center">
                  {previewSrc ? (
                    <img src={previewSrc} className="h-full w-full object-cover" alt="" />
                  ) : form.image ? (
                    <AuthedImage objectPath={form.image} className="h-full w-full object-cover" />
                  ) : (
                    <ImageIcon className="h-7 w-7 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFilePick}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    <Upload className="h-4 w-4 ml-2" />
                    {uploading ? "جارِ الرفع..." : "رفع صورة"}
                  </Button>
                </div>
              </div>
            </div>

            {/* Section */}
            <div className="space-y-2">
              <Label>القسم</Label>
              <Select
                value={form.category || undefined}
                onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر القسم" />
                </SelectTrigger>
                <SelectContent>
                  {SECTIONS.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Names */}
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>الاسم (عربي)</Label>
                <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} dir="rtl" />
              </div>
              <div className="space-y-2">
                <Label>الاسم (إنجليزي)</Label>
                <Input value={form.nameEn} onChange={(e) => setForm((f) => ({ ...f, nameEn: e.target.value }))} dir="ltr" />
              </div>
              <div className="space-y-2">
                <Label>الاسم (عبري)</Label>
                <Input value={form.nameHe} onChange={(e) => setForm((f) => ({ ...f, nameHe: e.target.value }))} dir="rtl" />
              </div>
            </div>

            {/* Descriptions */}
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>الوصف (عربي)</Label>
                <Textarea rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} dir="rtl" />
              </div>
              <div className="space-y-2">
                <Label>الوصف (إنجليزي)</Label>
                <Textarea rows={3} value={form.descriptionEn} onChange={(e) => setForm((f) => ({ ...f, descriptionEn: e.target.value }))} dir="ltr" />
              </div>
              <div className="space-y-2">
                <Label>الوصف (عبري)</Label>
                <Textarea rows={3} value={form.descriptionHe} onChange={(e) => setForm((f) => ({ ...f, descriptionHe: e.target.value }))} dir="rtl" />
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => selected && setConfirmDelete(selected)}
            >
              <Trash2 className="h-4 w-4 ml-2" />
              حذف
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => save()} disabled={isSaving || uploading}>
                حفظ
              </Button>
              {selected?.status !== "rejected" && (
                <Button
                  type="button"
                  variant="outline"
                  className="border-red-500/30 text-red-500 hover:bg-red-500/10"
                  onClick={() => save("rejected")}
                  disabled={isSaving || uploading}
                >
                  رفض
                </Button>
              )}
              <Button type="button" onClick={() => save("approved")} disabled={isSaving || uploading}>
                اعتماد ونشر
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف الخدمة</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف «{confirmDelete?.name}» نهائياً. لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={doDelete}
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
