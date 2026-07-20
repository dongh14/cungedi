import { normalizeIntakeInput } from "../intake/normalize-input.ts";

export function extractFirstHttpUrl(value: string) {
  return normalizeIntakeInput(value).originalUrl;
}
