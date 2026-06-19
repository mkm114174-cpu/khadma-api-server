import { useState } from "react";
import { 
  useListRequests, 
  useUpdateRequest, 
  useListRequestOffers,
  useUpdateOffer,
  useListSkills,
  getListRequestsQueryKey,
  getListRequestOffersQueryKey
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, MapPin, Clock, Info, Check, X, DollarSign, Edit } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

// Sub-component to load and manage offers for a request
function RequestOffers({ requestId }: { requestId: number }) {
  const { data: offers, isLoading } = useListRequestOffers(requestId, {
    query: { enabled: !!requestId, queryKey: getListRequestOffersQueryKey(requestId) }
  });
  const updateOffer = useUpdateOffer();
  const queryClient = useQueryClient();

  const [editingOfferId, setEditingOfferId] = useState<number | null>(null);
  const [editPrice, setEditPrice] = useState("");
  const [editMessage, setEditMessage] = useState("");

  const handleUpdateOfferStatus = (offerId: number, status: "accepted" | "rejected") => {
    updateOffer.mutate(
      { id: offerId, data: { status } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListRequestOffersQueryKey(requestId) });
          toast({ title: "تم التحديث", description: "تم تحديث حالة العرض بنجاح." });
        },
        onError: () => toast({ variant: "destructive", title: "خطأ", description: "فشل تحديث حالة العرض." })
      }
    );
  };

  const openEdit = (offer: { id: number; price: number; message?: string | null }) => {
    setEditingOfferId(offer.id);
    setEditPrice(String(offer.price));
    setEditMessage(offer.message ?? "");
  };

  const handleSaveEdit = () => {
    if (editingOfferId === null) return;
    const priceNum = Number(editPrice);
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      toast({ variant: "destructive", title: "خطأ", description: "الرجاء إدخال سعر صحيح." });
      return;
    }
    updateOffer.mutate(
      { id: editingOfferId, data: { price: priceNum, message: editMessage } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListRequestOffersQueryKey(requestId) });
          toast({ title: "تم الحفظ", description: "تم تعديل العرض بنجاح." });
          setEditingOfferId(null);
        },
        onError: () => toast({ variant: "destructive", title: "خطأ", description: "فشل تعديل العرض." })
      }
    );
  };

  if (isLoading) return <Skeleton className="h-20 w-full" />;
  if (!offers || offers.length === 0) return <div className="text-center text-muted-foreground p-4 bg-secondary rounded-lg">لا توجد عروض لهذا الطلب بعد.</div>;

  return (
    <div className="space-y-3 mt-4">
      <h4 className="font-semibold text-foreground border-b border-border pb-2">العروض المقدمة ({offers.length})</h4>
      {offers.map(offer => (
        <div key={offer.id} className="bg-secondary/50 border border-border rounded-lg p-3 flex flex-col sm:flex-row justify-between gap-3" data-testid={`card-offer-${offer.id}`}>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-lg text-primary" data-testid={`text-offer-price-${offer.id}`}>{offer.price} ر.س</span>
              <Badge variant="outline" className="text-xs">
                {offer.status === 'accepted' ? 'مقبول' : offer.status === 'rejected' ? 'مرفوض' : 'قيد الانتظار'}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{offer.message || 'لا توجد رسالة من المزود'}</p>
            {offer.estimatedDuration && <p className="text-xs text-muted-foreground mt-1">المدة المتوقعة: {offer.estimatedDuration}</p>}
          </div>
          
          <div className="flex gap-2 shrink-0 self-start sm:self-center">
            {offer.status === 'pending' && (
              <>
                <Button size="sm" className="bg-green-500 hover:bg-green-600 text-white" onClick={() => handleUpdateOfferStatus(offer.id, 'accepted')} disabled={updateOffer.isPending} data-testid={`button-accept-offer-${offer.id}`}>
                  <Check className="h-4 w-4 ml-1" /> قبول
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleUpdateOfferStatus(offer.id, 'rejected')} disabled={updateOffer.isPending} data-testid={`button-reject-offer-${offer.id}`}>
                  <X className="h-4 w-4 ml-1" /> رفض
                </Button>
              </>
            )}
            <Button size="sm" variant="outline" onClick={() => openEdit(offer)} disabled={updateOffer.isPending} data-testid={`button-edit-offer-${offer.id}`}>
              <Edit className="h-4 w-4 ml-1" /> تعديل
            </Button>
          </div>
        </div>
      ))}

      <Dialog open={editingOfferId !== null} onOpenChange={(open) => !open && setEditingOfferId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل العرض</DialogTitle>
            <DialogDescription>عدّل سعر العرض أو رسالته.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">السعر (ر.س)</label>
              <Input
                type="number"
                min={0}
                value={editPrice}
                onChange={(e) => setEditPrice(e.target.value)}
                className="bg-secondary border-border"
                data-testid="input-offer-price"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">الرسالة</label>
              <Input
                value={editMessage}
                onChange={(e) => setEditMessage(e.target.value)}
                className="bg-secondary border-border"
                data-testid="input-offer-message"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setEditingOfferId(null)} data-testid="button-cancel-offer-edit">إلغاء</Button>
              <Button onClick={handleSaveEdit} disabled={updateOffer.isPending} className="font-bold" data-testid="button-save-offer-edit">
                {updateOffer.isPending ? "جاري الحفظ..." : "حفظ"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function RequestsPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const { data: requests, isLoading } = useListRequests();
  const updateRequest = useUpdateRequest();
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);

  const { data: skills } = useListSkills({ type: "all" });
  const skillName = (id: number) => skills?.find(s => s.id === id)?.name ?? "طلب";

  const filteredRequests = requests?.filter(r => {
    if (filter !== "all" && r.status !== filter) return false;
    if (search && !skillName(r.skillId).includes(search) && !r.requestNumber.includes(search)) return false;
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active": return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">نشط</Badge>;
      case "completed": return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">مكتمل</Badge>;
      case "cancelled": return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">ملغي</Badge>;
      default: return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">بانتظار العروض</Badge>;
    }
  };

  const handleStatusChange = (id: number, status: "pending" | "active" | "completed" | "cancelled") => {
    updateRequest.mutate(
      { id, data: { status } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListRequestsQueryKey() });
          toast({ title: "تم التحديث", description: "تم تحديث حالة الطلب بنجاح" });
        },
        onError: () => toast({ variant: "destructive", title: "خطأ", description: "حدث خطأ أثناء تحديث الحالة" })
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">الطلبات والعروض</h1>
          <p className="text-muted-foreground mt-1">مراقبة طلبات العملاء وإدارة عروض الأسعار.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 bg-card p-4 rounded-xl border border-border">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="بحث بنوع الخدمة أو رقم الطلب..." 
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
            <SelectItem value="pending">بانتظار العروض</SelectItem>
            <SelectItem value="active">نشط</SelectItem>
            <SelectItem value="completed">مكتمل</SelectItem>
            <SelectItem value="cancelled">ملغي</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          [...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)
        ) : filteredRequests?.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground bg-card rounded-xl border border-border">
            <p className="text-lg">لا يوجد طلبات تطابق بحثك.</p>
          </div>
        ) : (
          filteredRequests?.map(request => (
            <Card key={request.id} className="border-border bg-card overflow-hidden transition-all hover:border-primary/30">
              <div className="p-5 flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-mono text-muted-foreground px-2 py-0.5 bg-secondary rounded-md">#{request.requestNumber}</span>
                        {getStatusBadge(request.status)}
                      </div>
                      <h3 className="text-xl font-bold text-foreground">{skillName(request.skillId)}</h3>
                    </div>
                    
                    <Select 
                      value={request.status} 
                      onValueChange={(val: any) => handleStatusChange(request.id, val)}
                    >
                      <SelectTrigger className="w-[130px] h-8 text-xs bg-secondary border-border">
                        <SelectValue placeholder="تغيير الحالة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">بانتظار العروض</SelectItem>
                        <SelectItem value="active">نشط</SelectItem>
                        <SelectItem value="completed">مكتمل</SelectItem>
                        <SelectItem value="cancelled">ملغي</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <p className="text-muted-foreground text-sm line-clamp-2 bg-secondary/30 p-3 rounded-lg border border-border/50">
                    {request.description || 'لا يوجد وصف'}
                  </p>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-primary" />
                      <span>{new Date(request.createdAt).toLocaleDateString('ar-SA')}</span>
                    </div>
                    {request.address && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span>{request.address}</span>
                      </div>
                    )}
                    {(request.priceMin || request.priceMax) && (
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="h-4 w-4 text-primary" />
                        <span>{request.priceMin} - {request.priceMax} ر.س</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="w-full md:w-48 shrink-0 flex flex-col justify-center border-t md:border-t-0 md:border-r border-border pt-4 md:pt-0 md:pr-6">
                  <Button 
                    className="w-full font-bold shadow-sm hover:shadow-primary/20" 
                    onClick={() => setSelectedRequestId(selectedRequestId === request.id ? null : request.id)}
                    variant={selectedRequestId === request.id ? "secondary" : "default"}
                  >
                    {selectedRequestId === request.id ? 'إخفاء العروض' : 'عرض التفاصيل والعروض'}
                  </Button>
                </div>
              </div>
              
              {selectedRequestId === request.id && (
                <div className="bg-background/50 border-t border-border p-5">
                  <RequestOffers requestId={request.id} />
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}