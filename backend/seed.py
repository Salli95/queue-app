import os
from sqlalchemy.orm import Session
from backend.database import SessionLocal, engine
from backend import models

def seed():
    models.Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    # Проверяем, есть ли уже данные
    if db.query(models.Subject).count() > 0:
        print("База уже заполнена")
        return
        
    sub1 = models.Subject(name="ОАиП (Основы алгоритмизации)")
    sub2 = models.Subject(name="Высшая Математика")
    
    db.add(sub1)
    db.add(sub2)
    db.commit()
    db.refresh(sub1)
    db.refresh(sub2)
    
    ev1 = models.Event(title="Сдача лабораторной №1", date="12.10.2026", subject_id=sub1.id)
    ev2 = models.Event(title="Сдача лабораторной №2", date="19.10.2026", subject_id=sub1.id)
    ev3 = models.Event(title="Экзамен", date="25.12.2026", subject_id=sub2.id)
    
    db.add_all([ev1, ev2, ev3])
    db.commit()
    print("База успешно заполнена начальными данными!")

if __name__ == "__main__":
    seed()

