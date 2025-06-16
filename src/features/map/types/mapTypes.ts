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

export interface ClusteredPlace {
  representativeLat: number;
  representativeLng: number;
  places: ViewNightSpot[];
  count: number;
}

interface BaseMarker {
  marker: naver.maps.Marker;
  lat: number;
  lng: number;
}

export interface SingleMarkerWithData extends BaseMarker {
  type: 'single';
  pdata: ViewNightSpot;
};

export interface GroupMarkerWithData extends BaseMarker {
  type: 'group';
  pdataList: ViewNightSpot[];
};

export type MarkerWithData = SingleMarkerWithData | GroupMarkerWithData;

export interface Subject {
  id: string;
  name: string;
  icon?: React.ReactNode;
}
