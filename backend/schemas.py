from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

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
    title: Optional[str] = None
    date: Optional[str] = None
    subject_id: int

class EventResponse(EventBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        orm_mode = True

class QueueSlotBase(BaseModel):
    position: int
    event_id: int

class QueueSlotCreate(QueueSlotBase):
    student_name: str 

class QueueSlotResponse(QueueSlotBase):
    id: int
    user: UserDisplay

    class Config:
        orm_mode = True

class HomeworkBase(BaseModel):
    title: str
    description: Optional[str] = None
    due_date: Optional[str] = None
    subject_id: int

class HomeworkResponse(HomeworkBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        orm_mode = True
