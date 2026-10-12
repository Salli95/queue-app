import os
import sys

# Добавляем корневую директорию проекта в sys.path, чтобы корректно импортировался модуль backend
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from backend.main import app

