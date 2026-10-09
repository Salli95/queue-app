from pydantic import BaseModel
from typing import List, Optional

class UserCreate(BaseModel):
    name: str

class UserResponse(BaseModel):
    id: int
    name: str
    secret_token: str

    class Config:
        orm_mode = True

class UserDisplay(BaseModel):
    id: int
    name: str

    class Config:
        orm_mode = True

class SubjectBase(BaseModel):
    name: str

class SubjectResponse(SubjectBase):
    id: int

    class Config:
        orm_mode = True

class EventBase(BaseModel):
    title: str
    date: str
    subject_id: int

class EventResponse(EventBase):
    id: int

    class Config:
        orm_mode = True

class QueueSlotBase(BaseModel):
    position: int
    event_id: int

class QueueSlotCreate(QueueSlotBase):
    secret_token: str # Токен юзера, чтобы подтвердить, что это он

class QueueSlotResponse(QueueSlotBase):
    id: int
    user: UserDisplay

    class Config:
        orm_mode = True

