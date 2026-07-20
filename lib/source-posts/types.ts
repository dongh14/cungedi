export type SourcePostPlatform =
  | "xiaohongshu"
  | "douyin"
  | "web"
  | "unknown";

export type SourcePostProcessingStatus =
  | "captured"
  | "processing"
  | "needs_review"
  | "saved"
  | "failed";

export type SavedSourcePost = {
  id: string;
  userId: string;
  platform: SourcePostPlatform;
  originalUrl: string | null;
  resolvedUrl: string | null;
  originalText: string | null;
  sourceImagePath: string | null;
  processingStatus: SourcePostProcessingStatus;
  detectedCandidates: unknown[];
  userNote: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateSavedSourcePostInput = {
  platform: SourcePostPlatform;
  originalUrl: string | null;
  resolvedUrl: string | null;
  originalText: string | null;
  sourceImagePath?: string | null;
  processingStatus?: SourcePostProcessingStatus;
  detectedCandidates?: unknown[];
  userNote?: string | null;
};

export type UpdateSavedSourcePostInput = {
  processingStatus?: SourcePostProcessingStatus;
  userNote?: string | null;
};

export type SavedSourcePostPlace = {
  sourcePostId: string;
  restaurantId: number;
  name: string;
  city: string;
  country: string | null;
  district: string | null;
  category: string;
  createdAt: string;
};

export type SourcePostRepositoryResult<T> = {
  data: T;
  error: Error | null;
};
