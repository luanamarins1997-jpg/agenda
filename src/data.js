const ProAgenda = (() => {
  let state = {
    currentDate: new Date(2026, 5, 26),
    currentView: 'month',
    selectedDate: null,
    selectedEvent: null,
    notes: []
  };

  const mockEvents = [];

  let events = [...mockEvents];

  function formatDate(date) {
    return date.toISOString().split('T')[0];
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
    const today = new Date(2026, 5, 26);
    return date.getFullYear() === today.getFullYear() &&
           date.getMonth() === today.getMonth() &&
           date.getDate() === today.getDate();
  }

  function getState() { return state; }

  function setState(updates) {
    Object.assign(state, updates);
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
    events = events.filter(e => e.id !== id);
  }

  function addNote(note) {
    note.id = 'note-' + Date.now();
    note.createdAt = new Date().toISOString();
    state.notes.unshift(note);
    return note;
  }

  function deleteNote(id) {
    state.notes = state.notes.filter(n => n.id !== id);
  }

  function updateNote(id, updates) {
    const idx = state.notes.findIndex(n => n.id === id);
    if (idx !== -1) {
      state.notes[idx] = { ...state.notes[idx], ...updates };
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
    formatDate, formatTime, isToday,
    addEvent, updateEvent, deleteEvent,
    addNote, deleteNote, updateNote,
    get events() { return events; }
  };
})();
