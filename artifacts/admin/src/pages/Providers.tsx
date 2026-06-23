import { useState } from "react";
import {
  useUpdateProvider,
  useRequestProviderInfo,
  getListProvidersQueryKey,
  type Provider,
} from "@workspace/api-client-react";
import { useAllProviders } from "@/hooks/use-all-providers";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ProviderDocPreview } from "@/components/ProviderDocPreview";
import {
  Search, UserCheck, UserX, Clock, MapPin, Phone, Award, FileText,
  Home, MessageCircle, Star, Eye,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

function getStatusBadge(status: string) {
  switch (status) {
    case "approved": return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">مقبول</Badge>;
    case "rejected": return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">مرفوض</Badge>;
    case "under_review": return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">قيد المراجعة</Badge>;
    case "needs_info": return <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20">بانتظار معلومات</Badge>;
    default: return <Badge className="bg-gray-500/10 text-gray-400 border-gray-500/20">بانتظار المراجعة</Badge>;
  }
}

export function ProvidersPage() {
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Provider | null>(null);
  const [infoMessage, setInfoMessage] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const queryClient = useQueryClient();

  const { data: providers, isLoading } = useAllProviders();
  const updateProvider = useUpdateProvider();
  const requestInfo = useRequestProviderInfo();

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: getListProvidersQueryKey() });

  const handleStatusChange = (
    id: number,
    status: "approved" | "rejected",
    closeDialog = false,
    reviewNote?: string,
  ) => {
    updateProvider.mutate(
      { id, data: { status, ...(reviewNote ? { reviewNote } : {}) } },
      {
        onSuccess: () => {
          invalidate();
          if (closeDialog) {
            setSelected(null);
            setRejectReason("");
          }
          toast({
            title: "تم التحديث",
            description: `تم ${status === "approved" ? "قبول" : "رفض"} مزود الخدمة بنجاح`,
          });
        },
        onError: () => {
          toast({
            variant: "destructive",
            title: "خطأ",
            description: "حدث خطأ أثناء تحديث حالة مزود الخدمة",
          });
        },
      },
    );
  };

  const handleRequestInfo = () => {
    if (!selected || !infoMessage.trim()) return;
    requestInfo.mutate(
      { id: selected.id, data: { message: infoMessage.trim() } },
      {
        onSuccess: () => {
          invalidate();
          setInfoMessage("");
          setSelected(null);
          toast({
            title: "تم الإرسال",
            description: "تم إرسال طلب المعلومات إلى مزود الخدمة وإشعاره.",
          });
        },
        onError: () => {
          toast({
            variant: "destructive",
            title: "خطأ",
            description: "حدث خطأ أثناء إرسال طلب المعلومات",
          });
        },
      },
    );
  };

  const openDetail = (provider: Provider) => {
    setSelected(provider);
    setInfoMessage("");
    setRejectReason("");
  };

  const filteredProviders = providers?.filter(p => {
    if (filter !== "all" && p.status !== filter) return false;
    if (search && !((p.serviceType || "").includes(search)) && !(p.phone || "").includes(search)) return false;
    return true;
  });

  const busy = updateProvider.isPending || requestInfo.isPending;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">مزودي الخدمة</h1>
          <p className="text-muted-foreground mt-1">مراجعة وإدارة حسابات مزودي الخدمة في المنصة.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 bg-card p-4 rounded-xl border border-border">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث بالخدمة أو رقم الهاتف..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-4 pr-10 bg-secondary border-none h-10"
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full sm:w-[200px] bg-secondary border-none h-10">
            <SelectValue placeholder="تصفية حسب الحالة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">الكل</SelectItem>
            <SelectItem value="pending">بانتظار المراجعة</SelectItem>
            <SelectItem value="under_review">قيد المراجعة</SelectItem>
            <SelectItem value="needs_info">بانتظار معلومات</SelectItem>
            <SelectItem value="approved">مقبول</SelectItem>
            <SelectItem value="rejected">مرفوض</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          [...Array(6)].map((_, i) => (
            <Card key={i} className="border-border bg-card">
              <CardHeader className="pb-2">
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-4 w-1/3 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-full mt-4" />
              </CardContent>
            </Card>
          ))
        ) : filteredProviders?.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            <p className="text-lg">لا يوجد مزودي خدمة يطابقون بحثك.</p>
          </div>
        ) : (
          filteredProviders?.map(provider => (
            <Card key={provider.id} className="border-border bg-card hover:border-primary/50 transition-colors flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start mb-2">
                  {getStatusBadge(provider.status)}
                  <div className="flex items-center gap-1 text-sm text-primary font-medium bg-primary/10 px-2 py-1 rounded-md">
                    <span>★ {provider.rating.toFixed(1)}</span>
                    <span className="text-muted-foreground text-xs">({provider.ratingCount})</span>
                  </div>
                </div>
                <CardTitle className="text-xl text-foreground">{provider.serviceType || 'خدمة عامة'}</CardTitle>
                <CardDescription className="text-muted-foreground mt-1">
                  {provider.bio || 'لا يوجد نبذة'}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-end">
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Award className="h-4 w-4" />
                    <span>
                      {provider.experienceYears != null
                        ? `${provider.experienceYears} سنوات خبرة`
                        : 'الخبرة غير محددة'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{provider.phone || 'غير محدد'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>انضم {new Date(provider.createdAt).toLocaleDateString('ar-SA')}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-border mt-auto space-y-2">
                  {(provider.status === 'pending' || provider.status === 'under_review' || provider.status === 'needs_info') ? (
                    <Button
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                      onClick={() => openDetail(provider)}
                    >
                      <Eye className="h-4 w-4 ml-2" />
                      مراجعة الطلب والمستندات
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full border-border hover:border-primary/40 hover:bg-primary/5"
                      onClick={() => openDetail(provider)}
                    >
                      <Eye className="h-4 w-4 ml-2" />
                      التفاصيل
                    </Button>
                  )}

                  {provider.status === 'approved' && (
                    <Button
                      variant="outline"
                      className="w-full border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                      onClick={() => handleStatusChange(provider.id, "rejected")}
                      disabled={updateProvider.isPending}
                    >
                      <UserX className="h-4 w-4 ml-2" />
                      إلغاء التفعيل
                    </Button>
                  )}

                  {provider.status === 'rejected' && (
                    <Button
                      variant="outline"
                      className="w-full border-border hover:bg-green-500/10 hover:text-green-500 hover:border-green-500/30"
                      onClick={() => handleStatusChange(provider.id, "approved")}
                      disabled={updateProvider.isPending}
                    >
                      <UserCheck className="h-4 w-4 ml-2" />
                      تفعيل مجدداً
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={!!selected} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between gap-3 pl-6">
                  <DialogTitle className="text-xl">
                    {selected.serviceType || "خدمة عامة"}
                  </DialogTitle>
                  {getStatusBadge(selected.status)}
                </div>
                <DialogDescription>
                  {selected.name || "مزود خدمة"} — انضم {new Date(selected.createdAt).toLocaleDateString("ar-SA")}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5">
                {/* Info grid */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <InfoRow icon={<Phone className="h-4 w-4" />} label="الهاتف" value={selected.phone || "غير محدد"} />
                  <InfoRow icon={<MapPin className="h-4 w-4" />} label="البلدة" value={selected.city || "غير محددة"} />
                  <InfoRow icon={<Home className="h-4 w-4" />} label="عنوان السكن" value={selected.addressText || "غير محدد"} className="col-span-2" />
                  <InfoRow icon={<Award className="h-4 w-4" />} label="الخبرة" value={selected.experienceYears != null ? `${selected.experienceYears} سنوات` : "غير محددة"} />
                  <InfoRow icon={<Star className="h-4 w-4" />} label="التقييم" value={`${selected.rating.toFixed(1)} (${selected.ratingCount})`} />
                </div>

                {selected.bio && (
                  <div className="rounded-lg bg-secondary/40 border border-border p-3 text-sm text-muted-foreground">
                    {selected.bio}
                  </div>
                )}

                {selected.reviewNote && (
                  <div className="rounded-lg bg-orange-500/10 border border-orange-500/25 p-3">
                    <div className="flex items-center gap-2 text-orange-500 text-sm font-medium mb-1">
                      <MessageCircle className="h-4 w-4" />
                      طلب المعلومات الأخير
                    </div>
                    <p className="text-sm text-foreground">{selected.reviewNote}</p>
                  </div>
                )}

                {/* Documents */}
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
                    <FileText className="h-4 w-4" />
                    المستندات
                  </div>
                  {selected.docOsekPaturPath || selected.docOsekMurshePath || selected.docIdPath ? (
                    <div className="space-y-3">
                      {selected.docOsekPaturPath && (
                        <ProviderDocPreview providerId={selected.id} kind="osek_patur" label="شهادة عوسك باتور" />
                      )}
                      {selected.docOsekMurshePath && (
                        <ProviderDocPreview providerId={selected.id} kind="osek_murshe" label="شهادة عوسك مرشيه" optional />
                      )}
                      {selected.docIdPath && (
                        <ProviderDocPreview providerId={selected.id} kind="id" label="الهوية / الرخصة" />
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      لا توجد مستندات (تُحذف المستندات تلقائياً بعد القبول أو الرفض النهائي).
                    </p>
                  )}
                </div>

                {/* Request info */}
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-foreground">طلب معلومات إضافية</div>
                  <Textarea
                    placeholder="اكتب ما تريد من مزود الخدمة توضيحه أو إرفاقه..."
                    value={infoMessage}
                    onChange={(e) => setInfoMessage(e.target.value)}
                    rows={3}
                    className="bg-secondary border-none resize-none"
                  />
                  <Button
                    variant="outline"
                    className="w-full border-orange-500/30 text-orange-500 hover:bg-orange-500/10"
                    onClick={handleRequestInfo}
                    disabled={!infoMessage.trim() || busy}
                  >
                    <MessageCircle className="h-4 w-4 ml-2" />
                    إرسال طلب المعلومات وإشعار المزود
                  </Button>
                </div>

                {/* Rejection reason (optional, sent to the provider) */}
                <div className="space-y-2 pt-2 border-t border-border">
                  <div className="text-sm font-semibold text-foreground">سبب الرفض (اختياري)</div>
                  <Textarea
                    placeholder="سيُرسل هذا السبب للمزود ضمن إشعار الرفض..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    rows={2}
                    className="bg-secondary border-none resize-none"
                  />
                </div>

                {/* Decision actions */}
                <div className="flex gap-2">
                  <Button
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                    onClick={() => handleStatusChange(selected.id, "approved", true)}
                    disabled={busy || selected.status === "approved"}
                  >
                    <UserCheck className="h-4 w-4 ml-2" />
                    قبول
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => handleStatusChange(selected.id, "rejected", true, rejectReason.trim() || undefined)}
                    disabled={busy || selected.status === "rejected"}
                  >
                    <UserX className="h-4 w-4 ml-2" />
                    رفض
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground text-center -mt-2">
                  ملاحظة: عند القبول أو الرفض النهائي تُحذف المستندات نهائياً.
                </p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InfoRow({
  icon, label, value, className = "",
}: {
  icon: React.ReactNode; label: string; value: string; className?: string;
}) {
  return (
    <div className={`flex items-start gap-2 ${className}`}>
      <span className="text-muted-foreground mt-0.5">{icon}</span>
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-foreground font-medium">{value}</div>
      </div>
    </div>
  );
}
