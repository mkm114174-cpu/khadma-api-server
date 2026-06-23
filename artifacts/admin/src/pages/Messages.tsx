import { useState } from "react";
import { useListMessages, useUpdateMessage, getListMessagesQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Mail, User, Clock, Send, CheckCircle2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

export function MessagesPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const { data: messages, isLoading } = useListMessages();
  const updateMessage = useUpdateMessage();
  const [replyText, setReplyText] = useState<{ [key: number]: string }>({});

  const filteredMessages = messages?.filter(m => {
    if (filter !== "all" && m.status !== filter) return false;
    if (search && !m.name.includes(search) && !(m.email || "").includes(search) && !m.subject?.includes(search)) return false;
    return true;
  });

  const handleUpdateStatus = (id: number, status: "open" | "resolved", reply?: string) => {
    updateMessage.mutate(
      { id, data: { status, ...(reply ? { reply } : {}) } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListMessagesQueryKey() });
          toast({ title: "تم التحديث", description: "تم تحديث حالة الرسالة بنجاح" });
          if (reply) {
            setReplyText(prev => ({ ...prev, [id]: "" }));
          }
        },
        onError: () => toast({ variant: "destructive", title: "خطأ", description: "حدث خطأ أثناء تحديث الرسالة" })
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">رسائل التواصل</h1>
          <p className="text-muted-foreground mt-1">الرد على استفسارات وشكاوى العملاء ومزودي الخدمة.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 bg-card p-4 rounded-xl border border-border">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="بحث بالاسم أو البريد الإلكتروني..." 
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
            <SelectItem value="open">مفتوحة</SelectItem>
            <SelectItem value="resolved">محلولة</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6">
        {isLoading ? (
          [...Array(3)].map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-xl" />)
        ) : filteredMessages?.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground bg-card rounded-xl border border-border">
            <p className="text-lg">لا توجد رسائل تطابق بحثك.</p>
          </div>
        ) : (
          filteredMessages?.map(message => (
            <Card key={message.id} className="border-border bg-card shadow-sm hover:border-primary/30 transition-all">
              <CardHeader className="pb-3 border-b border-border/50">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl text-foreground mb-1">{message.subject || 'بدون عنوان'}</CardTitle>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <User className="h-4 w-4" />
                        <span>{message.name}</span>
                      </div>
                      {message.email && (
                        <div className="flex items-center gap-1.5">
                          <Mail className="h-4 w-4" />
                          <span dir="ltr">{message.email}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4" />
                        <span dir="ltr">{new Date(message.createdAt).toLocaleString('ar-SA')}</span>
                      </div>
                    </div>
                  </div>
                  {message.status === 'resolved' ? (
                    <Badge className="bg-green-500/10 text-green-500 border-green-500/20 px-3 py-1">محلولة</Badge>
                  ) : (
                    <Badge className="bg-rose-500/10 text-rose-500 border-rose-500/20 px-3 py-1">مفتوحة</Badge>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="pt-4 space-y-4">
                <div className="bg-secondary/40 border border-border rounded-lg p-4 text-foreground text-sm leading-relaxed">
                  {message.message}
                </div>

                {message.reply && (
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                    <p className="text-xs font-bold text-primary mb-2 flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      رد الإدارة:
                    </p>
                    <p className="text-foreground text-sm leading-relaxed">{message.reply}</p>
                  </div>
                )}

                {message.status === 'open' && (
                  <div className="space-y-3 pt-2">
                    <Textarea 
                      placeholder="اكتب ردك هنا..." 
                      className="min-h-[100px] bg-background border-border focus-visible:ring-primary"
                      value={replyText[message.id] || ''}
                      onChange={(e) => setReplyText({ ...replyText, [message.id]: e.target.value })}
                    />
                    <div className="flex gap-3 justify-end">
                      <Button 
                        variant="outline" 
                        className="border-border hover:bg-secondary"
                        onClick={() => handleUpdateStatus(message.id, "resolved")}
                        disabled={updateMessage.isPending}
                      >
                        إغلاق بدون رد
                      </Button>
                      <Button 
                        className="bg-primary text-black hover:bg-primary/90 font-bold"
                        onClick={() => handleUpdateStatus(message.id, "resolved", replyText[message.id])}
                        disabled={!replyText[message.id]?.trim() || updateMessage.isPending}
                      >
                        <Send className="h-4 w-4 ml-2" />
                        إرسال وإغلاق
                      </Button>
                    </div>
                  </div>
                )}
                
                {message.status === 'resolved' && (
                   <div className="flex justify-end">
                     <Button 
                       variant="ghost" 
                       size="sm"
                       className="text-muted-foreground hover:text-foreground"
                       onClick={() => handleUpdateStatus(message.id, "open")}
                       disabled={updateMessage.isPending}
                     >
                       إعادة فتح التذكرة
                     </Button>
                   </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}