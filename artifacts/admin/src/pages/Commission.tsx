import { useState } from "react";
import {
  useGetAdminCommissionOverview,
  useRecordCommissionSettlement,
  getGetAdminCommissionOverviewQueryKey,
  type AdminProviderCommission,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Wallet, Coins, TrendingUp, AlertTriangle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const fmt = (n: number) => `${n.toLocaleString("ar-SA")} ر.س`;

export function CommissionPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useGetAdminCommissionOverview();
  const recordSettlement = useRecordCommissionSettlement();

  const [target, setTarget] = useState<AdminProviderCommission | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const openSettle = (p: AdminProviderCommission) => {
    setTarget(p);
    setAmount(p.owed > 0 ? String(p.owed) : "");
    setNote("");
  };

  const submitSettlement = () => {
    if (!target) return;
    const value = Number(amount);
    if (!Number.isInteger(value) || value < 1) {
      toast({
        variant: "destructive",
        title: "مبلغ غير صالح",
        description: "الرجاء إدخال مبلغ صحيح أكبر من صفر.",
      });
      return;
    }
    recordSettlement.mutate(
      {
        data: {
          providerId: target.providerId,
          amount: value,
          ...(note.trim() ? { note: note.trim() } : {}),
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: getGetAdminCommissionOverviewQueryKey(),
          });
          toast({
            title: "تم تسجيل التسوية",
            description: `تم تسجيل دفعة ${fmt(value)} للمزود ${target.name ?? target.serviceType}.`,
          });
          setTarget(null);
        },
        onError: () => {
          toast({
            variant: "destructive",
            title: "خطأ",
            description: "تعذّر تسجيل التسوية. حاول مرة أخرى.",
          });
        },
      },
    );
  };

  const stats = [
    {
      title: "إجمالي العمولة",
      value: data?.totalCommission ?? 0,
      icon: Coins,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      title: "المبلغ المسدّد",
      value: data?.totalSettled ?? 0,
      icon: TrendingUp,
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      title: "العمولة المستحقة (غير محصّلة)",
      value: data?.totalOutstanding ?? 0,
      icon: Wallet,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">العمولات والمحفظة</h1>
        <p className="text-muted-foreground mt-1">
          متابعة عمولة المنصة المستحقة على مزودي الخدمة وتسجيل التسويات.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {stats.map((stat, i) => (
          <Card key={i} className="border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`rounded-full p-2 ${stat.bg}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold text-foreground">
                  {fmt(stat.value)}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>أرصدة العمولة حسب مزود الخدمة</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !data || data.providers.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Wallet className="mx-auto mb-2 h-8 w-8 opacity-20" />
              <p>لا توجد عمولات مسجّلة بعد.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">مزود الخدمة</TableHead>
                    <TableHead className="text-right">الخدمة</TableHead>
                    <TableHead className="text-right">الطلبات</TableHead>
                    <TableHead className="text-right">إجمالي العمولة</TableHead>
                    <TableHead className="text-right">المسدّد</TableHead>
                    <TableHead className="text-right">المستحق</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-left">إجراء</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.providers.map((p) => (
                    <TableRow key={p.providerId}>
                      <TableCell className="font-medium text-foreground">
                        {p.name ?? "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {p.serviceType}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {p.jobsCount}
                      </TableCell>
                      <TableCell className="text-foreground">
                        {fmt(p.totalCommission)}
                      </TableCell>
                      <TableCell className="text-green-500">
                        {fmt(p.totalSettled)}
                      </TableCell>
                      <TableCell
                        className={
                          p.owed > 0
                            ? "font-bold text-amber-500"
                            : "text-muted-foreground"
                        }
                      >
                        {fmt(p.owed)}
                      </TableCell>
                      <TableCell>
                        {p.blocked ? (
                          <Badge className="gap-1 border-red-500/20 bg-red-500/10 text-red-500">
                            <AlertTriangle className="h-3 w-3" />
                            محظور
                          </Badge>
                        ) : p.owed > 0 ? (
                          <Badge className="border-amber-500/20 bg-amber-500/10 text-amber-500">
                            مستحقة
                          </Badge>
                        ) : (
                          <Badge className="border-green-500/20 bg-green-500/10 text-green-500">
                            مسدّدة
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-left">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-border"
                          disabled={p.owed <= 0}
                          onClick={() => openSettle(p)}
                        >
                          تسجيل تسوية
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!target} onOpenChange={(o) => !o && setTarget(null)}>
        <DialogContent className="bg-card">
          <DialogHeader>
            <DialogTitle>تسجيل تسوية عمولة</DialogTitle>
            <DialogDescription>
              {target
                ? `تسجيل دفعة سدّدها ${target.name ?? target.serviceType}. المستحق حالياً ${fmt(target.owed)}.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="settle-amount">المبلغ المسدّد (ر.س)</Label>
              <Input
                id="settle-amount"
                type="number"
                min={1}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-secondary border-none"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="settle-note">ملاحظة (اختياري)</Label>
              <Input
                id="settle-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="مثال: تحويل بنكي بتاريخ ..."
                className="bg-secondary border-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTarget(null)}>
              إلغاء
            </Button>
            <Button
              onClick={submitSettlement}
              disabled={recordSettlement.isPending}
            >
              تأكيد التسوية
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
