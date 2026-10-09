import uuid
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

from . import models, schemas
from .database import engine, get_db, SessionLocal

# Create DB tables
models.Base.metadata.create_all(bind=engine)

from sqlalchemy import text
from datetime import datetime, timedelta

def seed_default_subjects():
    db = SessionLocal()
    try:
        if db.query(models.Subject).count() == 0:
            default_subjects = [
                "базы данных",
                "Исследование операций",
                "Компьютерное зрение",
                "EDA",
                "WEB технологии"
            ]
            for name in default_subjects:
                db.add(models.Subject(name=name))
            db.commit()
    except Exception as e:
        print("Failed to seed subjects:", e)
    finally:
        db.close()

def patch_schema_add_created_at():
    db = SessionLocal()
    try:
        db.execute(text('ALTER TABLE events ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP'))
        db.commit()
    except Exception:
        db.rollback()
    try:
        db.execute(text('ALTER TABLE homeworks ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP'))
        db.commit()
    except Exception:
        db.rollback()
    finally:
        db.close()

def cleanup_old_records():
    db = SessionLocal()
    try:
        threshold = datetime.utcnow() - timedelta(days=18)
        db.query(models.Event).filter(models.Event.created_at < threshold).delete()
        db.query(models.Homework).filter(models.Homework.created_at < threshold).delete()
        db.commit()
    except Exception as e:
        print("Cleanup failed:", e)
        db.rollback()
    finally:
        db.close()

seed_default_subjects()
patch_schema_add_created_at()
cleanup_old_records()

app = FastAPI(title="Queue Management API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/users/", response_model=schemas.UserResponse)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
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

@app.put("/subjects/{subject_id}", response_model=schemas.SubjectResponse)
def update_subject(subject_id: int, subject: schemas.SubjectBase, db: Session = Depends(get_db)):
    db_subject = db.query(models.Subject).filter(models.Subject.id == subject_id).first()
    if not db_subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    db_subject.name = subject.name
    db.commit()
    db.refresh(db_subject)
    return db_subject

@app.delete("/subjects/{subject_id}")
def delete_subject(subject_id: int, db: Session = Depends(get_db)):
    subject = db.query(models.Subject).filter(models.Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    events = db.query(models.Event).filter(models.Event.subject_id == subject_id).all()
    for ev in events:
        db.query(models.QueueSlot).filter(models.QueueSlot.event_id == ev.id).delete()
        db.delete(ev)
        
    db.delete(subject)
    db.commit()
    return {"message": "Subject deleted"}

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

@app.put("/events/{event_id}", response_model=schemas.EventResponse)
def update_event(event_id: int, event: schemas.EventBase, db: Session = Depends(get_db)):
    db_event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not db_event:
        raise HTTPException(status_code=404, detail="Event not found")
    db_event.title = event.title
    db_event.date = event.date
    db_event.subject_id = event.subject_id
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
        raise HTTPException(status_code=404, detail="Event not found")
    db.query(models.QueueSlot).filter(models.QueueSlot.event_id == event_id).delete()
    db.delete(event)
    db.commit()
    return {"message": "Event deleted"}

@app.post("/slots/", response_model=schemas.QueueSlotResponse)
def take_slot(slot_data: schemas.QueueSlotCreate, db: Session = Depends(get_db)):
    # Check if position is already taken
    existing_slot = db.query(models.QueueSlot).filter(
        models.QueueSlot.event_id == slot_data.event_id,
        models.QueueSlot.position == slot_data.position
    ).first()
    
    if existing_slot:
        raise HTTPException(status_code=400, detail="This position is already taken")
        
    # Dynamically create an anonymous user for this slot
    token = str(uuid.uuid4())
    user = models.User(name=slot_data.student_name, secret_token=token)
    db.add(user)
    db.commit()
    db.refresh(user)
        
    db_slot = models.QueueSlot(
        position=slot_data.position,
        event_id=slot_data.event_id,
        user_id=user.id
    )
    db.add(db_slot)
    db.commit()
    db.refresh(db_slot)
    
    # Return the slot with the created user
    return db_slot

@app.delete("/slots/{slot_id}")
def delete_slot(slot_id: int, db: Session = Depends(get_db)):
    slot = db.query(models.QueueSlot).filter(models.QueueSlot.id == slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")
        
    db.delete(slot)
    db.commit()
    return {"message": "Slot deleted"}

@app.get("/homeworks/", response_model=List[schemas.HomeworkResponse])
def get_homeworks(db: Session = Depends(get_db)):
    return db.query(models.Homework).all()

@app.post("/homeworks/", response_model=schemas.HomeworkResponse)
def create_homework(hw: schemas.HomeworkBase, db: Session = Depends(get_db)):
    db_hw = models.Homework(**hw.dict())
    db.add(db_hw)
    db.commit()
    db.refresh(db_hw)
    return db_hw

@app.put("/homeworks/{hw_id}", response_model=schemas.HomeworkResponse)
def update_homework(hw_id: int, hw: schemas.HomeworkBase, db: Session = Depends(get_db)):
    db_hw = db.query(models.Homework).filter(models.Homework.id == hw_id).first()
    if not db_hw:
        raise HTTPException(status_code=404, detail="Homework not found")
    for key, value in hw.dict().items():
        setattr(db_hw, key, value)
    db.commit()
    db.refresh(db_hw)
    return db_hw

@app.delete("/homeworks/{hw_id}")
def delete_homework(hw_id: int, db: Session = Depends(get_db)):
    db_hw = db.query(models.Homework).filter(models.Homework.id == hw_id).first()
    if not db_hw:
        raise HTTPException(status_code=404, detail="Homework not found")
    db.delete(db_hw)
    db.commit()
    return {"message": "Homework deleted"}
