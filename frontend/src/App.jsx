import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import api from './api';
import { BookOpen, Calendar, ArrowLeft, ArrowRight, ArrowLeft as ArrowLeftIcon, Check, Trash2, Plus, Users, UserPlus, Edit2, X, Filter } from 'lucide-react';

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
  
  // Subject UI state
  const [isAddingSubject, setIsAddingSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [editingSubjectId, setEditingSubjectId] = useState(null);
  const [editingSubjectName, setEditingSubjectName] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);

  // Event UI state
  const [newEvent, setNewEvent] = useState({ title: '', date: '', subject_id: '' });
  const [editingEvent, setEditingEvent] = useState(null);
  const [editEventForm, setEditEventForm] = useState({ title: '', date: '', subject_id: '' });
  
  // Date filtering state
  const [showDateFilter, setShowDateFilter] = useState(false);
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
      setIsAddingSubject(false);
    } catch (err) {
      alert('Ошибка при создании предмета');
    }
  };

  const updateSubject = async (e, id) => {
    e.preventDefault();
    if (!editingSubjectName.trim()) return;
    try {
      await api.put(`/subjects/${id}`, { name: editingSubjectName });
      setEditingSubjectId(null);
      fetchData();
    } catch (err) {
      alert('Ошибка при обновлении предмета');
    }
  };

  const deleteSubject = async (id) => {
    if (!window.confirm('Точно удалить предмет и ВСЕ его очереди?')) return;
    try {
      await api.delete(`/subjects/${id}`);
      if (selectedSubjectId === id) setSelectedSubjectId(null);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };
  
  const createEvent = async (e) => {
    e.preventDefault();
    if (!newEvent.subject_id) return alert('Выберите предмет');
    try {
      await api.post('/events/', {
        title: newEvent.title.trim() || '',
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

  const updateEvent = async (e) => {
    e.preventDefault();
    if (!editEventForm.subject_id) return alert('Выберите предмет');
    try {
      await api.put(`/events/${editingEvent.id}`, {
        title: editEventForm.title.trim() || '',
        date: editEventForm.date || null,
        subject_id: parseInt(editEventForm.subject_id)
      });
      setEditingEvent(null);
      fetchData();
    } catch (err) {
      alert('Ошибка при обновлении очереди');
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

  // 1. Filter events by selected subject
  const subjectEvents = selectedSubjectId 
    ? events.filter(e => e.subject_id === selectedSubjectId)
    : events;

  // 2. Extract unique dates for those events
  const uniqueDates = [...new Set(subjectEvents.map(e => e.date || 'Без даты'))].sort((a, b) => {
    if (a === 'Без даты') return 1;
    if (b === 'Без даты') return -1;
    return new Date(a) - new Date(b);
  });

  // Keep date index within bounds
  useEffect(() => {
    if (currentDateIndex >= uniqueDates.length && uniqueDates.length > 0) {
      setCurrentDateIndex(Math.max(0, uniqueDates.length - 1));
    }
  }, [uniqueDates.length, currentDateIndex]);

  // Sync selected subject to create form
  useEffect(() => {
    if (showCreateForm && selectedSubjectId) {
      setNewEvent(prev => ({ ...prev, subject_id: selectedSubjectId }));
    }
  }, [selectedSubjectId, showCreateForm]);

  const activeDate = (showDateFilter && uniqueDates.length > 0) ? (uniqueDates[currentDateIndex] || null) : null;
  
  // 3. Filter the subjectEvents by the active date (only if filter is active)
  const filteredEvents = activeDate ? subjectEvents.filter(e => (e.date || 'Без даты') === activeDate) : subjectEvents;

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
            <button 
              onClick={() => setIsAddingSubject(!isAddingSubject)}
              className="text-brand hover:text-brand-hover hover:bg-brand/10 p-1.5 rounded-lg transition-colors"
              title="Создать предмет"
            >
              <Plus size={18} />
            </button>
          </div>
          
          {isAddingSubject && (
            <form onSubmit={createSubject} className="mb-4 bg-white p-2 rounded-xl border border-brand shadow-sm">
              <input 
                type="text" 
                autoFocus
                placeholder="Название предмета..." 
                className="w-full px-2 py-1.5 text-sm outline-none bg-transparent"
                value={newSubjectName}
                onChange={e => setNewSubjectName(e.target.value)}
              />
              <div className="flex justify-end gap-1 mt-2 border-t border-gray-100 pt-2">
                <button type="button" onClick={() => setIsAddingSubject(false)} className="px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 rounded-md">Отмена</button>
                <button type="submit" className="px-2 py-1 text-xs bg-brand text-white hover:bg-brand-hover rounded-md">Создать</button>
              </div>
            </form>
          )}
          
          <div className="space-y-1.5">
            <button
              onClick={() => setSelectedSubjectId(null)}
              className={`w-full text-left px-3 py-2.5 rounded-xl font-medium transition-all ${
                selectedSubjectId === null
                  ? 'bg-gray-800 text-white shadow-sm'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              Все предметы
            </button>
            
            {subjects.map(sub => {
              const isSelected = selectedSubjectId === sub.id;
              
              if (editingSubjectId === sub.id) {
                return (
                  <form key={sub.id} onSubmit={(e) => updateSubject(e, sub.id)} className="flex items-center gap-1 bg-white p-1 rounded-xl border border-brand shadow-sm">
                    <input
                      autoFocus
                      type="text"
                      className="flex-1 px-2 py-1.5 text-sm outline-none"
                      value={editingSubjectName}
                      onChange={e => setEditingSubjectName(e.target.value)}
                    />
                    <button type="submit" className="text-green-600 hover:bg-green-50 p-1.5 rounded-lg"><Check size={16} /></button>
                    <button type="button" onClick={() => setEditingSubjectId(null)} className="text-gray-400 hover:bg-gray-100 p-1.5 rounded-lg"><X size={16} /></button>
                  </form>
                );
              }
              
              return (
                <div 
                  key={sub.id} 
                  onClick={() => setSelectedSubjectId(sub.id)}
                  className={`group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all border ${
                    isSelected 
                      ? 'bg-brand/10 border-brand/20 text-brand' 
                      : 'bg-white border-gray-100 hover:border-gray-200 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <span className={`font-medium truncate pr-2 ${isSelected ? 'font-bold' : ''}`}>{sub.name}</span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingSubjectId(sub.id);
                        setEditingSubjectName(sub.name);
                      }}
                      className={`p-1.5 rounded-md ${isSelected ? 'hover:bg-brand/20 text-brand' : 'hover:bg-gray-200 text-gray-400 hover:text-gray-600'}`}
                      title="Редактировать"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSubject(sub.id);
                      }}
                      className={`p-1.5 rounded-md ${isSelected ? 'hover:bg-red-100 text-red-500' : 'hover:bg-red-50 text-gray-400 hover:text-red-500'}`}
                      title="Удалить"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Content: Events */}
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <h2 className="text-2xl font-bold text-gray-800">
              {selectedSubjectId ? subjects.find(s => s.id === selectedSubjectId)?.name : 'Доступные очереди'}
            </h2>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowDateFilter(!showDateFilter)}
                className={`flex items-center justify-center p-2.5 rounded-xl transition-all shadow-sm active:scale-95 border ${
                  showDateFilter ? 'bg-brand/10 text-brand border-brand/20' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50 hover:text-gray-700'
                }`}
                title="Фильтр по дате"
              >
                <Filter size={20} />
              </button>
              <button 
                onClick={() => {
                  if (!showCreateForm) {
                    setNewEvent({ title: '', date: '', subject_id: selectedSubjectId || '' });
                  }
                  setShowCreateForm(!showCreateForm);
                }}
                className="flex items-center justify-center gap-2 bg-brand text-white px-5 py-2.5 rounded-xl font-medium hover:bg-brand-hover transition-all shadow-sm active:scale-95"
              >
                {showCreateForm ? 'Отмена' : 'Создать очередь'}
              </button>
            </div>
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

          {showDateFilter && uniqueDates.length > 0 && (
            <div className="flex items-center justify-between bg-white border border-gray-200 rounded-2xl p-2 mb-6 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
              <button 
                onClick={handlePrevDate}
                disabled={currentDateIndex === 0}
                className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 disabled:opacity-30 transition-all cursor-pointer"
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
                className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 disabled:opacity-30 transition-all cursor-pointer"
              >
                <ArrowRight size={20} />
              </button>
            </div>
          )}

          {filteredEvents.length > 0 ? (
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
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="bg-gray-100 text-gray-600 text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wide">
                            Очередь
                          </div>
                          {ev.date && (
                            <div className="flex items-center gap-1 bg-brand/5 text-brand text-xs font-semibold px-2.5 py-1 rounded-md tracking-wide">
                              <Calendar size={14} />
                              {formatDateWithDay(ev.date)}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingEvent(ev);
                              setEditEventForm({
                                title: ev.title || '',
                                date: ev.date || '',
                                subject_id: ev.subject_id
                              });
                            }}
                            className="text-gray-400 hover:text-brand p-1.5 rounded-md hover:bg-brand/10"
                            title="Редактировать"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); deleteEvent(ev.id); }}
                            className="text-gray-400 hover:text-red-500 p-1.5 rounded-md hover:bg-red-50"
                            title="Удалить"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <h4 className="text-xl font-bold text-gray-800 mt-2 leading-tight">{sub?.name}</h4>
                      <p className="text-md font-medium text-gray-500 mt-1">{ev.title || 'Без названия'}</p>
                    </div>
                    
                    <div className="mt-6 flex items-center justify-between text-brand text-sm font-semibold">
                      <span>Открыть очередь</span>
                      <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                );
              })}
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

      {/* Edit Event Modal */}
      {editingEvent && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="bg-gray-50 p-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <Edit2 size={18} className="text-brand"/>
                Редактирование очереди
              </h3>
              <button onClick={() => setEditingEvent(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={updateEvent} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Предмет *</label>
                <select 
                  required
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand outline-none bg-white"
                  value={editEventForm.subject_id}
                  onChange={e => setEditEventForm({...editEventForm, subject_id: e.target.value})}
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
                  value={editEventForm.date}
                  onChange={e => setEditEventForm({...editEventForm, date: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Название/Тема (необязательно)</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand outline-none"
                  value={editEventForm.title}
                  onChange={e => setEditEventForm({...editEventForm, title: e.target.value})}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setEditingEvent(null)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  Отмена
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-brand text-white py-2.5 rounded-xl font-medium hover:bg-brand-hover transition-colors shadow-sm"
                >
                  Сохранить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
