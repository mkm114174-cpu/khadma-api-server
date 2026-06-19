export type ReqStatus =
  | "pending"
  | "active"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface RequestStatusStyle {
  color: string;
  label: string;
}

// Status → marker style. "pending" reads as available, "active" as a provider
// assigned (on the way), "in_progress" as work started.
export const REQUEST_STATUS_STYLE: Record<ReqStatus, RequestStatusStyle> = {
  pending: { color: "#C8A574", label: "متاح" },
  active: { color: "#2196F3", label: "تم القبول" },
  in_progress: { color: "#A855F7", label: "قيد التنفيذ" },
  completed: { color: "#4CAF50", label: "مكتمل" },
  cancelled: { color: "#FF4444", label: "ملغي" },
};

export function requestStatusStyle(status: string): RequestStatusStyle {
  return REQUEST_STATUS_STYLE[status as ReqStatus] ?? REQUEST_STATUS_STYLE.pending;
}

export interface RequestMarker {
  id: string;
  status: string;
  coordinate: { latitude: number; longitude: number };
}
