export interface SignupRequest {
  email: string;
  password: string;
  name: string;
  role: 'mentor' | 'mentee';
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
}

export interface ProfileInfo {
  name: string;
  bio?: string;
  imageUrl?: string;
  skills?: string[];
}

export interface UserInfo {
  id: number;
  email: string;
  role: 'mentor' | 'mentee';
  profile: ProfileInfo;
}

export interface ProfileUpdateRequest {
  name: string;
  bio?: string;
  image?: string; // Base64 encoded image
  skills?: string[];
}

export interface MatchRequestCreate {
  mentorId: number;
  menteeId: number;
  message?: string;
}

export interface MatchRequestInfo {
  id: number;
  mentorId: number;
  menteeId: number;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
}
