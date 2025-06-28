from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
import base64
from io import BytesIO
from PIL import Image

# JWT 설정
SECRET_KEY = "your-secret-key-here"  # 실제 환경에서는 환경변수로 관리
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 1

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    
    # RFC 7519 클레임 추가
    to_encode.update({
        "iss": "mentor-mentee-app",  # issuer
        "sub": str(data.get("user_id")),  # subject
        "aud": "mentor-mentee-users",  # audience
        "exp": expire,  # expiration time
        "nbf": datetime.utcnow(),  # not before
        "iat": datetime.utcnow(),  # issued at
        "jti": f"jwt-{data.get('user_id')}-{int(datetime.utcnow().timestamp())}"  # JWT ID
    })
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None

def process_profile_image(base64_image: str) -> bytes:
    """Base64 이미지를 처리하고 유효성 검사"""
    try:
        # Base64 디코드
        image_data = base64.b64decode(base64_image)
        
        # PIL로 이미지 열기
        image = Image.open(BytesIO(image_data))
        
        # 형식 검사 (.jpg or .png)
        if image.format not in ['JPEG', 'PNG']:
            raise ValueError("Only JPG and PNG formats are allowed")
        
        # 크기 검사 (500x500 ~ 1000x1000)
        width, height = image.size
        if width != height:
            raise ValueError("Image must be square")
        if width < 500 or width > 1000:
            raise ValueError("Image size must be between 500x500 and 1000x1000 pixels")
        
        # 파일 크기 검사 (1MB 이하)
        if len(image_data) > 1024 * 1024:
            raise ValueError("Image size must be less than 1MB")
        
        return image_data
    except Exception as e:
        raise ValueError(f"Invalid image: {str(e)}")

def get_default_image_url(role: str) -> str:
    """기본 프로필 이미지 URL 반환"""
    if role == "mentor":
        return "https://placehold.co/500x500.jpg?text=MENTOR"
    else:
        return "https://placehold.co/500x500.jpg?text=MENTEE"
