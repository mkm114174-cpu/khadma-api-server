import { useListProviders, ProviderStatus, type Provider } from "@workspace/api-client-react";

export function useAllProviders() {
  const pending = useListProviders({ status: ProviderStatus.pending });
  const underReview = useListProviders({ status: ProviderStatus.under_review });
  const needsInfo = useListProviders({ status: ProviderStatus.needs_info });
  const approved = useListProviders({ status: ProviderStatus.approved });
  const rejected = useListProviders({ status: ProviderStatus.rejected });

  const isLoading =
    pending.isLoading ||
    underReview.isLoading ||
    needsInfo.isLoading ||
    approved.isLoading ||
    rejected.isLoading;

  const data: Provider[] = [
    ...(pending.data ?? []),
    ...(underReview.data ?? []),
    ...(needsInfo.data ?? []),
    ...(approved.data ?? []),
    ...(rejected.data ?? []),
  ].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return { data, isLoading };
}
