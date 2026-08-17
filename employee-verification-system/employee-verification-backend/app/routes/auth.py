from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from passlib.context import CryptContext

from app.schemas.user_schema import UserCreate, UserLogin
from app.database.db import get_db
from app.models.user import User

from jose import JWTError, jwt
from datetime import datetime, timedelta
from fastapi.security import OAuth2PasswordBearer
from fastapi import Depends, HTTPException

from fastapi.security import OAuth2PasswordRequestForm

SECRET_KEY = "mysecretkey"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def create_access_token(data: dict):
    to_encode = data.copy()

    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})

    encoded_jwt = jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM
    )

    return encoded_jwt

router = APIRouter()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

@router.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):

    try:
        print("STEP 1")

        existing_user = db.query(User).filter(User.email == user.email).first()
        print("STEP 2")

        hashed_password = pwd_context.hash(user.password)
        print("STEP 3")

        new_user = User(
            name=user.name,
            email=user.email,
            password=hashed_password,
            role=user.role
        )

        db.add(new_user)
        print("STEP 4")

        db.commit()
        print("STEP 5")

        db.refresh(new_user)

        return {
            "message": "User Registered Successfully",
            "user_id": new_user.id
        }

    except Exception as e:
        print("ERROR:", e)
        return {"error": str(e)}

    existing_user = db.query(User).filter(User.email == user.email).first()

    if existing_user:
        return {"message": "Email already registered"}

    hashed_password = pwd_context.hash(user.password)

    new_user = User(
        name=user.name,
        email=user.email,
        password=hashed_password,
        role=user.role
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "User Registered Successfully",
        "user_id": new_user.id
    }

@router.post("/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):

    existing_user = db.query(User).filter(
        User.email == form_data.username
    ).first()

    if not existing_user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    if not pwd_context.verify(
        form_data.password,
        existing_user.password
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid password"
        )

    access_token = create_access_token(
        data={
            "sub": existing_user.email,
            "role": existing_user.role
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

@router.get("/profile")
def profile(token: str = Depends(oauth2_scheme)):

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        email = payload.get("sub")

        return {
            "message": "Protected route accessed",
            "email": email
        }

    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.get("/me")
def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        email = payload.get("sub")

        user = db.query(User).filter(User.email == email).first()

        if not user:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )

        return {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role
        }

    except JWTError:
        raise HTTPException(
            status_code=401,
            detail="Invalid token"
        )