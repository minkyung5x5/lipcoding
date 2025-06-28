from fastapi import FastAPI, Depends, HTTPException, status, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import json
import base64

from database import get_db, create_tables, User, MatchRequest, RoleEnum, StatusEnum
from schemas import *
from utils import *

# FastAPI 앱 생성
app = FastAPI(
    title="Mentor-Mentee Matching API",
    description="API for matching mentors and mentees in a mentoring platform",
    version="1.0.0"
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# JWT 인증 설정
security = HTTPBearer()

# 데이터베이스 초기화
@app.on_event("startup")
def startup_event():
    create_tables()

# 인증된 사용자 정보 가져오기
def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    token = credentials.credentials
    payload = verify_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )
    
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    return user

# 루트 경로 - Swagger UI로 리다이렉트
@app.get("/")
def read_root():
    return {"message": "Mentor-Mentee Matching API", "docs": "/docs"}

# Spring Boot 스타일의 OpenAPI 문서 엔드포인트
@app.get("/v3/api-docs")
def get_openapi_docs():
    """Spring Boot 스타일의 OpenAPI 문서 엔드포인트"""
    from fastapi.openapi.utils import get_openapi
    return get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )

# 1. 인증 API
@app.post("/api/signup", status_code=201)
def signup(request: SignupRequest, db: Session = Depends(get_db)):
    # 이메일 중복 체크
    existing_user = db.query(User).filter(User.email == request.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # 사용자 생성
    user = User(
        email=request.email,
        password_hash=get_password_hash(request.password),
        name=request.name,
        role=RoleEnum(request.role)
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return {"message": "User created successfully"}

@app.post("/api/login", response_model=LoginResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    
    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # JWT 토큰 생성
    token_data = {
        "user_id": user.id,
        "email": user.email,
        "name": user.name,
        "role": user.role.value
    }
    token = create_access_token(token_data)
    
    return LoginResponse(token=token)

# 2. 사용자 정보 API
@app.get("/api/me", response_model=UserInfo)
def get_me(current_user: User = Depends(get_current_user)):
    # 스킬 파싱
    skills = None
    if current_user.skills:
        try:
            skills = json.loads(current_user.skills)
        except:
            skills = []
    
    # 이미지 URL 생성
    image_url = f"/api/images/{current_user.role.value}/{current_user.id}" if current_user.profile_image else get_default_image_url(current_user.role.value)
    
    profile = ProfileInfo(
        name=current_user.name or "",
        bio=current_user.bio,
        imageUrl=image_url,
        skills=skills if current_user.role == RoleEnum.mentor else None
    )
    
    return UserInfo(
        id=current_user.id,
        email=current_user.email,
        role=current_user.role.value,
        profile=profile
    )

@app.get("/api/images/{role}/{user_id}")
def get_profile_image(role: str, user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.profile_image:
        return Response(content=user.profile_image, media_type="image/jpeg")
    else:
        # 기본 이미지로 리다이렉트
        from fastapi.responses import RedirectResponse
        return RedirectResponse(url=get_default_image_url(role))

@app.put("/api/profile", response_model=UserInfo)
def update_profile(request: ProfileUpdateRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # 프로필 정보 업데이트
    current_user.name = request.name
    current_user.bio = request.bio
    
    # 이미지 처리
    if request.image:
        try:
            image_data = process_profile_image(request.image)
            current_user.profile_image = image_data
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
    
    # 멘토인 경우 스킬 저장
    if current_user.role == RoleEnum.mentor and request.skills:
        current_user.skills = json.dumps(request.skills)
    
    db.commit()
    db.refresh(current_user)
    
    # 응답 생성
    skills = None
    if current_user.skills:
        try:
            skills = json.loads(current_user.skills)
        except:
            skills = []
    
    image_url = f"/api/images/{current_user.role.value}/{current_user.id}" if current_user.profile_image else get_default_image_url(current_user.role.value)
    
    profile = ProfileInfo(
        name=current_user.name,
        bio=current_user.bio,
        imageUrl=image_url,
        skills=skills if current_user.role == RoleEnum.mentor else None
    )
    
    return UserInfo(
        id=current_user.id,
        email=current_user.email,
        role=current_user.role.value,
        profile=profile
    )

# 3. 멘토 목록 조회 API
@app.get("/api/mentors", response_model=List[UserInfo])
def get_mentors(skill: str = None, order_by: str = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # 멘티만 접근 가능
    if current_user.role != RoleEnum.mentee:
        raise HTTPException(status_code=403, detail="Only mentees can access this endpoint")
    
    query = db.query(User).filter(User.role == RoleEnum.mentor)
    
    # 스킬 필터링
    if skill:
        query = query.filter(User.skills.like(f'%"{skill}"%'))
    
    # 정렬
    if order_by == "name":
        query = query.order_by(User.name)
    elif order_by == "skill":
        query = query.order_by(User.skills)
    else:
        query = query.order_by(User.id)
    
    mentors = query.all()
    
    result = []
    for mentor in mentors:
        skills = None
        if mentor.skills:
            try:
                skills = json.loads(mentor.skills)
            except:
                skills = []
        
        image_url = f"/api/images/{mentor.role.value}/{mentor.id}" if mentor.profile_image else get_default_image_url(mentor.role.value)
        
        profile = ProfileInfo(
            name=mentor.name or "",
            bio=mentor.bio,
            imageUrl=image_url,
            skills=skills
        )
        
        result.append(UserInfo(
            id=mentor.id,
            email=mentor.email,
            role=mentor.role.value,
            profile=profile
        ))
    
    return result

# 4. 매칭 요청 API
@app.post("/api/match-requests", response_model=MatchRequestInfo)
def create_match_request(request: MatchRequestCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # 멘티만 요청 가능
    if current_user.role != RoleEnum.mentee:
        raise HTTPException(status_code=403, detail="Only mentees can send match requests")
    
    # 멘토 존재 확인
    mentor = db.query(User).filter(User.id == request.mentorId, User.role == RoleEnum.mentor).first()
    if not mentor:
        raise HTTPException(status_code=400, detail="Mentor not found")
    
    # 기존 pending 요청 확인
    existing_request = db.query(MatchRequest).filter(
        MatchRequest.mentee_id == current_user.id,
        MatchRequest.status == StatusEnum.pending
    ).first()
    
    if existing_request:
        raise HTTPException(status_code=400, detail="You already have a pending request")
    
    # 매칭 요청 생성
    match_request = MatchRequest(
        mentor_id=request.mentorId,
        mentee_id=current_user.id,
        message=request.message,
        status=StatusEnum.pending
    )
    
    db.add(match_request)
    db.commit()
    db.refresh(match_request)
    
    return MatchRequestInfo(
        id=match_request.id,
        mentorId=match_request.mentor_id,
        menteeId=match_request.mentee_id,
        message=match_request.message,
        status=match_request.status.value
    )

@app.get("/api/match-requests/incoming", response_model=List[MatchRequestInfo])
def get_incoming_requests(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # 멘토만 접근 가능
    if current_user.role != RoleEnum.mentor:
        raise HTTPException(status_code=403, detail="Only mentors can access this endpoint")
    
    requests = db.query(MatchRequest).filter(MatchRequest.mentor_id == current_user.id).all()
    
    return [
        MatchRequestInfo(
            id=req.id,
            mentorId=req.mentor_id,
            menteeId=req.mentee_id,
            message=req.message,
            status=req.status.value
        )
        for req in requests
    ]

@app.get("/api/match-requests/outgoing", response_model=List[MatchRequestInfo])
def get_outgoing_requests(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # 멘티만 접근 가능
    if current_user.role != RoleEnum.mentee:
        raise HTTPException(status_code=403, detail="Only mentees can access this endpoint")
    
    requests = db.query(MatchRequest).filter(MatchRequest.mentee_id == current_user.id).all()
    
    return [
        MatchRequestInfo(
            id=req.id,
            mentorId=req.mentor_id,
            menteeId=req.mentee_id,
            message=req.message,
            status=req.status.value
        )
        for req in requests
    ]

@app.put("/api/match-requests/{request_id}/accept", response_model=MatchRequestInfo)
def accept_request(request_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # 멘토만 접근 가능
    if current_user.role != RoleEnum.mentor:
        raise HTTPException(status_code=403, detail="Only mentors can accept requests")
    
    # 요청 확인
    match_request = db.query(MatchRequest).filter(
        MatchRequest.id == request_id,
        MatchRequest.mentor_id == current_user.id
    ).first()
    
    if not match_request:
        raise HTTPException(status_code=404, detail="Match request not found")
    
    # 이미 수락된 요청이 있는지 확인
    accepted_request = db.query(MatchRequest).filter(
        MatchRequest.mentor_id == current_user.id,
        MatchRequest.status == StatusEnum.accepted
    ).first()
    
    if accepted_request:
        raise HTTPException(status_code=400, detail="You already have an accepted mentee")
    
    # 요청 수락
    match_request.status = StatusEnum.accepted
    db.commit()
    
    return MatchRequestInfo(
        id=match_request.id,
        mentorId=match_request.mentor_id,
        menteeId=match_request.mentee_id,
        message=match_request.message,
        status=match_request.status.value
    )

@app.put("/api/match-requests/{request_id}/reject", response_model=MatchRequestInfo)
def reject_request(request_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # 멘토만 접근 가능
    if current_user.role != RoleEnum.mentor:
        raise HTTPException(status_code=403, detail="Only mentors can reject requests")
    
    # 요청 확인
    match_request = db.query(MatchRequest).filter(
        MatchRequest.id == request_id,
        MatchRequest.mentor_id == current_user.id
    ).first()
    
    if not match_request:
        raise HTTPException(status_code=404, detail="Match request not found")
    
    # 요청 거절
    match_request.status = StatusEnum.rejected
    db.commit()
    
    return MatchRequestInfo(
        id=match_request.id,
        mentorId=match_request.mentor_id,
        menteeId=match_request.mentee_id,
        message=match_request.message,
        status=match_request.status.value
    )

@app.delete("/api/match-requests/{request_id}", response_model=MatchRequestInfo)
def cancel_request(request_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # 멘티만 접근 가능
    if current_user.role != RoleEnum.mentee:
        raise HTTPException(status_code=403, detail="Only mentees can cancel requests")
    
    # 요청 확인
    match_request = db.query(MatchRequest).filter(
        MatchRequest.id == request_id,
        MatchRequest.mentee_id == current_user.id
    ).first()
    
    if not match_request:
        raise HTTPException(status_code=404, detail="Match request not found")
    
    # 요청 취소
    match_request.status = StatusEnum.cancelled
    db.commit()
    
    return MatchRequestInfo(
        id=match_request.id,
        mentorId=match_request.mentor_id,
        menteeId=match_request.mentee_id,
        message=match_request.message,
        status=match_request.status.value
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
