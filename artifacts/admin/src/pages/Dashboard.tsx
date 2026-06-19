import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useListRequests, useListMessages, useGetAdminCommissionOverview, useListSkills, useGetOnlineCount, getGetOnlineCountQueryKey } from "@workspace/api-client-react";
import { Users, ClipboardList, CheckCircle, Clock, MessageSquare, Wallet, Radio } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAllProviders } from "@/hooks/use-all-providers";

export function DashboardPage() {
  const { data: providers, isLoading: loadingProviders } = useAllProviders();
  const { data: requests, isLoading: loadingRequests } = useListRequests();
  const { data: messages, isLoading: loadingMessages } = useListMessages();
  const { data: commission, isLoading: loadingCommission } = useGetAdminCommissionOverview();
  const { data: skills } = useListSkills({ type: "all" });
  const { data: online, isLoading: loadingOnline, isError: onlineError } = useGetOnlineCount({
    query: { queryKey: getGetOnlineCountQueryKey(), refetchInterval: 15000 },
  });
  const onlineWindow = online?.windowMinutes ?? 5;

  const stats = [
    {
      title: "إجمالي مزودي الخدمة",
      value: providers?.length ?? 0,
      icon: Users,
      loading: loadingProviders,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      title: "طلبات المراجعة",
      value: providers?.filter(p => p.status === 'under_review' || p.status === 'pending').length ?? 0,
      icon: Clock,
      loading: loadingProviders,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    {
      title: "الطلبات النشطة",
      value: requests?.filter(r => r.status === 'active' || r.status === 'pending').length ?? 0,
      icon: ClipboardList,
      loading: loadingRequests,
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      title: "رسائل غير مقروءة",
      value: messages?.filter(m => m.status === 'open').length ?? 0,
      icon: MessageSquare,
      loading: loadingMessages,
      color: "text-rose-500",
      bg: "bg-rose-500/10",
    },
    {
      title: "إجمالي عمولة المنصة",
      value: `${(commission?.totalCommission ?? 0).toLocaleString("ar-SA")} ر.س`,
      icon: Wallet,
      loading: loadingCommission,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      title: "عمولة مستحقة (غير محصّلة)",
      value: `${(commission?.totalOutstanding ?? 0).toLocaleString("ar-SA")} ر.س`,
      icon: Wallet,
      loading: loadingCommission,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    }
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">نظرة عامة</h1>
          <p className="text-muted-foreground mt-1">مرحباً بك في لوحة تحكم خدمة. إليك ملخص لأداء المنصة.</p>
        </div>

        <Card className="border-border bg-card shadow-sm w-full sm:w-auto">
          <CardContent className="flex items-center gap-4 py-4 px-5">
            <div className="relative rounded-full bg-green-500/10 p-3">
              <Radio className="h-5 w-5 text-green-500" />
              <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500/70" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
              </span>
            </div>
            <div>
              {loadingOnline ? (
                <Skeleton className="h-8 w-12" />
              ) : onlineError ? (
                <div className="text-3xl font-bold text-muted-foreground leading-none">—</div>
              ) : (
                <div className="text-3xl font-bold text-foreground leading-none">
                  {(online?.count ?? 0).toLocaleString("ar-SA")}
                </div>
              )}
              <div className="text-xs text-muted-foreground mt-1">
                مستخدم نشط (آخر {onlineWindow} دقائق)
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat, i) => (
          <Card key={i} className="border-border bg-card shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`rounded-full p-2 ${stat.bg}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              {stat.loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-3xl font-bold text-foreground">{stat.value}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle>أحدث طلبات التسجيل</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingProviders ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : providers && providers.length > 0 ? (
              <div className="space-y-4">
                {providers.slice(0, 5).map(provider => (
                  <div key={provider.id} className="flex items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium text-foreground">{provider.serviceType || 'غير محدد'}</p>
                      <p className="text-sm text-muted-foreground">{provider.phone || 'لا يوجد هاتف'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border
                        ${provider.status === 'approved' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
                          provider.status === 'pending' || provider.status === 'under_review' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 
                          'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                        {provider.status === 'approved' ? 'مقبول' : provider.status === 'pending' || provider.status === 'under_review' ? 'قيد المراجعة' : 'مرفوض'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                <CheckCircle className="mb-2 h-8 w-8 opacity-20" />
                <p>لا يوجد مزودين حالياً</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle>أحدث الطلبات</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingRequests ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : requests && requests.length > 0 ? (
              <div className="space-y-4">
                {requests.slice(0, 5).map(req => (
                  <div key={req.id} className="flex items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium text-foreground">طلب #{req.requestNumber}</p>
                      <p className="text-sm text-muted-foreground">{skills?.find(s => s.id === req.skillId)?.name ?? "طلب"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border
                        ${req.status === 'active' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 
                          req.status === 'completed' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
                          req.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 
                          'bg-gray-500/10 text-gray-500 border-gray-500/20'}`}>
                        {req.status === 'active' ? 'نشط' : req.status === 'completed' ? 'مكتمل' : req.status === 'pending' ? 'بانتظار العروض' : 'ملغي'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                <CheckCircle className="mb-2 h-8 w-8 opacity-20" />
                <p>لا توجد طلبات حالياً</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}