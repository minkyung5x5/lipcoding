from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# 회원가입 요청
class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str  # "mentor" or "mentee"

# 로그인 요청
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

# 로그인 응답
class LoginResponse(BaseModel):
    token: str

# 프로필 정보
class ProfileInfo(BaseModel):
    name: str
    bio: Optional[str] = None
    imageUrl: Optional[str] = None
    skills: Optional[List[str]] = None

# 사용자 정보
class UserInfo(BaseModel):
    id: int
    email: str
    role: str
    profile: ProfileInfo

# 프로필 수정 요청
class ProfileUpdateRequest(BaseModel):
    name: str
    bio: Optional[str] = None
    image: Optional[str] = None  # Base64 encoded image
    skills: Optional[List[str]] = None

# 매칭 요청
class MatchRequestCreate(BaseModel):
    mentorId: int
    menteeId: int
    message: Optional[str] = None

# 매칭 요청 정보
class MatchRequestInfo(BaseModel):
    id: int
    mentorId: int
    menteeId: int
    message: Optional[str] = None
    status: str
    
# 에러 응답
class ErrorResponse(BaseModel):
    detail: str
