export function normalizeSelectedCollectionIds(values: string[]) {
  return [...new Set(
    values
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value) && value > 0),
  )].sort((first, second) => first - second);
}

export function diffRestaurantCollectionMemberships(input: {
  currentCollectionIds: number[];
  nextCollectionIds: number[];
}) {
  const currentSet = new Set(input.currentCollectionIds);
  const nextSet = new Set(input.nextCollectionIds);

  return {
    toAdd: input.nextCollectionIds.filter((collectionId) => !currentSet.has(collectionId)),
    toRemove: input.currentCollectionIds.filter((collectionId) => !nextSet.has(collectionId)),
  };
}
