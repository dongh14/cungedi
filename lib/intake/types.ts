export type IntakeInputKind = "shared_text" | "url" | "text" | "unknown";

export type IntakePlatform = "xiaohongshu" | "douyin" | "web" | "unknown";

export type SourceResolutionStatus =
  | "not_required"
  | "resolved"
  | "timeout"
  | "blocked"
  | "invalid"
  | "redirect_limit"
  | "failed";

export type ResolvedSourceUrl = {
  originalUrl: string;
  resolvedUrl: string;
  platform: IntakePlatform;
  resolutionStatus: SourceResolutionStatus;
  redirectCount: number;
};

export type NormalizedIntakeInput = {
  rawInput: string;
  inputKind: IntakeInputKind;
  platform: IntakePlatform;
  originalUrl: string | null;
  detectedUrls: string[];
  surroundingText: string;
};
