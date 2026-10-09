import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import api from './api';
import { BookOpen, Calendar, ArrowLeft, ArrowRight, ArrowLeft as ArrowLeftIcon, Check, Trash2, Plus, Users, UserPlus, Edit2, X, Filter, FileText } from 'lucide-react';

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

const getDaysUntilDeletion = (createdAtStr) => {
  if (!createdAtStr) return 18;
  const createdDate = new Date(createdAtStr + 'Z'); // ensure UTC
  const now = new Date();
  const diffTime = now.getTime() - createdDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const daysLeft = 18 - diffDays;
  return daysLeft > 0 ? daysLeft : 0;
};

const getDaysString = (days) => {
  const lastDigit = days % 10;
  const lastTwoDigits = days % 100;
  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) return 'дней';
  if (lastDigit === 1) return 'день';
  if (lastDigit >= 2 && lastDigit <= 4) return 'дня';
  return 'дней';
};

function Dashboard() {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [events, setEvents] = useState([]);
  const [homeworks, setHomeworks] = useState([]);
  const [activeTab, setActiveTab] = useState('queues'); // 'queues' or 'homeworks'
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // Subject UI state
  const [isAddingSubject, setIsAddingSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [editingSubjectId, setEditingSubjectId] = useState(null);
  const [editingSubjectName, setEditingSubjectName] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  const [isSubjectsEditMode, setIsSubjectsEditMode] = useState(false);

  // Event UI state
  const [newEvent, setNewEvent] = useState({ title: '', date: '', subject_id: '' });
  const [editingEvent, setEditingEvent] = useState(null);
  const [editEventForm, setEditEventForm] = useState({ title: '', date: '', subject_id: '' });
  
  // Filter & Sort State
  const [showFilters, setShowFilters] = useState(false);
  const [eventSort, setEventSort] = useState('nearest'); // 'nearest', 'farthest', 'newest'
  const [filterDate, setFilterDate] = useState(''); // Specific date

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [subs, evs, hws] = await Promise.all([
        api.get('/subjects/'),
        api.get('/events/'),
        api.get('/homeworks/')
      ]);
      setSubjects(subs.data);
      setEvents(evs.data);
      setHomeworks(hws.data);
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

  const [newHw, setNewHw] = useState({ title: '', description: '', due_date: '', subject_id: '' });
  
  const createHomework = async (e) => {
    e.preventDefault();
    if (!newHw.subject_id) return alert('Выберите предмет');
    try {
      await api.post('/homeworks/', {
        title: newHw.title.trim() || 'Без названия',
        description: newHw.description || '',
        due_date: newHw.due_date || null,
        subject_id: parseInt(newHw.subject_id)
      });
      setShowCreateForm(false);
      setNewHw({ title: '', description: '', due_date: '', subject_id: '' });
      fetchData();
    } catch (err) {
      alert('Ошибка при добавлении задания');
    }
  };

  const deleteHomework = async (id) => {
    if (!window.confirm('Точно удалить задание?')) return;
    try {
      await api.delete(`/homeworks/${id}`);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // Sync selected subject to create form
  useEffect(() => {
    if (showCreateForm && selectedSubjectId) {
      setNewEvent(prev => ({ ...prev, subject_id: selectedSubjectId }));
      setNewHw(prev => ({ ...prev, subject_id: selectedSubjectId }));
    }
  }, [selectedSubjectId, showCreateForm]);

  // Subjects processing
  const sortedSubjects = [...subjects].sort((a, b) => a.name.localeCompare(b.name));

  // Events processing
  let displayedEvents = selectedSubjectId 
    ? events.filter(e => e.subject_id === selectedSubjectId)
    : [...events];

  if (filterDate) {
    displayedEvents = displayedEvents.filter(e => e.date === filterDate);
  }

  displayedEvents.sort((a, b) => {
    if (eventSort === 'newest') return b.id - a.id;

    const timeA = a.date ? new Date(a.date).getTime() : Infinity;
    const timeB = b.date ? new Date(b.date).getTime() : Infinity;

    if (timeA === timeB) return b.id - a.id;

    if (eventSort === 'nearest') return timeA - timeB;
    if (eventSort === 'farthest') {
      if (!a.date) return 1; // null dates always at the end
      if (!b.date) return -1;
      return timeB - timeA;
    }
    return 0;
  });

  let displayedHomeworks = selectedSubjectId 
    ? homeworks.filter(h => h.subject_id === selectedSubjectId)
    : [...homeworks];
    
  displayedHomeworks.sort((a, b) => b.id - a.id);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center shadow-sm">
              <BookOpen size={18} className="text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-800 tracking-tight hidden sm:block">Очередь IT3-2303</h1>
          </div>
          
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button 
              onClick={() => { setActiveTab('queues'); setShowCreateForm(false); }}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${activeTab === 'queues' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Очереди
            </button>
            <button 
              onClick={() => { setActiveTab('homeworks'); setShowCreateForm(false); }}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-1 ${activeTab === 'homeworks' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <FileText size={16} /> Домашка
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 md:px-6 mt-8 flex flex-col md:flex-row gap-8">
        
        {/* Sidebar: Subjects */}
        <div className="w-full md:w-64 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Предметы</h2>
            <div className="flex gap-1">
              <button 
                onClick={() => setIsSubjectsEditMode(!isSubjectsEditMode)}
                className={`p-1.5 rounded-lg transition-colors ${isSubjectsEditMode ? 'bg-brand/20 text-brand' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'}`}
                title="Настройка предметов"
              >
                <Edit2 size={18} />
              </button>
              <button 
                onClick={() => setIsAddingSubject(!isAddingSubject)}
                className="text-brand hover:text-brand-hover hover:bg-brand/10 p-1.5 rounded-lg transition-colors"
                title="Создать предмет"
              >
                <Plus size={18} />
              </button>
            </div>
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
              className={`w-full text-left px-3 py-2 sm:py-2.5 text-sm sm:text-base rounded-xl font-medium transition-all ${
                selectedSubjectId === null
                  ? 'bg-gray-800 text-white shadow-sm'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              Все предметы
            </button>
            
            {sortedSubjects.map(sub => {
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
                  onClick={() => !isSubjectsEditMode && setSelectedSubjectId(sub.id)}
                  className={`group flex items-center justify-between px-3 py-2 sm:py-2.5 rounded-xl transition-all border ${
                    isSelected && !isSubjectsEditMode
                      ? 'bg-brand/10 border-brand/20 text-brand' 
                      : 'bg-white border-gray-100 hover:border-gray-200 hover:bg-gray-50 text-gray-700'
                  } ${!isSubjectsEditMode ? 'cursor-pointer' : ''}`}
                >
                  <span className={`font-medium text-sm sm:text-base truncate pr-2 ${isSelected && !isSubjectsEditMode ? 'font-bold' : ''}`}>{sub.name}</span>
                  
                  {isSubjectsEditMode && (
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingSubjectId(sub.id);
                          setEditingSubjectName(sub.name);
                        }}
                        className="p-1.5 rounded-md hover:bg-gray-200 text-gray-500 hover:text-gray-800"
                        title="Редактировать"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSubject(sub.id);
                        }}
                        className="p-1.5 rounded-md hover:bg-red-100 text-red-500"
                        title="Удалить"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Content: Events/Homeworks */}
        <div className="flex-1">
          {activeTab === 'queues' && (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                <h2 className="text-2xl font-bold text-gray-800">
                  {selectedSubjectId ? subjects.find(s => s.id === selectedSubjectId)?.name : 'Доступные очереди'}
                </h2>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center justify-center p-2.5 rounded-xl transition-all shadow-sm active:scale-95 border ${
                  showFilters ? 'bg-brand/10 text-brand border-brand/20' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50 hover:text-gray-700'
                }`}
                title="Настройки фильтрации"
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

          {/* Filter Settings Panel */}
          {showFilters && (
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm mb-6 animate-in fade-in slide-in-from-top-4 duration-200">
              <div className="flex flex-col md:flex-row gap-6">
                
                {/* Event Sorting */}
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Сортировка очередей</label>
                  <select 
                    value={eventSort} 
                    onChange={e => setEventSort(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand outline-none bg-gray-50 cursor-pointer"
                  >
                    <option value="nearest">Сначала ближайшие</option>
                    <option value="farthest">Сначала дальние</option>
                    <option value="newest">Недавно добавленные</option>
                  </select>
                </div>

                {/* Date Picker */}
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Показать определенный день</label>
                  <div className="flex gap-2">
                    <input 
                      type="date"
                      value={filterDate}
                      onChange={e => setFilterDate(e.target.value)}
                      className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand outline-none bg-gray-50"
                    />
                    {filterDate && (
                      <button 
                        onClick={() => setFilterDate('')}
                        className="px-3 py-2 bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-800 rounded-xl transition-colors flex items-center justify-center"
                        title="Сбросить дату"
                      >
                        <X size={20} />
                      </button>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Create Form */}
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

          {displayedEvents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {displayedEvents.map(ev => {
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
                      {ev.created_at && (
                        <p className="text-xs text-gray-400 mt-3 font-medium">
                          (удалится через {getDaysUntilDeletion(ev.created_at)} {getDaysString(getDaysUntilDeletion(ev.created_at))})
                        </p>
                      )}
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
                <p className="text-lg font-medium">Нет очередей по вашему запросу</p>
                {filterDate && <p className="text-sm mt-1">Попробуйте выбрать другую дату</p>}
              </div>
            )
          )}
            </>
          )}

          {activeTab === 'homeworks' && (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                <h2 className="text-2xl font-bold text-gray-800">
                  {selectedSubjectId ? subjects.find(s => s.id === selectedSubjectId)?.name : 'Домашние задания'}
                </h2>
                
                <button 
                  onClick={() => {
                    if (!showCreateForm) {
                      setNewHw({ title: '', description: '', due_date: '', subject_id: selectedSubjectId || '' });
                    }
                    setShowCreateForm(!showCreateForm);
                  }}
                  className="flex items-center justify-center gap-2 bg-brand text-white px-5 py-2.5 rounded-xl font-medium hover:bg-brand-hover transition-all shadow-sm active:scale-95"
                >
                  {showCreateForm ? 'Отмена' : 'Добавить ДЗ'}
                </button>
              </div>

              {/* Create Homework Form */}
              {showCreateForm && (
                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm mb-6 animate-in fade-in slide-in-from-top-4 duration-200">
                  <h3 className="font-bold text-gray-800 mb-4">Новое домашнее задание</h3>
                  <form onSubmit={createHomework} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Предмет *</label>
                      <select 
                        required
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand outline-none bg-white"
                        value={newHw.subject_id}
                        onChange={e => setNewHw({...newHw, subject_id: e.target.value})}
                      >
                        <option value="">Выберите предмет...</option>
                        {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Срок сдачи (дедлайн)</label>
                      <input 
                        type="date" 
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand outline-none"
                        value={newHw.due_date}
                        onChange={e => setNewHw({...newHw, due_date: e.target.value})}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Заголовок / Тема</label>
                      <input 
                        type="text" 
                        required
                        placeholder="Например: Сделать отчет по ЛР1" 
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand outline-none"
                        value={newHw.title}
                        onChange={e => setNewHw({...newHw, title: e.target.value})}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Описание задания</label>
                      <textarea 
                        rows="3"
                        placeholder="Дополнительные детали..." 
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand outline-none resize-none"
                        value={newHw.description}
                        onChange={e => setNewHw({...newHw, description: e.target.value})}
                      />
                    </div>
                    <div className="md:col-span-2 flex justify-end mt-2">
                      <button type="submit" className="bg-gray-900 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-black transition-colors shadow-sm">
                        Добавить
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {displayedHomeworks.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {displayedHomeworks.map(hw => {
                    const sub = subjects.find(s => s.id === hw.subject_id);
                    return (
                      <div 
                        key={hw.id} 
                        className="group bg-white p-5 rounded-2xl border border-gray-200 hover:border-brand/30 hover:shadow-md transition-all flex flex-col"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wide">
                              ДЗ
                            </div>
                            {hw.due_date && (
                              <div className="flex items-center gap-1 bg-red-50 text-red-600 text-xs font-semibold px-2.5 py-1 rounded-md tracking-wide border border-red-100">
                                <Calendar size={14} />
                                Дедлайн: {formatDateWithDay(hw.due_date)}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                            <button 
                              onClick={() => deleteHomework(hw.id)}
                              className="text-gray-400 hover:text-red-500 p-1.5 rounded-md hover:bg-red-50"
                              title="Удалить"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                        <h4 className="text-xl font-bold text-gray-800 mt-2 leading-tight">{sub?.name}: {hw.title}</h4>
                        {hw.description && (
                          <p className="text-sm font-medium text-gray-600 mt-2 whitespace-pre-wrap">{hw.description}</p>
                        )}
                        {hw.created_at && (
                          <div className="mt-4 pt-3 border-t border-gray-100">
                            <p className="text-xs text-gray-400 font-medium">
                              (удалится через {getDaysUntilDeletion(hw.created_at)} {getDaysString(getDaysUntilDeletion(hw.created_at))})
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                !showCreateForm && (
                  <div className="py-16 text-center text-gray-400 bg-white border border-dashed border-gray-200 rounded-2xl">
                    <FileText size={48} className="mx-auto text-gray-200 mb-4" />
                    <p className="text-lg font-medium">Пока нет домашних заданий</p>
                  </div>
                )
              )}
            </>
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
