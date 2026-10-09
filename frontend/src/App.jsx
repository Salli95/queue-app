import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import api from './api';
import { UserCircle, BookOpen, Calendar, ArrowLeft, LogOut, Check, Trash2 } from 'lucide-react';

// Компонент авторизации
function Login({ onLogin }) {
  const [name, setName] = useState(localStorage.getItem('last_name') || '');
  
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      const res = await api.post('/users/', { name });
      const userData = res.data;
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('last_name', name); // Запоминаем имя для инпута
      onLogin(userData);
    } catch (err) {
      console.error(err);
      alert('Ошибка при входе');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-md w-full">
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-brand/10 rounded-full text-brand">
            <UserCircle size={40} />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">Вход в Очередь</h1>
        <p className="text-gray-500 text-center mb-8">Введите ваше имя, чтобы занимать места</p>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ваше Имя / Фамилия</label>
            <input 
              type="text" 
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-all"
              placeholder="Иван Иванов"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>
          <button 
            type="submit" 
            className="w-full bg-brand hover:bg-brand-hover text-white py-2.5 rounded-lg font-medium transition-colors"
          >
            Войти
          </button>
        </form>
      </div>
    </div>
  );
}

// Главная панель с предметами и событиями

const formatDateWithDay = (dateString) => {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  const dayName = d.toLocaleDateString('ru-RU', { weekday: 'short' });
  const capitalized = dayName.charAt(0).toUpperCase() + dayName.slice(1);
  return `${dateString} (${capitalized})`;
};

