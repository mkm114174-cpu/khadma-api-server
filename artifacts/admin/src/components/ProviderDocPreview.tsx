import { useEffect, useState } from "react";
import { getProviderDocument } from "@workspace/api-client-react";
import { FileText, Loader2, ExternalLink, AlertCircle } from "lucide-react";

type DocKind = "osek_patur" | "osek_murshe" | "id";

export function ProviderDocPreview({
  providerId,
  kind,
  label,
  optional = false,
}: {
  providerId: number;
  kind: DocKind;
  label: string;
  optional?: boolean;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [mime, setMime] = useState<string>("");
  const [state, setState] = useState<"loading" | "loaded" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;
    setState("loading");

    getProviderDocument(providerId, kind)
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setMime(blob.type);
        setUrl(objectUrl);
        setState("loaded");
      })
      .catch(() => {
        if (!cancelled) setState("error");
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [providerId, kind]);

  const isImage = mime.startsWith("image/");

  return (
    <div className="rounded-lg border border-border bg-secondary/40 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <span className="text-sm font-medium text-foreground">{label}</span>
        {optional && (
          <span className="text-[11px] text-muted-foreground">اختياري</span>
        )}
      </div>
      <div className="p-3">
        {state === "loading" && (
          <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            جارٍ تحميل المستند...
          </div>
        )}
        {state === "error" && (
          <div className="flex items-center justify-center gap-2 py-8 text-destructive text-sm">
            <AlertCircle className="h-4 w-4" />
            تعذّر تحميل المستند
          </div>
        )}
        {state === "loaded" && url && (
          isImage ? (
            <a href={url} target="_blank" rel="noopener noreferrer" className="block">
              <img
                src={url}
                alt={label}
                className="max-h-64 w-full rounded-md object-contain bg-black/20"
              />
            </a>
          ) : (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-md border border-border bg-card py-6 text-sm font-medium text-primary hover:bg-primary/5 transition-colors"
            >
              <FileText className="h-5 w-5" />
              فتح المستند
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )
        )}
      </div>
    </div>
  );
}
