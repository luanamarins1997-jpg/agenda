const ProAgenda = (() => {
  let state = {
    currentDate: new Date(),
    currentView: 'month',
    selectedDate: null,
    selectedEvent: null,
    notes: []
  };

  const events = [];

  // --- Persistence ---
  function save(key, data) {
    try { localStorage.setItem('proagenda_' + key, JSON.stringify(data)); } catch (_) {}
  }

  function load(key, fallback) {
    try {
      const v = localStorage.getItem('proagenda_' + key);
      return v ? JSON.parse(v) : fallback;
    } catch (_) { return fallback; }
  }

  function saveState() {
    save('state', { currentDate: state.currentDate.toISOString(), currentView: state.currentView, notes: state.notes });
  }

  function loadState() {
    const saved = load('state', null);
    if (saved) {
      state.currentDate = new Date(saved.currentDate);
      state.currentView = saved.currentView || 'month';
      state.notes = saved.notes || [];
    }
  }

  // Load persisted data on init
  loadState();

  function formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function getEventsForDate(dateStr) {
    return events.filter(e => e.date === dateStr);
  }

  function getEventsForMonth(year, month) {
    return events.filter(e => {
      const d = new Date(e.date);
      return d.getFullYear() === year && d.getMonth() === month;
    });
  }

  function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
  }

  function getFirstDayOfMonth(year, month) {
    return new Date(year, month, 1).getDay();
  }

  function getMonthName(month) {
    const names = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                   'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    return names[month];
  }

  function getShortMonthName(month) {
    return getMonthName(month).substring(0, 3).toUpperCase();
  }

  function getDayName(day) {
    const names = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
    return names[day];
  }

  function getFullDayName(day) {
    const names = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira',
                   'Quinta-feira', 'Sexta-feira', 'Sábado'];
    return names[day];
  }

  function formatTime(h, m) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  function isToday(date) {
    const t = new Date();
    return date.getFullYear() === t.getFullYear() &&
           date.getMonth() === t.getMonth() &&
           date.getDate() === t.getDate();
  }

  // String 'YYYY-MM-DD' do dia de hoje (data local do dispositivo)
  function getTodayStr() {
    return formatDate(new Date());
  }

  function getState() { return state; }

  function setState(updates) {
    Object.assign(state, updates);
    saveState();
  }

  function addEvent(evt) {
    evt.id = 'evt-' + Date.now();
    evt.tasks = evt.tasks || [];
    events.push(evt);
    return evt;
  }

  function updateEvent(id, updates) {
    const idx = events.findIndex(e => e.id === id);
    if (idx !== -1) {
      events[idx] = { ...events[idx], ...updates };
      return events[idx];
    }
    return null;
  }

  function deleteEvent(id) {
    const idx = events.findIndex(e => e.id === id);
    if (idx !== -1) events.splice(idx, 1);
  }

  function addNote(note) {
    note.id = 'note-' + Date.now();
    note.createdAt = new Date().toISOString();
    state.notes.unshift(note);
    saveState();
    return note;
  }

  function deleteNote(id) {
    state.notes = state.notes.filter(n => n.id !== id);
    saveState();
  }

  function updateNote(id, updates) {
    const idx = state.notes.findIndex(n => n.id === id);
    if (idx !== -1) {
      state.notes[idx] = { ...state.notes[idx], ...updates };
      saveState();
      return state.notes[idx];
    }
    return null;
  }

  return {
    getState, setState,
    getEventsForDate, getEventsForMonth,
    getDaysInMonth, getFirstDayOfMonth,
    getMonthName, getShortMonthName,
    getDayName, getFullDayName,
    formatDate, formatTime, isToday, getTodayStr,
    addEvent, updateEvent, deleteEvent,
    addNote, deleteNote, updateNote,
    get events() { return events; },
    save, load
  };
})();
