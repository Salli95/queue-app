from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    # Секретный ключ студента для редактирования своей записи
    secret_token = Column(String, unique=True, index=True) 

class Subject(Base):
    __tablename__ = "subjects"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    
    events = relationship("Event", back_populates="subject")

class Event(Base):
    __tablename__ = "events"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True) # Например: "Лаба 1", "Экзамен"
    date = Column(String) # Дата проведения
    subject_id = Column(Integer, ForeignKey("subjects.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    subject = relationship("Subject", back_populates="events")
    slots = relationship("QueueSlot", back_populates="event")

class QueueSlot(Base):
    __tablename__ = "queue_slots"
    
    id = Column(Integer, primary_key=True, index=True)
    position = Column(Integer) # Номер в очереди (1, 2, 3...)
    event_id = Column(Integer, ForeignKey("events.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    
    event = relationship("Event", back_populates="slots")
    user = relationship("User")

class Homework(Base):
    __tablename__ = "homeworks"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(String)
    due_date = Column(String) # Срок сдачи (опционально)
    subject_id = Column(Integer, ForeignKey("subjects.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    subject = relationship("Subject")