function Dashboard({ user, onLogout }) {
  const [subjects, setSubjects] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showCreateSubjectForm, setShowCreateSubjectForm] = useState(false);
  const [newEvent, setNewEvent] = useState({ subject_id: '', title: '', date: '' });
  const [newSubjectName, setNewSubjectName] = useState('');
  const navigate = useNavigate();

  const fetchEvents = () => {
    api.get('/events/').then(res => setEvents(res.data)).catch(console.error);
  };

  const fetchSubjects = () => {
    api.get('/subjects/').then(res => setSubjects(res.data)).catch(console.error);
  };

  useEffect(() => {
    fetchSubjects();
    fetchEvents();
  }, []);

  const handleSubjectClick = (subId) => {
    setSelectedSubject(selectedSubject === subId ? null : subId);
  };

  const handleCreateSubject = async (e) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;
    try {
      await api.post('/subjects/', { name: newSubjectName });
      setNewSubjectName('');
      setShowCreateSubjectForm(false);
      fetchSubjects();
    } catch (err) {
      console.error(err);
      alert("Ошибка при создании предмета");
    }
  };

  const handleDeleteSubject = async (e, subjectId) => {
    e.stopPropagation();
    if (!window.confirm("Удалить предмет и все связанные с ним очереди навсегда?")) return;
    try {
      await api.delete(`/subjects/${subjectId}`);
      if (selectedSubject === subjectId) setSelectedSubject(null);
      fetchSubjects();
      fetchEvents();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || "Ошибка при удалении предмета");
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!newEvent.subject_id || !newEvent.title || !newEvent.date) return alert("Заполните все поля");
    try {
      await api.post('/events/', {
        title: newEvent.title,
        date: newEvent.date,
        subject_id: parseInt(newEvent.subject_id)
      });
      setShowCreateForm(false);
      setNewEvent({ subject_id: '', title: '', date: '' });
      fetchEvents();
    } catch (err) {
      console.error(err);
      alert("Ошибка при создании очереди");
    }
  };

  const handleDeleteEvent = async (e, eventId) => {
    e.stopPropagation(); // Чтобы не кликалась карточка и мы не перешли внутрь
    if (!window.confirm("Удалить эту очередь навсегда?")) return;
    try {
      await api.delete(`/events/${eventId}`);
      fetchEvents();
    } catch (err) {
      console.error(err);
      alert("Ошибка при удалении очереди");
    }
  };

  const filteredEvents = selectedSubject 
    ? events.filter(e => e.subject_id === selectedSubject) 
    : events;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 pb-20">
      <header className="flex justify-between items-center mb-8 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Привет, {user ? user.name : "Гость"}</h2>
          <p className="text-sm text-gray-500">Выбери предмет и записывайся!</p>
        </div>
        {user && (
          <button 
            onClick={onLogout} 
            className="flex items-center gap-2 px-4 py-2 text-red-500 bg-red-50 hover:bg-red-100 rounded-xl transition-colors font-medium text-sm"
          >
            <LogOut size={18} />
            Выйти
          </button>
        )}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Боковая панель с предметами */}
        <div className="md:col-span-1 space-y-2">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-gray-700 uppercase text-xs tracking-wider">Предметы</h3>
            <button 
              onClick={() => setShowCreateSubjectForm(!showCreateSubjectForm)}
              className="text-xs font-medium text-brand hover:text-brand-hover bg-brand/10 px-2 py-1 rounded transition-colors"
            >
              {showCreateSubjectForm ? "Отмена" : "+ Новый"}
            </button>
          </div>

          {showCreateSubjectForm && (
            <form onSubmit={handleCreateSubject} className="mb-4 space-y-2 bg-gray-50 p-3 rounded-xl border border-gray-100">
              <input 
                type="text" 
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-brand"
                placeholder="Название предмета"
                value={newSubjectName}
                onChange={e => setNewSubjectName(e.target.value)}
              />
              <button type="submit" className="w-full bg-brand text-white py-1.5 text-sm rounded-lg font-medium hover:bg-brand-hover">
                Добавить
              </button>
            </form>
          )}

          <button 
            onClick={() => setSelectedSubject(null)}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              selectedSubject === null ? 'bg-gray-800 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            } mb-2`}
          >
            Все предметы
          </button>
          {subjects.map(sub => (
            <div key={sub.id} className="relative group">
              <button 
                onClick={() => handleSubjectClick(sub.id)}
                className={`w-full text-left pr-10 pl-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  selectedSubject === sub.id ? 'bg-brand text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                {sub.name}
              </button>
              <button 
                onClick={(e) => handleDeleteSubject(e, sub.id)}
                className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors ${
                  selectedSubject === sub.id ? 'text-white/70 hover:text-white hover:bg-white/20' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                } opacity-0 md:opacity-0 group-hover:opacity-100`}
                title="Удалить предмет"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        {/* Список событий */}
        <div className="md:col-span-3">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-700 uppercase text-xs tracking-wider">Доступные очереди</h3>
            <button 
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="text-sm font-medium text-brand hover:text-brand-hover bg-brand/10 px-3 py-1.5 rounded-lg transition-colors"
            >
              {showCreateForm ? "Отмена" : "+ Создать очередь"}
            </button>
          </div>

          {showCreateForm && (
            <form onSubmit={handleCreateEvent} className="bg-white p-5 rounded-2xl border border-brand/20 shadow-sm mb-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Предмет</label>
                <select 
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-brand"
                  value={newEvent.subject_id}
                  onChange={e => setNewEvent({...newEvent, subject_id: e.target.value})}
                >
                  <option value="">-- Выберите предмет --</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Комментарий (например: Лаба №2)</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-brand"
                  placeholder="Защита курсовой"
                  value={newEvent.title}
                  onChange={e => setNewEvent({...newEvent, title: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Дата</label>
                <input 
                  type="date" 
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-brand"
                  value={newEvent.date}
                  onChange={e => setNewEvent({...newEvent, date: e.target.value})}
                />
              </div>
              <button type="submit" className="w-full bg-brand text-white py-2 rounded-lg font-medium hover:bg-brand-hover">
                Создать
              </button>
            </form>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredEvents.map(ev => {
              const sub = subjects.find(s => s.id === ev.subject_id);
              return (
                <div 
                  key={ev.id} 
                  onClick={() => navigate(`/queue/${ev.id}`)}
                  className="relative bg-white border border-gray-200 rounded-2xl p-5 cursor-pointer hover:border-brand hover:shadow-md transition-all group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-brand/10 transition-colors">
                      <BookOpen size={20} className="text-gray-500 group-hover:text-brand" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-md">
                        {formatDateWithDay(ev.date)}
                      </span>
                      <button 
                        onClick={(e) => handleDeleteEvent(e, ev.id)}
                        className="text-gray-300 hover:text-red-500 bg-gray-50 hover:bg-red-50 p-1 rounded-md transition-colors"
                        title="Удалить очередь"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <h4 className="text-lg font-bold text-gray-800 mt-3 leading-tight">{sub?.name}</h4>
                  <p className="text-sm text-gray-500 mt-1">({ev.title})</p>
                </div>
              );
            })}
            
            {filteredEvents.length === 0 && !showCreateForm && (
              <div className="col-span-full py-10 text-center text-gray-400 bg-white border border-dashed border-gray-200 rounded-2xl">
                Очередей пока нет
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Очередь события
function EventQueue({ user, onLogin }) {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [slots, setSlots] = useState([]);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const totalSlots = 30; // Максимум мест в очереди

  useEffect(() => {
    fetchData();
    // Простое обновление раз в 5 секунд (для теста)
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [eventId]);

  const fetchData = async () => {
    try {
      const [eventRes, slotsRes] = await Promise.all([
        api.get('/events/'), // Для простоты загрузим все и найдем
        api.get(`/events/${eventId}/slots`)
      ]);
      const ev = eventRes.data.find(e => e.id === parseInt(eventId));
      setEvent(ev);
      setSlots(slotsRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const takeSlot = async (position) => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    
    // Оптимистичное обновление UI (сразу показываем, что место занято)
    const tempSlot = {
      id: `temp-${Date.now()}`,
      position,
      user: { id: user.id, name: user.name }
    };
    setSlots(prev => [...prev, tempSlot]);

    try {
      await api.post('/slots/', {
        position,
        event_id: parseInt(eventId),
        secret_token: user.secret_token
      });
      fetchData(); // тихо обновляем реальные данные в фоне
    } catch (err) {
      // Откат изменений при ошибке
      setSlots(prev => prev.filter(s => s.id !== tempSlot.id));
      if (err.response?.status === 403) {
        localStorage.removeItem('user');
        window.location.reload();
      } else {
        alert(err.response?.data?.detail || 'Ошибка при занятии места');
      }
    }
  };

  const deleteSlot = async (slotId) => {
    if (!window.confirm('Освободить место?')) return;
    
    // Оптимистичное обновление UI (сразу убираем место)
    const slotToRemove = slots.find(s => s.id === slotId);
    setSlots(prev => prev.filter(s => s.id !== slotId));

    try {
      // Если это временный ID (еще не сохранился на сервере, но пользователь уже удаляет) - игнорируем удаление на сервере
      if (String(slotId).startsWith('temp-')) {
          fetchData();
          return;
      }
      await api.delete(`/slots/${slotId}`);
      fetchData();
    } catch (err) {
      // Откат при ошибке
      if (slotToRemove) setSlots(prev => [...prev, slotToRemove]);
      alert(err.response?.data?.detail || 'Ошибка');
    }
  };

  if (!event) return <div className="p-10 text-center">Загрузка...</div>;

  const renderSlots = () => {
    let elements = [];
    for (let i = 1; i <= totalSlots; i++) {
      const slot = slots.find(s => s.position === i);
      const isMine = slot && user && slot.user.id === user.id;

      elements.push(
        <div 
          key={i} 
          className={`relative flex items-center justify-between p-3 sm:p-4 mb-2 rounded-xl border transition-all ${
            slot 
              ? isMine 
                ? 'bg-green-50 border-green-200' 
                : 'bg-white border-gray-200'
              : 'bg-gray-50 border-dashed border-gray-200 hover:border-brand cursor-pointer group'
          }`}
          onClick={() => !slot && takeSlot(i)}
        >
          <div className="flex items-center gap-4">
            <span className={`text-lg font-bold w-6 sm:w-8 text-center ${slot ? (isMine ? 'text-green-600' : 'text-gray-800') : 'text-gray-400'}`}>
              {i}
            </span>
            <div>
              {slot ? (
                <span className={`font-medium ${isMine ? 'text-green-800' : 'text-gray-800'}`}>
                  {slot.user.name} {isMine && '(Вы)'}
                </span>
              ) : (
                <span className="text-gray-400 text-sm group-hover:text-brand font-medium transition-colors">
                  Свободное место. Нажмите, чтобы занять.
                </span>
              )}
            </div>
          </div>
          
          {slot && (
            <button 
              onClick={(e) => { e.stopPropagation(); deleteSlot(slot.id); }}
              className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Освободить место"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
      );
    }
    return elements;
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 pb-20">
      <button 
        onClick={() => navigate('/')} 
        className="flex items-center gap-2 text-gray-500 hover:text-gray-800 mb-6 transition-colors"
      >
        <ArrowLeft size={20} />
        <span className="font-medium text-sm">Назад к списку</span>
      </button>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">{event.title}</h1>
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span className="flex items-center gap-1"><Calendar size={16} /> {formatDateWithDay(event.date)}</span>
        </div>
      </div>

      <div className="space-y-1">
        {renderSlots()}
      </div>

      {showLoginModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-md">
            <button 
              onClick={() => setShowLoginModal(false)}
              className="absolute -top-10 right-0 text-white hover:text-gray-200 font-bold text-xl"
            >
              Закрыть ✕
            </button>
            <Login onLogin={(u) => { onLogin(u); setShowLoginModal(false); }} />
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('user');
    if (saved) setUser(JSON.parse(saved));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard user={user} onLogout={handleLogout} />} />
        <Route path="/queue/:eventId" element={<EventQueue user={user} onLogin={setUser} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
