import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useQueryClient } from "@tanstack/react-query";

import {
  getListProvidersQueryKey,
  getListReviewsQueryKey,
  useCreateReview,
  useListReviews,
} from "@workspace/api-client-react";

import { useColors } from "@/hooks/useColors";
import { useLang } from "@/context/LanguageContext";

const Y = "#C8A574";

/**
 * Post-completion review entry. Shown on a completed request for the customer.
 * Lets the customer leave a 1–5 star rating + optional comment once. If a review
 * already exists for this request, it renders the read-only submitted state.
 */
export function ReviewSection({
  requestId,
  providerId,
}: {
  requestId: number;
  providerId: number;
}) {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { t, isRTL } = useLang();
  const queryClient = useQueryClient();

  const reviewsQ = useListReviews(
    { providerId },
    { query: { queryKey: getListReviewsQueryKey({ providerId }) } },
  );
  const existing = (reviewsQ.data ?? []).find((r) => r.requestId === requestId);

  const createReview = useCreateReview();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);

  const align = isRTL ? "right" : "left";

  const submit = async () => {
    if (rating < 1) {
      setError(t.review.selectStars);
      return;
    }
    setError(null);
    try {
      await createReview.mutateAsync({
        data: {
          requestId,
          providerId,
          rating,
          comment: comment.trim() ? comment.trim() : undefined,
        },
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getListReviewsQueryKey({ providerId }) }),
        queryClient.invalidateQueries({ queryKey: getListProvidersQueryKey() }),
      ]);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch {
      setError(t.review.error);
    }
  };

  // Already-reviewed (read-only) state.
  if (existing) {
    return (
      <View style={styles.card}>
        <View style={[styles.headerRow, { flexDirection: isRTL ? "row" : "row-reverse" }]}>
          <Feather name="check-circle" size={16} color="#4CAF50" />
          <Text style={styles.headerTitle}>{t.review.thanks}</Text>
        </View>
        <Text style={[styles.label, { textAlign: align }]}>{t.review.yourReview}</Text>
        <StarRow value={existing.rating} size={26} />
        {!!existing.comment && (
          <Text style={[styles.commentRead, { textAlign: align }]}>{existing.comment}</Text>
        )}
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={[styles.headerRow, { flexDirection: isRTL ? "row" : "row-reverse" }]}>
        <Feather name="star" size={16} color={Y} />
        <Text style={styles.headerTitle}>{t.review.title}</Text>
      </View>
      <Text style={[styles.subtitle, { textAlign: align }]}>{t.review.subtitle}</Text>

      <StarRow value={rating} size={36} editable onChange={setRating} />

      <Text style={[styles.label, { textAlign: align }]}>{t.review.commentLabel}</Text>
      <TextInput
        style={[styles.input, { textAlign: align }]}
        placeholder={t.review.commentPlaceholder}
        placeholderTextColor={C.mutedForeground}
        value={comment}
        onChangeText={setComment}
        multiline
        numberOfLines={3}
      />

      {!!error && <Text style={[styles.error, { textAlign: align }]}>{error}</Text>}

      <TouchableOpacity
        style={[styles.submitBtn, createReview.isPending && { opacity: 0.6 }]}
        onPress={submit}
        disabled={createReview.isPending}
        activeOpacity={0.85}
      >
        {createReview.isPending ? (
          <ActivityIndicator size="small" color="#000" />
        ) : (
          <>
            <Feather name="send" size={16} color="#000" />
            <Text style={styles.submitText}>{t.review.submit}</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

function StarRow({
  value,
  size,
  editable,
  onChange,
}: {
  value: number;
  size: number;
  editable?: boolean;
  onChange?: (n: number) => void;
}) {
  const C = useColors();
  return (
    <View style={{ flexDirection: "row", gap: 8, alignSelf: "center", paddingVertical: 6 }}>
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = i <= value;
        const star = (
          <Feather name="star" size={size} color={filled ? Y : C.border} />
        );
        if (!editable) return <View key={i}>{star}</View>;
        return (
          <TouchableOpacity key={i} onPress={() => onChange?.(i)} activeOpacity={0.7} hitSlop={6}>
            {star}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const makeStyles = (C: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    card: {
      backgroundColor: C.card,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: Y + "30",
      padding: 16,
      gap: 12,
    },
    headerRow: { alignItems: "center", gap: 8, justifyContent: "center" },
    headerTitle: { fontSize: 17, fontWeight: "700", color: C.foreground },
    subtitle: { fontSize: 13, color: C.mutedForeground, lineHeight: 19 },
    label: { fontSize: 13, fontWeight: "600", color: C.foreground },
    input: {
      backgroundColor: C.background,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: C.border,
      padding: 12,
      minHeight: 76,
      fontSize: 14,
      color: C.foreground,
      textAlignVertical: "top",
    },
    commentRead: { fontSize: 14, color: C.foreground, lineHeight: 21 },
    error: { fontSize: 13, color: "#FF6B6B" },
    submitBtn: {
      height: 48,
      backgroundColor: Y,
      borderRadius: 13,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    submitText: { fontSize: 15, fontWeight: "700", color: "#000" },
  });
