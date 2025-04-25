export interface EmailUser {
  joinType: 'email';
  username: string;
  email: string;
  password: string;
  favoritePlaceIds?: string[];
}

export interface KakaoUser {
  joinType: 'kakao';
  kakaoNickname: string;
  username: string;
  kakaoMemberId: string;
  favoritePlaceIds?: string[];
}

export type User = EmailUser | KakaoUser;

export interface KakaoTokenResponse {
  token_type: string;
  access_token: string;
  id_token: string;
  expires_in: number;
  refresh_token: string;
  refresh_token_expires_in: number;
  scope: string;
}

export interface userInfoResponse {
  id: number;
  connected_at: string;
  properties: {
    nickname: string;
  };
}