export interface ViewNightSpotResult {
  RESULT: {
    CODE: string;
    MESSAGE: string;
  };
  row: ViewNightSpot[];
}

export interface ViewNightSpot {
  TITLE: string;
  ADDR: string;
  LA: string;
  LO: string;
}

export interface ApiResponse {
  viewNightSpot: ViewNightSpotResult;
}

export interface MarkerWithData {
  marker: naver.maps.Marker;
  placeData: ViewNightSpot;
}