export interface ViewNightSpotResult {
  RESULT: {
    CODE: string;
    MESSAGE: string;
  };
  row: ApiViewNightSpot[];
}

export interface ApiViewNightSpot {
  NUM: string;
  SUBJECT_CD: string;
  TITLE: string;
  ADDR: string;
  LA: string;
  LO: string;
  TEL_NO?: string;
  URL?: string;
  OPERATING_TIME?: string;
  FREE_YN?: string;
  ENTR_FEE?: string;
  CONTENTS?: string;
  SUBWAY?: string;
  BUS?: string;
  PARKING_INFO?: string;
  REG_DATE: string;
  MOD_DATE: string;
}

export interface ViewNightSpot extends ApiViewNightSpot {
  ID: string;
  IS_FAVORITE: boolean;
}

export interface ApiResponse {
  viewNightSpot: ViewNightSpotResult;
}

export interface clusteredPlace {
  representativeLat: string;
  representativeLng: string;
  places: ViewNightSpot[];
  count: number;
}

export interface MarkerWithData {
  marker: naver.maps.Marker;
  placeData: ViewNightSpot;
  placesGroup: clusteredPlace;
}

export interface Subject {
  id: string;
  name: string;
  icon?: React.ReactNode;
}
