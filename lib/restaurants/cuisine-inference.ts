type CuisineRule = {
  cuisine: string;
  keywords: string[];
};

const cuisineRules: CuisineRule[] = [
  { cuisine: "川菜", keywords: ["川菜", "四川菜", "sichuan", "chengdu spicy"] },
  { cuisine: "粤菜", keywords: ["粤菜", "广东菜", "cantonese", "dim sum"] },
  { cuisine: "湘菜", keywords: ["湘菜", "hunan"] },
  { cuisine: "江浙菜", keywords: ["江浙菜", "杭帮菜", "shanghainese", "jiangzhe"] },
  { cuisine: "云南菜", keywords: ["云南菜", "yunnan"] },
  { cuisine: "火锅", keywords: ["火锅", "hot pot"] },
  { cuisine: "烧烤", keywords: ["烧烤", "bbq", "barbecue", "grill"] },
  { cuisine: "面馆", keywords: ["面", "noodle", "ramen"] },
  { cuisine: "饺子", keywords: ["饺子", "dumpling"] },
  { cuisine: "早餐", keywords: ["早餐", "breakfast"] },
  { cuisine: "咖啡馆", keywords: ["咖啡", "coffee", "cafe", "café", "espresso", "brunch"] },
  { cuisine: "甜品", keywords: ["甜品", "dessert", "pastry", "bakery"] },
  { cuisine: "日料", keywords: ["日料", "寿司", "sushi", "izakaya", "omakase"] },
  { cuisine: "韩餐", keywords: ["韩餐", "韩国料理", "korean", "kimchi", "bbq"] },
  { cuisine: "东南亚菜", keywords: ["东南亚", "thai", "vietnamese", "pho", "laksa"] },
  { cuisine: "西餐", keywords: ["西餐", "western", "bistro", "steakhouse"] },
  { cuisine: "海鲜", keywords: ["海鲜", "seafood", "oyster"] },
  { cuisine: "牛排", keywords: ["牛排", "steak"] },
  { cuisine: "酒吧小食", keywords: ["酒吧", "bar bites", "small plates", "tapas"] },
];

function countKeywordOccurrences(text: string, keyword: string) {
  const normalizedKeyword = keyword.toLowerCase();
  const normalizedText = text.toLowerCase();
  let index = 0;
  let count = 0;

  while (index >= 0) {
    index = normalizedText.indexOf(normalizedKeyword, index);

    if (index === -1) {
      break;
    }

    count += 1;
    index += normalizedKeyword.length;
  }

  return count;
}

export function inferCuisineFromSourceContent(input: {
  title?: string | null;
  description?: string | null;
  visibleText?: string | null;
}) {
  const title = input.title ?? "";
  const description = input.description ?? "";
  const visibleText = input.visibleText ?? "";
  const weightedText = [
    { value: title, weight: 4 },
    { value: description, weight: 3 },
    { value: visibleText, weight: 1 },
  ];

  const scores = cuisineRules
    .map((rule) => {
      let score = 0;
      const evidence = new Set<string>();

      for (const keyword of rule.keywords) {
        for (const source of weightedText) {
          if (!source.value) {
            continue;
          }

          const occurrences = countKeywordOccurrences(source.value, keyword);

          if (occurrences > 0) {
            score += occurrences * source.weight;
            evidence.add(keyword);
          }
        }
      }

      return {
        cuisine: rule.cuisine,
        score,
        evidence: [...evidence],
      };
    })
    .filter((rule) => rule.score > 0)
    .sort((left, right) => right.score - left.score);

  if (scores.length === 0) {
    return {
      cuisine: null,
      evidence: [] as string[],
      isConfident: false,
    };
  }

  const topScore = scores[0];
  const secondScore = scores[1];
  const isConfident =
    topScore.score >= 4 &&
    (!secondScore || topScore.score >= secondScore.score + 2);

  return {
    cuisine: isConfident ? topScore.cuisine : null,
    evidence: topScore.evidence,
    isConfident,
  };
}
