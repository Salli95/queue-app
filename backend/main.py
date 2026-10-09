import uuid
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

from . import models, schemas
from .database import engine, get_db

# Создаем таблицы при старте
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Очередь для студентов")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/users/", response_model=schemas.UserResponse)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # Простой способ генерации уникального токена (как пароль)
    token = str(uuid.uuid4())
    db_user = models.User(name=user.name, secret_token=token)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.get("/subjects/", response_model=List[schemas.SubjectResponse])
def get_subjects(db: Session = Depends(get_db)):
    return db.query(models.Subject).all()

@app.post("/subjects/", response_model=schemas.SubjectResponse)
def create_subject(subject: schemas.SubjectBase, db: Session = Depends(get_db)):
    db_subject = models.Subject(name=subject.name)
    db.add(db_subject)
    db.commit()
    db.refresh(db_subject)
    return db_subject

@app.delete("/subjects/{subject_id}")
def delete_subject(subject_id: int, db: Session = Depends(get_db)):
    subject = db.query(models.Subject).filter(models.Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Предмет не найден")
    
    events = db.query(models.Event).filter(models.Event.subject_id == subject_id).all()
    for ev in events:
        db.query(models.QueueSlot).filter(models.QueueSlot.event_id == ev.id).delete()
        db.delete(ev)
        
    db.delete(subject)
    db.commit()
    return {"message": "Предмет успешно удален"}

@app.get("/events/", response_model=List[schemas.EventResponse])
def get_events(subject_id: int = None, db: Session = Depends(get_db)):
    query = db.query(models.Event)
    if subject_id:
        query = query.filter(models.Event.subject_id == subject_id)
    return query.all()

@app.post("/events/", response_model=schemas.EventResponse)
def create_event(event: schemas.EventBase, db: Session = Depends(get_db)):
    db_event = models.Event(**event.dict())
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event

@app.get("/events/{event_id}/slots", response_model=List[schemas.QueueSlotResponse])
def get_queue_slots(event_id: int, db: Session = Depends(get_db)):
    return db.query(models.QueueSlot).filter(models.QueueSlot.event_id == event_id).all()

@app.delete("/events/{event_id}")
def delete_event(event_id: int, db: Session = Depends(get_db)):
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Очередь не найдена")
    db.query(models.QueueSlot).filter(models.QueueSlot.event_id == event_id).delete()
    db.delete(event)
    db.commit()
    return {"message": "Успешно удалено"}

@app.post("/slots/", response_model=schemas.QueueSlotResponse)
def take_slot(slot_data: schemas.QueueSlotCreate, db: Session = Depends(get_db)):
    # Ищем пользователя по токену
    user = db.query(models.User).filter(models.User.secret_token == slot_data.secret_token).first()
    if not user:
        raise HTTPException(status_code=403, detail="Неверный токен пользователя")
    
    # Проверяем, не занято ли уже это место
    existing_slot = db.query(models.QueueSlot).filter(
        models.QueueSlot.event_id == slot_data.event_id,
        models.QueueSlot.position == slot_data.position
    ).first()
    
    if existing_slot:
        raise HTTPException(status_code=400, detail="Это место уже занято")

    # Проверяем, не записан ли этот пользователь уже на это событие
    user_existing_slot = db.query(models.QueueSlot).filter(
        models.QueueSlot.event_id == slot_data.event_id,
        models.QueueSlot.user_id == user.id
    ).first()

    if user_existing_slot:
         raise HTTPException(status_code=400, detail="Вы уже заняли место в этой очереди")
        
    db_slot = models.QueueSlot(
        position=slot_data.position,
        event_id=slot_data.event_id,
        user_id=user.id
    )
    db.add(db_slot)
    db.commit()
    db.refresh(db_slot)
    return db_slot

@app.delete("/slots/{slot_id}")
def delete_slot(slot_id: int, db: Session = Depends(get_db)):
    slot = db.query(models.QueueSlot).filter(models.QueueSlot.id == slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Место не найдено")
        
    db.delete(slot)
    db.commit()
    return {"message": "Успешно удалено"}

