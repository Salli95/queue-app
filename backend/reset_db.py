import os
from sqlalchemy.orm import Session
from backend.database import SessionLocal, engine
from backend import models

def reset_and_seed():
    db = SessionLocal()
    
    # Очищаем все таблицы
    db.query(models.QueueSlot).delete()
    db.query(models.Event).delete()
    db.query(models.Subject).delete()
    db.query(models.User).delete()
    db.commit()

    # 6 стандартных предметов
    subjects_data = [
        "Исследовательский анализ данных",
        "Продвинутые базы данных",
        "Исследование операций",
        "Дизайн и анализ алгоритмов",
        "Компьютерное зрение",
        "Продвинутые WEB технологии"
    ]
    
    subjects = []
    for s_name in subjects_data:
        sub = models.Subject(name=s_name)
        db.add(sub)
        subjects.append(sub)
    
    db.commit()
    
    print("База данных успешно очищена и заполнена 6 предметами!")

if __name__ == "__main__":
    reset_and_seed()
