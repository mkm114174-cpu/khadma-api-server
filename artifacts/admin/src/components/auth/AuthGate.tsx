import { Redirect } from "wouter";
import { useGetCurrentUser } from "@workspace/api-client-react";
import { Loader2, ShieldAlert, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthSession } from "@/context/AuthContext";

function getErrorStatus(error: unknown): number | undefined {
  if (error && typeof error === "object" && "status" in error) {
    const status = (error as { status?: unknown }).status;
    if (typeof status === "number") return status;
  }
  return undefined;
}

function FullScreenLoader() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse font-medium">جاري التحميل...</p>
      </div>
    </div>
  );
}

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { sessionLoaded, isSignedIn, logout } = useAuthSession();
  const { data: user, isLoading, error, refetch, isFetching } = useGetCurrentUser();

  if (!sessionLoaded) {
    return <FullScreenLoader />;
  }

  if (!isSignedIn) {
    return <Redirect to="/sign-in" />;
  }

  if (isLoading) {
    return <FullScreenLoader />;
  }

  const status = getErrorStatus(error);

  if (status === 401) {
    return <Redirect to="/sign-in" />;
  }

  if (error && status !== 404) {
    return (
      <div className="flex h-[100dvh] w-full flex-col items-center justify-center bg-background p-4 text-center">
        <div className="flex flex-col items-center gap-6 rounded-2xl border border-border bg-card p-10 shadow-2xl max-w-md w-full">
          <div className="rounded-full bg-amber-500/10 p-4">
            <AlertTriangle className="h-12 w-12 text-amber-500" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">تعذّر الاتصال</h1>
            <p className="text-muted-foreground">حدث خطأ أثناء تحميل بياناتك. تحقّق من اتصالك ثم حاول مرة أخرى.</p>
          </div>
          <Button
            variant="default"
            size="lg"
            className="w-full font-bold"
            onClick={() => refetch()}
            disabled={isFetching}
            data-testid="button-retry-auth"
          >
            {isFetching ? <Loader2 className="h-5 w-5 animate-spin" /> : "إعادة المحاولة"}
          </Button>
        </div>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="flex h-[100dvh] w-full flex-col items-center justify-center bg-background p-4 text-center">
        <div className="flex flex-col items-center gap-6 rounded-2xl border border-border bg-card p-10 shadow-2xl max-w-md w-full">
          <div className="rounded-full bg-destructive/10 p-4">
            <ShieldAlert className="h-12 w-12 text-destructive" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">غير مصرح لك</h1>
            <p className="text-muted-foreground">هذه اللوحة مخصّصة للمسؤولين فقط. حسابك الحالي لا يملك الصلاحيات الكافية للوصول.</p>
          </div>
          <Button
            variant="default"
            size="lg"
            className="w-full font-bold"
            onClick={() => void logout()}
          >
            تسجيل الخروج
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
