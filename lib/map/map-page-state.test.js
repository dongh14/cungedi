import assert from "node:assert/strict";
import test from "node:test";
import { getMapPlaceUiState } from "./map-page-state.ts";

test("map place UI reports a loading state before place data is available", () => {
  assert.equal(
    getMapPlaceUiState({
      isLoading: true,
      hasError: false,
      totalPlaces: 0,
      selectedPlaces: 0,
    }),
    "loading",
  );
});

test("map place UI reports an empty state when the user has no saved places", () => {
  assert.equal(
    getMapPlaceUiState({
      isLoading: false,
      hasError: false,
      totalPlaces: 0,
      selectedPlaces: 0,
    }),
    "empty",
  );
});

test("map place UI reports a city-empty state when the selected city has no places", () => {
  assert.equal(
    getMapPlaceUiState({
      isLoading: false,
      hasError: false,
      totalPlaces: 3,
      selectedPlaces: 0,
    }),
    "city_empty",
  );
});

test("map place UI reports an error state when place loading fails", () => {
  assert.equal(
    getMapPlaceUiState({
      isLoading: false,
      hasError: true,
      totalPlaces: 0,
      selectedPlaces: 0,
    }),
    "error",
  );
});
