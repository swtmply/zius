"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** Mirrors the native list footer: retry on failure, a loading tail, then an end marker. */
export function ListFooter({
  hasItems,
  hasNextPage,
  isError,
  isFetchNextPageError,
  isFetchingNextPage,
  errorMessage,
  loadingSlot,
  onLoadMore,
  onRetry,
}: {
  hasItems: boolean;
  hasNextPage: boolean;
  isError: boolean;
  isFetchNextPageError: boolean;
  isFetchingNextPage: boolean;
  errorMessage: string;
  loadingSlot: ReactNode;
  onLoadMore: () => void;
  onRetry: () => void;
}) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const canLoadMore = hasNextPage && !isFetchingNextPage && !isError && !isFetchNextPageError;

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !canLoadMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) onLoadMore();
      },
      { rootMargin: "320px" },
    );
    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [canLoadMore, onLoadMore]);

  if (isError || isFetchNextPageError) {
    return (
      <div role="alert" className="flex flex-col items-center gap-4 py-6">
        <p className="text-xs text-supporting">{errorMessage}</p>
        <button type="button" className="action-secondary" onClick={onRetry}>
          Try again
        </button>
      </div>
    );
  }

  if (isFetchingNextPage) return <div className="pt-3">{loadingSlot}</div>;

  if (hasNextPage) {
    return (
      <div ref={sentinelRef} className="flex justify-center py-6">
        <button type="button" className="action-secondary" onClick={onLoadMore}>
          Load more
        </button>
      </div>
    );
  }

  if (hasItems) return <p className="py-4 text-center text-xs text-supporting">No more.</p>;

  return null;
}
