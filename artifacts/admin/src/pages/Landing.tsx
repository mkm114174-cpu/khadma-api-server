import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export function LandingPage() {
  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-background">
      {/* Abstract Background Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none"></div>
      
      <div className="relative z-10 mx-auto flex w-full max-w-md flex-col items-center justify-center p-6 text-center">
        <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-2xl bg-secondary border border-border shadow-2xl">
          <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="شعار خدمة" className="h-16 w-16" />
        </div>
        
        <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
          لوحة تحكم <span className="text-primary">خدمة</span>
        </h1>
        
        <p className="mb-10 text-lg text-muted-foreground">
          المركز الرئيسي لإدارة ومراقبة المنصة. مخصص لمسؤولي النظام فقط للتحكم في الطلبات، مزودي الخدمة، والتواصل.
        </p>
        
        <Link href="/sign-in" className="w-full">
          <Button size="lg" className="w-full h-14 text-lg font-bold shadow-[0_0_20px_rgba(245,197,24,0.3)] hover:shadow-[0_0_30px_rgba(245,197,24,0.5)] transition-all">
            تسجيل الدخول
            <ArrowLeft className="mr-2 h-5 w-5" />
          </Button>
        </Link>
      </div>

      <div className="absolute bottom-6 text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} خدمة. جميع الحقوق محفوظة.
      </div>
    </div>
  );
}