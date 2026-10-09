import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import api from './api';
import { BookOpen, Calendar, ArrowLeft, ArrowRight, ArrowLeft as ArrowLeftIcon, Check, Trash2, Plus, Users, UserPlus } from 'lucide-react';

const formatDateWithDay = (dateStr) => {
  if (!dateStr) return 'Без даты';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const formatter = new Intl.DateTimeFormat('ru-RU', {
    weekday: 'short',
    day: 'numeric',
    month: 'long'
  });
  const parts = formatter.formatToParts(d);
  const weekday = parts.find(p => p.type === 'weekday').value;
  const day = parts.find(p => p.type === 'day').value;
  const month = parts.find(p => p.type === 'month').value;
  
  return `${day} ${month} (${weekday.charAt(0).toUpperCase() + weekday.slice(1)})`;
};

function Dashboard() {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [events, setEvents] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newEvent, setNewEvent] = useState({ title: '', date: '', subject_id: '' });
  
  // Date filtering state
  const [currentDateIndex, setCurrentDateIndex] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [subs, evs] = await Promise.all([
        api.get('/subjects/'),
        api.get('/events/')
      ]);
      setSubjects(subs.data);
      setEvents(evs.data);
    } catch (err) {
      console.error(err);
    }
  };

  const createSubject = async (e) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;
    try {
      const res = await api.post('/subjects/', { name: newSubjectName });
      setSubjects([...subjects, res.data]);
      setNewSubjectName('');
    } catch (err) {
      alert('Ошибка при создании предмета');
    }
  };

  const createEvent = async (e) => {
    e.preventDefault();
    if (!newEvent.subject_id) return alert('Выберите предмет');
    try {
      await api.post('/events/', {
        title: newEvent.title.trim() || 'Без названия',
        date: newEvent.date || null,
        subject_id: parseInt(newEvent.subject_id)
      });
      setShowCreateForm(false);
      setNewEvent({ title: '', date: '', subject_id: '' });
      fetchData();
    } catch (err) {
      alert('Ошибка при создании очереди');
    }
  };

  const deleteSubject = async (id) => {
    if (!window.confirm('Точно удалить предмет и ВСЕ его очереди?')) return;
    try {
      await api.delete(`/subjects/${id}`);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };
  
  const deleteEvent = async (id) => {
    if (!window.confirm('Точно удалить эту очередь?')) return;
    try {
      await api.delete(`/events/${id}`);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // Group events by date
  const uniqueDates = [...new Set(events.map(e => e.date || 'Без даты'))].sort((a, b) => {
    if (a === 'Без даты') return 1;
    if (b === 'Без даты') return -1;
    return new Date(a) - new Date(b);
  });

  const activeDate = uniqueDates[currentDateIndex] || null;
  const filteredEvents = activeDate ? events.filter(e => (e.date || 'Без даты') === activeDate) : [];

  const handlePrevDate = () => {
    if (currentDateIndex > 0) setCurrentDateIndex(currentDateIndex - 1);
  };

  const handleNextDate = () => {
    if (currentDateIndex < uniqueDates.length - 1) setCurrentDateIndex(currentDateIndex + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center shadow-sm">
              <BookOpen size={18} className="text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-800 tracking-tight">Очередь IT3-2303</h1>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 md:px-6 mt-8 flex flex-col md:flex-row gap-8">
        
        {/* Sidebar: Subjects */}
        <div className="w-full md:w-64 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Предметы</h2>
          </div>
          
          <div className="space-y-1">
            {subjects.map(sub => (
              <div key={sub.id} className="group flex items-center justify-between px-3 py-2 rounded-lg bg-white border border-gray-100 hover:border-gray-200 transition-colors shadow-sm mb-2">
                <span className="font-medium text-gray-700 truncate pr-2">{sub.name}</span>
                <button 
                  onClick={() => deleteSubject(sub.id)}
                  className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  title="Удалить предмет"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
          
          <form onSubmit={createSubject} className="mt-4">
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Новый предмет..." 
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-all"
                value={newSubjectName}
                onChange={e => setNewSubjectName(e.target.value)}
              />
              <button type="submit" className="bg-brand text-white p-2 rounded-lg hover:bg-brand-hover transition-colors">
                <Plus size={18} />
              </button>
            </div>
          </form>
        </div>

        {/* Main Content: Events */}
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <h2 className="text-2xl font-bold text-gray-800">Доступные очереди</h2>
            
            <button 
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="flex items-center justify-center gap-2 bg-brand text-white px-5 py-2.5 rounded-xl font-medium hover:bg-brand-hover transition-all shadow-sm active:scale-95"
            >
              {showCreateForm ? 'Отмена' : 'Создать очередь'}
            </button>
          </div>

          {showCreateForm && (
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm mb-6 animate-in fade-in slide-in-from-top-4 duration-200">
              <h3 className="font-bold text-gray-800 mb-4">Создание новой очереди</h3>
              <form onSubmit={createEvent} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Предмет *</label>
                  <select 
                    required
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand outline-none bg-white"
                    value={newEvent.subject_id}
                    onChange={e => setNewEvent({...newEvent, subject_id: e.target.value})}
                  >
                    <option value="">Выберите предмет...</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Дата (необязательно)</label>
                  <input 
                    type="date" 
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand outline-none"
                    value={newEvent.date}
                    onChange={e => setNewEvent({...newEvent, date: e.target.value})}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Название/Тема (необязательно)</label>
                  <input 
                    type="text" 
                    placeholder="Например: Лабораторная 3" 
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand outline-none"
                    value={newEvent.title}
                    onChange={e => setNewEvent({...newEvent, title: e.target.value})}
                  />
                </div>
                <div className="md:col-span-2 flex justify-end mt-2">
                  <button type="submit" className="bg-gray-900 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-black transition-colors shadow-sm">
                    Создать
                  </button>
                </div>
              </form>
            </div>
          )}

          {uniqueDates.length > 0 ? (
            <div className="mb-8">
              {/* Date Filter Controls */}
              <div className="flex items-center justify-between bg-white border border-gray-200 rounded-2xl p-2 mb-6 shadow-sm">
                <button 
                  onClick={handlePrevDate}
                  disabled={currentDateIndex === 0}
                  className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 disabled:opacity-30 transition-all"
                >
                  <ArrowLeftIcon size={20} />
                </button>
                <div className="flex flex-col items-center">
                  <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Дата</span>
                  <span className="font-semibold text-gray-800 text-lg">{activeDate === 'Без даты' ? activeDate : formatDateWithDay(activeDate)}</span>
                </div>
                <button 
                  onClick={handleNextDate}
                  disabled={currentDateIndex === uniqueDates.length - 1}
                  className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 disabled:opacity-30 transition-all"
                >
                  <ArrowRight size={20} />
                </button>
              </div>

              {/* Events Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredEvents.map(ev => {
                  const sub = subjects.find(s => s.id === ev.subject_id);
                  return (
                    <div 
                      key={ev.id} 
                      onClick={() => navigate(`/queue/${ev.id}`)}
                      className="group bg-white p-5 rounded-2xl border border-gray-200 hover:border-brand/30 hover:shadow-md cursor-pointer transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <div className="bg-gray-100 text-gray-600 text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wide">
                            Очередь
                          </div>
                          <button 
                            onClick={(e) => { e.stopPropagation(); deleteEvent(ev.id); }}
                            className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <h4 className="text-xl font-bold text-gray-800 mt-2 leading-tight">{sub?.name}</h4>
                        <p className="text-md font-medium text-gray-500 mt-1">{ev.title}</p>
                      </div>
                      
                      <div className="mt-6 flex items-center justify-between text-brand text-sm font-semibold">
                        <span>Открыть очередь</span>
                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            !showCreateForm && (
              <div className="py-16 text-center text-gray-400 bg-white border border-dashed border-gray-200 rounded-2xl">
                <Calendar size={48} className="mx-auto text-gray-200 mb-4" />
                <p className="text-lg font-medium">Нет созданных очередей</p>
                <p className="text-sm mt-1">Создайте очередь, чтобы начать</p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

function EventQueue() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [slots, setSlots] = useState([]);
  const [showNameModal, setShowNameModal] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [studentName, setStudentName] = useState('');
  const [mySlotIds, setMySlotIds] = useState([]);

  const totalSlots = 30; 

  useEffect(() => {
    // Load owned slots from localStorage
    const saved = localStorage.getItem('my_slots');
    if (saved) {
      setMySlotIds(JSON.parse(saved));
    }
    
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [eventId]);

  const fetchData = async () => {
    try {
      const [eventRes, slotsRes] = await Promise.all([
        api.get('/events/'), 
        api.get(`/events/${eventId}/slots`)
      ]);
      const ev = eventRes.data.find(e => e.id === parseInt(eventId));
      setEvent(ev);
      setSlots(slotsRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSlotClick = (position) => {
    setSelectedPosition(position);
    setShowNameModal(true);
  };

  const submitSlot = async (e) => {
    e.preventDefault();
    if (!studentName.trim()) return;
    
    const pos = selectedPosition;
    setShowNameModal(false);
    
    // Optimistic UI update
    const tempSlotId = `temp-${Date.now()}`;
    const tempSlot = {
      id: tempSlotId,
      position: pos,
      user: { id: 'temp', name: studentName }
    };
    
    setSlots(prev => [...prev, tempSlot]);
    const currentName = studentName;
    setStudentName(''); // Reset input

    try {
      const res = await api.post('/slots/', {
        position: pos,
        event_id: parseInt(eventId),
        student_name: currentName
      });
      
      // Save ID to local storage so they can delete it
      const newMySlots = [...mySlotIds, res.data.id];
      setMySlotIds(newMySlots);
      localStorage.setItem('my_slots', JSON.stringify(newMySlots));
      
      fetchData(); 
    } catch (err) {
      setSlots(prev => prev.filter(s => s.id !== tempSlotId));
      alert(err.response?.data?.detail || 'Ошибка при занятии места');
    }
  };

  const deleteSlot = async (slotId) => {
    if (!window.confirm('Точно освободить это место?')) return;
    
    // Optimistic delete
    const slotToRemove = slots.find(s => s.id === slotId);
    setSlots(prev => prev.filter(s => s.id !== slotId));

    try {
      if (String(slotId).startsWith('temp-')) {
          fetchData();
          return;
      }
      await api.delete(`/slots/${slotId}`);
      
      // Remove from my_slots if it was there
      const newMySlots = mySlotIds.filter(id => id !== slotId);
      setMySlotIds(newMySlots);
      localStorage.setItem('my_slots', JSON.stringify(newMySlots));
      
      fetchData();
    } catch (err) {
      if (slotToRemove) setSlots(prev => [...prev, slotToRemove]);
      alert(err.response?.data?.detail || 'Ошибка');
    }
  };

  if (!event) return <div className="p-10 text-center font-medium text-gray-500">Загрузка...</div>;

  const renderSlots = () => {
    let elements = [];
    for (let i = 1; i <= totalSlots; i++) {
      const slot = slots.find(s => s.position === i);
      const isMine = slot && mySlotIds.includes(slot.id);

      elements.push(
        <div 
          key={i} 
          className={`relative flex items-center justify-between p-3 sm:p-4 mb-2 rounded-xl border transition-all ${
            slot 
              ? isMine 
                ? 'bg-green-50 border-green-200 shadow-sm' 
                : 'bg-white border-gray-200'
              : 'bg-gray-50 border-dashed border-gray-200 hover:border-brand hover:bg-brand/5 cursor-pointer group'
          }`}
          onClick={() => !slot && handleSlotClick(i)}
        >
          <div className="flex items-center gap-4">
            <span className={`text-lg font-bold w-6 sm:w-8 text-center ${slot ? (isMine ? 'text-green-600' : 'text-gray-800') : 'text-gray-400 group-hover:text-brand'}`}>
              {i}
            </span>
            <div>
              {slot ? (
                <span className={`font-medium ${isMine ? 'text-green-800' : 'text-gray-800'}`}>
                  {slot.user.name} {isMine && <span className="text-xs ml-2 bg-green-200 text-green-800 px-2 py-0.5 rounded-full">Ваше</span>}
                </span>
              ) : (
                <span className="text-gray-400 text-sm group-hover:text-brand font-medium transition-colors">
                  Свободно. Нажмите, чтобы занять.
                </span>
              )}
            </div>
          </div>
          
          {slot && (
            <button 
              onClick={(e) => { e.stopPropagation(); deleteSlot(slot.id); }}
              className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Удалить место"
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
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-3xl mx-auto p-4 md:p-6">
        <button 
          onClick={() => navigate('/')} 
          className="flex items-center gap-2 text-gray-500 hover:text-gray-800 mb-6 transition-colors bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100"
        >
          <ArrowLeftIcon size={18} />
          <span className="font-medium text-sm">Назад</span>
        </button>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-8 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">{event.title || 'Без названия'}</h1>
            <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
              <Calendar size={16} /> 
              {event.date ? formatDateWithDay(event.date) : 'Без даты'}
            </div>
          </div>
        </div>

        <div className="space-y-1">
          {renderSlots()}
        </div>

        {/* Modal for Name Input */}
        {showNameModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
              <div className="bg-gray-50 p-4 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <UserPlus size={18} className="text-brand"/>
                  Занять {selectedPosition} место
                </h3>
              </div>
              <form onSubmit={submitSlot} className="p-5">
                <div className="mb-5">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Имена (кто выступает)</label>
                  <input 
                    type="text" 
                    autoFocus
                    required
                    placeholder="Например: Иван и Алексей"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-all text-gray-800"
                    value={studentName}
                    onChange={e => setStudentName(e.target.value)}
                  />
                  <p className="text-xs text-gray-400 mt-2">Можно вписать несколько человек, если выступаете вместе.</p>
                </div>
                <div className="flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setShowNameModal(false)}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                  >
                    Отмена
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 bg-brand text-white py-3 rounded-xl font-medium hover:bg-brand-hover transition-colors shadow-sm"
                  >
                    Занять
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/queue/:eventId" element={<EventQueue />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
