export interface ViewNightSpotResult {
  RESULT: {
    CODE: string;
    MESSAGE: string;
  };
  row: ViewNightSpot[];
}

export interface ViewNightSpot {
  ID: string,
  SUBJECT_CD: string;
  TITLE: string;
  ADDR: string;
  LA: string;
  LO: string;
  TEL_NO?: string;
  URL?: string;
  OPERATING_TIME: string;
  FREE_YN: string;
  ENTR_FEE?: string;
  CONTENTS: string;
  SUBWAY?: string;
  BUS?: string;
  PARKING_INFO?: string;
  REG_DATE: string;
  MOD_DATE: string;
  IS_FAVORITE?: boolean;
}

export interface ApiResponse {
  viewNightSpot: ViewNightSpotResult;
}

export interface MarkerWithData {
  marker: naver.maps.Marker;
  placeData: ViewNightSpot;
}

export interface Subject {
  id: string;
  name: string;
  icon?: React.ReactNode;
}
