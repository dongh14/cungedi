const httpUrlPattern = /https?:\/\/\S+/gi;

const trailingCharacters = new Set([
  ".",
  ",",
  "!",
  "?",
  ":",
  ";",
  ")",
  "]",
  "}",
  ">",
  "\"",
  "'",
  "，",
  "。",
  "！",
  "？",
  "：",
  "；",
  "）",
  "】",
  "」",
  "』",
  "》",
  "、",
  "~",
]);

function trimTrailingUrlCharacters(value: string) {
  let candidate = value.trim();

  while (candidate.length > 0) {
    const lastCharacter = candidate.at(-1);

    if (!lastCharacter || !trailingCharacters.has(lastCharacter)) {
      break;
    }

    candidate = candidate.slice(0, -1);
  }

  return candidate;
}

function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function extractFirstHttpUrl(value: string) {
  const matches = value.match(httpUrlPattern) ?? [];

  for (const match of matches) {
    const candidate = trimTrailingUrlCharacters(match);

    if (candidate && isValidHttpUrl(candidate)) {
      return candidate;
    }
  }

  return null;
}
