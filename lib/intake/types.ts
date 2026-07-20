export type IntakeInputKind = "shared_text" | "url" | "text" | "unknown";

export type IntakePlatform = "xiaohongshu" | "douyin" | "web" | "unknown";

export type NormalizedIntakeInput = {
  rawInput: string;
  inputKind: IntakeInputKind;
  platform: IntakePlatform;
  originalUrl: string | null;
  detectedUrls: string[];
  surroundingText: string;
};
