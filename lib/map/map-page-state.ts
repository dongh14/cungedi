export type MapPlaceUiState = "loading" | "error" | "empty" | "city_empty" | "ready";

export function getMapPlaceUiState(input: {
  isLoading: boolean;
  hasError: boolean;
  totalPlaces: number;
  selectedPlaces: number;
}): MapPlaceUiState {
  if (input.isLoading) {
    return "loading";
  }

  if (input.hasError) {
    return "error";
  }

  if (input.totalPlaces === 0) {
    return "empty";
  }

  if (input.selectedPlaces === 0) {
    return "city_empty";
  }

  return "ready";
}
