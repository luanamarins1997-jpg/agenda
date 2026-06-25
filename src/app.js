document.addEventListener('DOMContentLoaded', () => {

  const App = ProAgenda;
  const state = App.getState;

  // --- DOM refs ---
  const $ = id => document.getElementById(id);
  const viewMonth = $('view-month');
  const viewWeek = $('view-week');
  const viewDay = $('view-day');
  const viewYear = $('view-year');
  const viewNotes = $('view-notes');
  const monthGrid = $('month-grid');
  const weekGrid = $('week-grid');
  const dayGrid = $('day-grid');
  const yearGrid = $('year-grid');
  const notesList = $('notes-list');
  const notesEditor = $('notes-editor');
  const notesEditorArea = $('notes-editor-area');
  const notesEditorTitle = $('notes-editor-title');
  const notesBackBtn = $('notes-back-btn');
  const notesDeleteBtn = $('notes-delete-btn');
  const topBarTitle = $('topbar-title');
  const topBarSubtitle = $('topbar-subtitle');
  const navPrev = $('nav-prev');
  const navNext = $('nav-next');
  const navToday = $('nav-today');
  const daySidebar = $('day-sidebar');
  const sidebarNextEvent = $('sidebar-next-event');
  const sidebarHighlight = $('sidebar-highlight');
  const sidebarDayName = $('sidebar-day-name');
  const sidebarDayNumber = $('sidebar-day-number');
  const sidebarDayMonth = $('sidebar-day-month');
  const detailOverlay = $('detail-overlay');
  const detailContent = $('detail-content');
  const fab = $('fab');
  const menuToggle = $('menu-toggle');
  const menuDropdown = $('menu-dropdown');
  const menuTodayBtn = $('menu-today-btn');
  const quickDay = $('quick-day');
  const quickMonth = $('quick-month');
  const navBtns = document.querySelectorAll('.nav-btn');

  let editingNoteId = null;
  let highlightCanvasInited = false;
  let highlightInstance = null;
  let zoomLevel = 1;

  // --- Navigation ---
  function switchView(viewName) {
    App.setState({ currentView: viewName });
    [viewMonth, viewWeek, viewDay, viewYear, viewNotes].forEach(v => v.classList.remove('active'));
    navBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === viewName);
    });
    if (daySidebar) {
      daySidebar.classList.toggle('hidden', viewName !== 'day');
    }
    if (viewName === 'month') viewMonth.classList.add('active');
    else if (viewName === 'week') viewWeek.classList.add('active');
    else if (viewName === 'day') viewDay.classList.add('active');
    else if (viewName === 'year') viewYear.classList.add('active');
    else if (viewName === 'notes') viewNotes.classList.add('active');
    updateTopBar();
    if (viewName === 'month') renderMonth();
    else if (viewName === 'week') renderWeek();
    else if (viewName === 'day') renderDay();
    else if (viewName === 'year') renderYear();
    else if (viewName === 'notes') renderNotes();
    updateDaySidebar();
    updateNextEvent();
    updateQuickBtns(viewName);
  }

  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      switchView(btn.dataset.view);
      closeMenu();
    });
  });

  // Menu toggle
  function closeMenu() {
    if (menuDropdown) menuDropdown.style.display = 'none';
  }

  function showMenu() {
    if (menuDropdown) menuDropdown.style.display = '';
  }

  function toggleMenu() {
    if (!menuDropdown) return;
    if (menuDropdown.style.display === 'none') {
      menuDropdown.style.display = '';
    } else {
      menuDropdown.style.display = 'none';
    }
  }

  if (menuToggle) {
    menuToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleMenu();
    });
  }

  document.addEventListener('click', (e) => {
    if (!menuDropdown || menuDropdown.style.display === 'none') return;
    if (!menuDropdown.contains(e.target) && e.target !== menuToggle) {
      closeMenu();
    }
  });

  if (menuTodayBtn) {
    menuTodayBtn.addEventListener('click', () => {
      App.setState({ currentDate: new Date(2026, 5, 22) });
      switchView(App.getState().currentView);
      closeMenu();
    });
  }

  // Quick view toggle
  function updateQuickBtns(view) {
    if (quickDay) {
      quickDay.classList.toggle('opacity-40', view !== 'day');
      quickDay.classList.toggle('text-primary', view === 'day');
      quickDay.classList.toggle('bg-primary/10', view === 'day');
    }
    if (quickMonth) {
      quickMonth.classList.toggle('opacity-40', view !== 'month');
      quickMonth.classList.toggle('text-primary', view === 'month');
      quickMonth.classList.toggle('bg-primary/10', view === 'month');
    }
  }

  if (quickDay) quickDay.addEventListener('click', () => { if (App.getState().currentView !== 'day') switchView('day'); });
  if (quickMonth) quickMonth.addEventListener('click', () => { if (App.getState().currentView !== 'month') switchView('month'); });

  // --- Top Bar ---
  function updateTopBar() {
    const d = App.getState().currentDate;
    const monthName = App.getMonthName(d.getMonth());
    const year = d.getFullYear();
    const view = App.getState().currentView;

    if (view === 'month') {
      topBarTitle.textContent = `${monthName} ${year}`;
      topBarSubtitle.textContent = '';
    } else if (view === 'week') {
      const start = getWeekStart(d);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      topBarTitle.textContent = `${App.getShortMonthName(start.getMonth())} ${start.getDate()} — ${App.getShortMonthName(end.getMonth())} ${end.getDate()}`;
      topBarSubtitle.textContent = `${year}`;
    } else if (view === 'day') {
      topBarTitle.textContent = `${App.getFullDayName(d.getDay())}, ${d.getDate()} ${App.getShortMonthName(d.getMonth())}`;
      topBarSubtitle.textContent = `${year}`;
    } else if (view === 'year') {
      topBarTitle.textContent = `${year}`;
      topBarSubtitle.textContent = '';
    } else if (view === 'notes') {
      topBarTitle.textContent = 'Notas';
      topBarSubtitle.textContent = '';
    }
  }

  navPrev.addEventListener('click', () => {
    const d = App.getState().currentDate;
    const view = App.getState().currentView;
    if (view === 'month') d.setMonth(d.getMonth() - 1);
    else if (view === 'week') d.setDate(d.getDate() - 7);
    else if (view === 'day') d.setDate(d.getDate() - 1);
    else if (view === 'year') d.setFullYear(d.getFullYear() - 1);
    App.setState({ currentDate: d });
    switchView(view);
  });

  navNext.addEventListener('click', () => {
    const d = App.getState().currentDate;
    const view = App.getState().currentView;
    if (view === 'month') d.setMonth(d.getMonth() + 1);
    else if (view === 'week') d.setDate(d.getDate() + 7);
    else if (view === 'day') d.setDate(d.getDate() + 1);
    else if (view === 'year') d.setFullYear(d.getFullYear() + 1);
    App.setState({ currentDate: d });
    switchView(view);
  });

  navToday.addEventListener('click', () => {
    App.setState({ currentDate: new Date(2026, 5, 22) });
    switchView(App.getState().currentView);
  });

  // --- Helpers ---
  function getWeekStart(d) {
    const copy = new Date(d);
    const day = copy.getDay();
    const diff = copy.getDate() - day + (day === 0 ? -6 : 1);
    copy.setDate(diff);
    return copy;
  }

  // --- Monthly Calendar ---
  function renderMonth() {
    const d = App.getState().currentDate;
    const year = d.getFullYear();
    const month = d.getMonth();
    const daysInMonth = App.getDaysInMonth(year, month);
    const firstDay = App.getFirstDayOfMonth(year, month);
    const daysInPrev = App.getDaysInMonth(year, month - 1);
    const events = App.getEventsForMonth(year, month);

    let html = '';
    const totalDays = firstDay + daysInMonth;
    const rows = Math.ceil(totalDays / 7);
    const totalCells = rows * 7;

    for (let i = 0; i < totalCells; i++) {
      let dayNum, isOtherMonth = false, dateStr, dayEvents = [];
      if (i < firstDay) {
        dayNum = daysInPrev - firstDay + i + 1;
        isOtherMonth = true;
        const pm = new Date(year, month - 1, dayNum);
        dateStr = App.formatDate(pm);
      } else if (i >= firstDay + daysInMonth) {
        dayNum = i - firstDay - daysInMonth + 1;
        isOtherMonth = true;
        const nm = new Date(year, month + 1, dayNum);
        dateStr = App.formatDate(nm);
      } else {
        dayNum = i - firstDay + 1;
        dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
        dayEvents = events.filter(e => e.date === dateStr);
      }

      const isToday = dateStr === '2026-06-22';
      const isWeekend = (i % 7 === 0);
      const hasEvents = dayEvents.length > 0;

      html += `<div class="day-cell p-2${isOtherMonth ? ' other-month' : ''}${isToday ? ' today' : ''}" data-date="${dateStr}">`;
      html += `<span class="font-label-mono text-[11px] ${isWeekend ? 'text-error' : 'text-on-surface'} ${isToday ? 'bg-primary text-white w-6 h-6 flex items-center justify-center rounded-full' : ''}">${dayNum}</span>`;
      if (hasEvents) {
        html += `<div class="mt-1 space-y-1">`;
        dayEvents.slice(0, 3).forEach(evt => {
          html += `<div class="text-[10px] px-1 py-0.5 rounded truncate" style="background:rgba(4,89,197,0.08);color:#0459c5;border-left:2px solid #0459c5" title="${evt.title}">`;
          if (evt.startTime) html += `<span class="font-mono opacity-60">${evt.startTime} </span>`;
          html += `${evt.title}</div>`;
        });
        if (dayEvents.length > 3) {
          html += `<div class="text-[10px] text-on-surface-variant font-semibold">+${dayEvents.length - 3} mais</div>`;
        }
        html += `</div>`;
      }
      html += `</div>`;
    }
    monthGrid.innerHTML = html;
    monthGrid.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
    monthGrid.style.maxHeight = `${rows * 100}px`;

    monthGrid.querySelectorAll('.day-cell').forEach(cell => {
      const ds = cell.dataset.date;
      if (ds) {
        const hData = drawingStore[`${ds}-highlight`];
        if (hData?.strokes?.length > 0) {
          const allPts = hData.strokes.flat();
          const minX = Math.min(...allPts.map(p => p.x)), maxX = Math.max(...allPts.map(p => p.x));
          const minY = Math.min(...allPts.map(p => p.y)), maxY = Math.max(...allPts.map(p => p.y));
          const ox = minX, oy = minY;
          const rangeX = maxX - minX || 1, rangeY = maxY - minY || 1;

          const cvs = document.createElement('canvas');
          cvs.width = 1;
          cvs.height = 1;
          cvs.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none';
          const fallbackW = monthGrid.clientWidth / 7 || 171;
          const drawOnCanvas = () => {
            const w = cell.clientWidth || fallbackW;
            const h = cell.clientHeight || (Math.max(80, w * 0.7));
            if (w < 10 || h < 10) return;
            cvs.width = w * 2;
            cvs.height = h * 2;
            cvs.style.width = w + 'px';
            cvs.style.height = h + 'px';
            const s = Math.min(w / rangeX, h / rangeY);
            const offsetX = (w - rangeX * s) / 2;
            const offsetY = (h - rangeY * s) / 2;
            const c = cvs.getContext('2d');
            c.scale(2, 2);
            hData.strokes.forEach(stroke => {
              if (stroke.length < 2) return;
              c.beginPath();
              c.moveTo((stroke[0].x - ox) * s + offsetX, (stroke[0].y - oy) * s + offsetY);
              for (let i = 1; i < stroke.length; i++) c.lineTo((stroke[i].x - ox) * s + offsetX, (stroke[i].y - oy) * s + offsetY);
              c.strokeStyle = '#1a1b1f';
              c.lineWidth = Math.max(1, 1.5 / s * 0.3);
              c.lineCap = 'round';
              c.stroke();
            });
          };
          requestAnimationFrame(drawOnCanvas);
          cell.appendChild(cvs);
        }
      }
      cell.addEventListener('click', () => {
        const dateStr = cell.dataset.date;
        if (dateStr) {
          const parts = dateStr.split('-');
          const clickDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
          // If it's an other-month day, navigate to that month
          if (cell.classList.contains('other-month')) {
            App.setState({ currentDate: clickDate });
            renderMonth();
            updateTopBar();
            updateDaySidebar();
            return;
          }
          App.setState({ currentDate: clickDate });
          switchView('day');
        }
      });
    });
  }

  // --- Weekly Calendar ---
  function renderWeek() {
    const d = App.getState().currentDate;
    const start = getWeekStart(d);
    const events = App.events;

    let html = '';
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      const dateStr = App.formatDate(date);
      const dayEvents = events.filter(e => e.date === dateStr);
      const isToday = dateStr === '2026-06-22';

      html += `<div class="flex flex-col flex-1 ${isToday ? 'bg-primary/[0.03]' : ''} ${i < 6 ? 'border-r border-outline-variant' : ''}" data-date="${dateStr}">`;
      html += `<div class="text-center py-2 border-b border-outline-variant ${isToday ? 'bg-primary text-white' : ''}">`;
      html += `<div class="font-label-mono text-[9px] ${isToday ? 'text-white/80' : 'text-secondary'}">${App.getDayName(date.getDay())}</div>`;
      html += `<div class="font-headline-sm text-[16px] ${isToday ? 'text-white' : 'text-on-surface'} leading-tight">${date.getDate()}</div>`;
      html += `</div>`;
      html += `<div class="flex-1 flex flex-col p-1.5 gap-1 overflow-auto week-content">`;
      if (dayEvents.length > 0) {
        dayEvents.slice(0, 3).forEach(evt => {
          html += `<div class="text-[10px] px-1.5 py-1 rounded truncate cursor-pointer hover:opacity-80" style="background:rgba(4,89,197,0.08);color:#0459c5;border-left:2px solid #0459c5" data-event-id="${evt.id}">`;
          html += `<div class="font-semibold truncate">${evt.title}</div>`;
          if (evt.startTime) html += `<div class="opacity-60">${evt.startTime}</div>`;
          html += `</div>`;
        });
        if (dayEvents.length > 3) {
          html += `<div class="text-[9px] text-on-surface-variant font-semibold text-center">+${dayEvents.length - 3}</div>`;
        }
      }
      html += `</div>`;
      html += `</div>`;
    }
    weekGrid.innerHTML = html;

    weekGrid.querySelectorAll('[data-event-id]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const evt = App.events.find(ev => ev.id === el.dataset.eventId);
        if (evt) showDetail(evt);
      });
    });

    // Append highlight canvases
    weekGrid.querySelectorAll('[data-date]').forEach(col => {
      const ds = col.dataset.date;
      const hData = drawingStore[`${ds}-highlight`];
      if (!hData?.strokes?.length) return;
      const content = col.querySelector('.week-content');
      if (!content) return;
      const allPts = hData.strokes.flat();
      const minX = Math.min(...allPts.map(p => p.x)), maxX = Math.max(...allPts.map(p => p.x));
      const minY = Math.min(...allPts.map(p => p.y)), maxY = Math.max(...allPts.map(p => p.y));
      const ox = minX, oy = minY, rX = maxX - minX || 1, rY = maxY - minY || 1;

      const wrap = document.createElement('div');
      wrap.style.cssText = 'position:relative;height:70px;margin-bottom:4px;border-radius:6px;overflow:hidden;background:rgba(4,89,197,0.04)';
      const cvs = document.createElement('canvas');
      cvs.style.cssText = 'position:absolute;inset:0;width:100%;height:100%';
      cvs.width = 1; cvs.height = 1;
      wrap.appendChild(cvs);
      content.prepend(wrap);

      requestAnimationFrame(() => {
        const w = cvs.clientWidth || 80;
        const h = 70;
        if (w < 10) return;
        cvs.width = w * 2; cvs.height = h * 2;
        const s = Math.min(w / rX, h / rY);
        const offX = (w - rX * s) / 2, offY = (h - rY * s) / 2;
        const c = cvs.getContext('2d');
        c.scale(2, 2);
        hData.strokes.forEach(stroke => {
          if (stroke.length < 2) return;
          c.beginPath();
          c.moveTo((stroke[0].x - ox) * s + offX, (stroke[0].y - oy) * s + offY);
          for (let j = 1; j < stroke.length; j++) c.lineTo((stroke[j].x - ox) * s + offX, (stroke[j].y - oy) * s + offY);
          c.strokeStyle = '#1a1b1f';
          c.lineWidth = Math.max(1, 1.5 / s * 0.3);
          c.lineCap = 'round';
          c.stroke();
        });
      });
    });
  }

  // --- Drawing Store ---
  const drawingStore = {};

  function initCanvas(canvas, hour, dateStr) {
    const ctx = canvas.getContext('2d');
    const container = canvas.parentElement;
    let key = `${dateStr}-${hour}`;
    let data = drawingStore[key] || { strokes: [], sectionState: [0, 0, 0], written: [false, false, false] };
    let strokes = data.strokes;
    let sectionState = data.sectionState;
    let written = data.written;
    let isDrawing = false;
    let currentStroke = [];
    let resizeTimer;

    function getPos(e) {
      const rect = canvas.getBoundingClientRect();
      const z = zoomLevel || 1;
      return { x: (e.clientX - rect.left) / z, y: (e.clientY - rect.top) / z, pressure: e.pressure || 0.5 };
    }

    function redraw() {
      const dpr = window.devicePixelRatio || 1;
      const w = container.clientWidth;
      const h = container.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);

      strokes.forEach(stroke => {
        if (stroke.length < 2) return;
        ctx.beginPath();
        ctx.moveTo(stroke[0].x, stroke[0].y);
        for (let i = 1; i < stroke.length; i++) ctx.lineTo(stroke[i].x, stroke[i].y);
        ctx.strokeStyle = '#1a1b1f';
        ctx.lineWidth = Math.max(1.5, (stroke[0].pressure || 0.5) * 4);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
      });

      const thirdH = h / 3;
      for (let i = 0; i < 3; i++) {
        if (sectionState[i] !== 1) continue;
        ctx.fillStyle = 'rgba(250, 249, 254, 0.55)';
        ctx.fillRect(0, i * thirdH, w, thirdH);
      }

      updateCircles();
    }

    function updateCircles() {
      const slot = canvas.closest('.time-slot');
      const circles = slot ? slot.querySelector('.draw-circles') : null;
      if (!circles) return;

      circles.querySelectorAll('.circle-dot').forEach(dot => {
        const idx = parseInt(dot.dataset.idx);
        const st = sectionState[idx];
        if (!written[idx]) { dot.classList.add('hidden'); return; }
        dot.classList.remove('hidden');
        if (st === 0) {
          dot.classList.remove('bg-primary');
          dot.classList.add('border-primary/40');
          dot.classList.remove('border-primary');
          dot.textContent = '';
          dot.style.color = '';
          dot.style.fontSize = '';
          dot.style.fontWeight = '';
          dot.style.display = '';
          dot.style.alignItems = '';
          dot.style.justifyContent = '';
          dot.style.lineHeight = '';
        } else if (st === 1) {
          dot.classList.add('bg-primary');
          dot.classList.add('border-primary');
          dot.classList.remove('border-primary/40');
          dot.textContent = '';
          dot.style.color = '';
          dot.style.fontSize = '';
          dot.style.fontWeight = '';
          dot.style.display = '';
          dot.style.alignItems = '';
          dot.style.justifyContent = '';
          dot.style.lineHeight = '';
        } else {
          dot.classList.remove('bg-primary');
          dot.classList.add('border-primary');
          dot.classList.remove('border-primary/40');
          dot.textContent = '✕';
          dot.style.color = '#0459c5';
          dot.style.fontSize = '10px';
          dot.style.fontWeight = '700';
          dot.style.display = 'flex';
          dot.style.alignItems = 'center';
          dot.style.justifyContent = 'center';
          dot.style.lineHeight = '1';
        }
      });
    }

    function toggleDone(idx) {
      const cur = sectionState[idx];
      sectionState[idx] = cur === 0 || cur === 2 ? 1 : 2;
      data.sectionState = sectionState;
      drawingStore[key] = data;
      redraw();
    }

    function startDrawing(e) {
      if (e.pointerType !== 'pen') return;
      e.preventDefault();
      isDrawing = true;
      currentStroke = [getPos(e)];
      canvas.setPointerCapture(e.pointerId);
    }

    function draw(e) {
      if (!isDrawing || e.pointerType !== 'pen') return;
      e.preventDefault();
      const pos = getPos(e);
      const last = currentStroke[currentStroke.length - 1];
      currentStroke.push({ ...pos });
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.strokeStyle = '#1a1b1f';
      ctx.lineWidth = Math.max(1.5, (pos.pressure || 0.5) * 4);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    }

    function stopDrawing(e) {
      if (!isDrawing) return;
      isDrawing = false;
      if (currentStroke.length > 1) {
        const rectH = container.getBoundingClientRect().height;
        const thirdH = rectH / 3;
        currentStroke.forEach(p => {
          const idx = p.y < thirdH ? 0 : p.y < thirdH * 2 ? 1 : 2;
          written[idx] = true;
        });
        strokes.push(currentStroke);
        data = { strokes, sectionState, written };
        drawingStore[key] = data;
        updateCircles();

      }
      canvas.releasePointerCapture(e.pointerId);
    }

    canvas.addEventListener('pointerdown', startDrawing, { passive: false });
    canvas.addEventListener('pointermove', draw, { passive: false });
    canvas.addEventListener('pointerup', stopDrawing);
    canvas.addEventListener('pointercancel', stopDrawing);

    const ro = new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(redraw, 100);
    });
    ro.observe(container);

    redraw();

    return {
      clear() {
        strokes = [];
        sectionState = [0, 0, 0];
        written = [false, false, false];
        data = { strokes, sectionState, written };
        drawingStore[key] = data;
        redraw();
      },
      toggleDone,
      reload(newKey) {
        key = newKey;
        data = drawingStore[key] || { strokes: [], sectionState: [0, 0, 0], written: [false, false, false] };
        strokes = data.strokes;
        sectionState = data.sectionState;
        written = data.written;
        redraw();
      }
    };
  }

  // --- Daily View ---
  function renderDay() {
    const d = App.getState().currentDate;
    const dateStr = App.formatDate(d);
    const dayEvents = App.getEventsForDate(dateStr);

    let html = `<div class="day-toolbar">
      <button id="clear-day-btn" class="text-secondary hover:text-error transition-colors" title="Limpar escritas">
        <span class="material-symbols-outlined text-[18px] align-middle">ink_eraser</span>
      </button>
      <div class="flex items-center gap-1 ml-2 border-l border-outline-variant/30 pl-2">
        <button id="zoom-out" class="text-secondary hover:text-primary transition-colors" title="Reduzir zoom">
          <span class="material-symbols-outlined text-[18px] align-middle">zoom_out</span>
        </button>
        <span id="zoom-label" class="font-label-mono text-[10px] text-secondary w-8 text-center">100%</span>
        <button id="zoom-in" class="text-secondary hover:text-primary transition-colors" title="Aumentar zoom">
          <span class="material-symbols-outlined text-[18px] align-middle">zoom_in</span>
        </button>
      </div>
      <span class="text-[11px] text-on-surface-variant/40 font-body-sm ml-auto">Escreva com a caneta</span>
    </div>`;

    for (let h = 0; h < 24; h++) {
      const timeStr = App.formatTime(h, 0);
      const hourEvents = dayEvents.filter(evt => {
        if (!evt.startTime) return false;
        const evtHour = parseInt(evt.startTime.split(':')[0]);
        return evtHour === h;
      });

      const isCurrentHour = (h === 9) && (dateStr === '2026-06-22');

      html += `<div class="time-slot flex relative ${isCurrentHour ? 'bg-primary/[0.02]' : ''}">`;
      html += `<div class="w-[80px] shrink-0 flex items-start justify-end py-2 pr-3 border-r border-outline-variant"><span class="font-label-mono text-[10px] text-on-surface opacity-40">${timeStr}</span></div>`;
      html += `<div class="w-[22px] shrink-0 relative">`;
      html += `<div class="draw-circles absolute inset-0 cursor-pointer">`;
      html += `<div class="circle-dot absolute w-3 h-3 rounded-full border-2 border-primary/40" style="left:5px;top:6px" data-idx="0"></div>`;
      html += `<div class="circle-dot absolute w-3 h-3 rounded-full border-2 border-primary/40" style="left:5px;top:50%;margin-top:-6px" data-idx="1"></div>`;
      html += `<div class="circle-dot absolute w-3 h-3 rounded-full border-2 border-primary/40" style="left:5px;bottom:8px" data-idx="2"></div>`;
      html += `</div>`;
      html += `<div class="absolute right-0 top-1 bottom-1 w-px bg-outline-variant/10"></div>`;
      html += `</div>`;
      html += `<div class="flex-1 relative">`;
      html += `<div class="draw-canvas-bg"></div>`;
      html += `<canvas class="draw-canvas" data-hour="${h}"></canvas>`;
      html += `</div>`;
      html += `<div class="absolute bottom-0 left-0 right-0 h-px bg-outline-variant/15"></div>`;
      html += `</div>`;
    }

    dayGrid.innerHTML = html;

    const canvasInstances = [];
    dayGrid.querySelectorAll('.draw-canvas').forEach(canvas => {
      const h = parseInt(canvas.dataset.hour);
      const inst = initCanvas(canvas, h, dateStr);
      canvasInstances.push(inst);
    });

    // Circle area click → detect Y to toggle done
    dayGrid.querySelectorAll('.draw-circles').forEach(area => {
      area.addEventListener('click', (e) => {
        const slot = area.closest('.time-slot');
        if (!slot) return;
        const rect = area.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const idx = y < rect.height / 3 ? 0 : y < rect.height * 2 / 3 ? 1 : 2;
        const h = parseInt(slot.querySelector('.draw-canvas').dataset.hour);
        if (canvasInstances[h]) canvasInstances[h].toggleDone(idx);
      });
    });

    // Clear all button
    const clearBtn = document.getElementById('clear-day-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (confirm('Limpar todos os desenhos do dia?')) {
          canvasInstances.forEach(inst => inst.clear());
        }
      });
    }

    // Current time indicator + scroll to current time
    if (dateStr === '2026-06-22') {
      const brasilia = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', hour: 'numeric', minute: 'numeric', hour12: false }).format(new Date()).split(':').map(Number);
      const hour = brasilia[0];
      const min = brasilia[1];
      const slot = dayGrid.querySelector(`.draw-canvas[data-hour="${hour}"]`)?.closest('.time-slot');
      if (slot) {
        const indicator = document.createElement('div');
        indicator.className = 'current-time-indicator';
        indicator.style.top = `${(min / 60) * 80}px`;
        slot.querySelector('.flex-1').appendChild(indicator);
        const parent = dayGrid.closest('.overflow-auto');
        if (parent) {
          const slotTop = slot.offsetTop + (min / 60) * 80;
          const scrollTo = slotTop - parent.clientHeight / 3;
          parent.scrollTo({ top: Math.max(0, scrollTo), behavior: 'smooth' });
        }
      }
    } else {
      // Scroll to the first written hour, or noon as default
      let targetHour = 12;
      for (let h = 0; h < 24; h++) {
        const data = drawingStore[`${dateStr}-${h}`];
        if (data?.written?.some(Boolean)) { targetHour = h; break; }
      }
      const slot = dayGrid.querySelector(`.draw-canvas[data-hour="${targetHour}"]`)?.closest('.time-slot');
      if (slot) {
        const parent = dayGrid.closest('.overflow-auto');
        if (parent) {
          const scrollTo = slot.offsetTop - parent.clientHeight / 3;
          parent.scrollTo({ top: Math.max(0, scrollTo), behavior: 'smooth' });
        }
      }
    }

    const highlightKey = `${dateStr}-highlight`;
    if (!highlightCanvasInited) {
      const el = document.getElementById('highlight-canvas');
      if (el) {
        highlightInstance = initCanvas(el, -1, dateStr);
        highlightInstance.reload(highlightKey);
        highlightCanvasInited = true;
      }
    } else if (highlightInstance) {
      highlightInstance.reload(highlightKey);
    }

    // Zoom controls
    dayGrid.style.transition = 'transform 0.15s ease';

    function applyZoom(level) {
      zoomLevel = Math.min(3, Math.max(0.5, level));
      dayGrid.style.transform = `scale(${zoomLevel})`;
      const lbl = document.getElementById('zoom-label');
      if (lbl) lbl.textContent = `${Math.round(zoomLevel * 100)}%`;
    }

    const zoomIn = document.getElementById('zoom-in');
    const zoomOut = document.getElementById('zoom-out');
    if (zoomIn) zoomIn.addEventListener('click', () => applyZoom(zoomLevel + 0.25));
    if (zoomOut) zoomOut.addEventListener('click', () => applyZoom(zoomLevel - 0.25));

    applyZoom(zoomLevel);
  }

  // --- Year View ---
  function renderYear() {
    const d = App.getState().currentDate;
    const year = d.getFullYear();

    let html = '';
    for (let m = 0; m < 12; m++) {
      const daysInMonth = App.getDaysInMonth(year, m);
      const firstDay = App.getFirstDayOfMonth(year, m);
      const events = App.getEventsForMonth(year, m);

      html += `<div class="year-month-card" data-month="${m}" data-year="${year}">`;
      html += `<div class="font-headline-sm text-[12px] text-primary mb-1">${App.getShortMonthName(m)}</div>`;
      html += `<div class="grid grid-cols-7 gap-0 text-[7px]">`;
      ['D','S','T','Q','Q','S','S'].forEach(day => {
        html += `<span class="text-center text-[6px] text-secondary font-semibold">${day}</span>`;
      });
      for (let i = 0; i < firstDay; i++) {
        html += `<span></span>`;
      }
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const isToday = dateStr === '2026-06-22';
        html += `<span class="text-center text-[7px] ${isToday ? 'bg-primary text-white rounded-full' : ''} ${events.some(e => e.date === dateStr) ? 'font-bold text-primary' : ''}">${day}</span>`;
      }
      html += `</div>`;
      html += `</div>`;
    }
    yearGrid.innerHTML = html;

    yearGrid.querySelectorAll('.year-month-card').forEach(card => {
      card.addEventListener('click', () => {
        const month = parseInt(card.dataset.month);
        const year = parseInt(card.dataset.year);
        App.setState({ currentDate: new Date(year, month, 1) });
        switchView('month');
      });
    });
  }

  // --- Notes ---
  function renderNotes() {
    const notes = App.getState().notes;
    if (notes.length === 0) {
      notesList.innerHTML = `<div class="text-center text-on-surface-variant/40 py-12 font-body-md">Nenhuma nota ainda. Toque em + para criar.</div>`;
      return;
    }
    let html = '';
    notes.forEach(note => {
      const preview = note.content.substring(0, 100);
      html += `<div class="note-card" data-note-id="${note.id}">`;
      html += `<div class="font-headline-sm text-[16px] text-primary mb-1">${note.title || 'Sem título'}</div>`;
      html += `<div class="font-body-sm text-on-surface-variant line-clamp-2">${preview}</div>`;
      html += `<div class="text-[10px] text-on-surface-variant/40 mt-2">${new Date(note.createdAt).toLocaleDateString('pt-BR')}</div>`;
      html += `</div>`;
    });
    notesList.innerHTML = html;

    notesList.querySelectorAll('.note-card').forEach(card => {
      card.addEventListener('click', () => {
        const note = App.getState().notes.find(n => n.id === card.dataset.noteId);
        if (note) openNotesEditor(note);
      });
    });
  }

  function openNotesEditor(note) {
    editingNoteId = note ? note.id : null;
    notesBackBtn.classList.remove('hidden');
    notesDeleteBtn.classList.remove('hidden');
    notesEditor.classList.remove('hidden');
    notesList.classList.add('hidden');
    notesEditorTitle.value = note ? note.title : '';
    notesEditorArea.value = note ? note.content : '';
    notesEditorTitle.focus();
  }

  function closeNotesEditor() {
    notesBackBtn.classList.add('hidden');
    notesDeleteBtn.classList.add('hidden');
    notesEditor.classList.add('hidden');
    notesList.classList.remove('hidden');
    editingNoteId = null;
    renderNotes();
  }

  function saveCurrentNote() {
    const title = notesEditorTitle.value.trim();
    const content = notesEditorArea.value.trim();
    if (!title && !content) return;
    if (editingNoteId) {
      App.updateNote(editingNoteId, { title, content });
    } else {
      App.addNote({ title, content });
    }
  }

  notesEditorArea.addEventListener('blur', saveCurrentNote);
  notesEditorTitle.addEventListener('blur', saveCurrentNote);

  notesBackBtn.addEventListener('click', () => {
    saveCurrentNote();
    closeNotesEditor();
  });

  notesDeleteBtn.addEventListener('click', () => {
    if (editingNoteId) {
      App.deleteNote(editingNoteId);
    }
    closeNotesEditor();
  });

  // --- Sidebar Day Info ---
  function updateDaySidebar() {
    if (!sidebarDayName || !sidebarDayNumber || !sidebarDayMonth) return;
    const d = App.getState().currentDate;
    sidebarDayName.textContent = App.getFullDayName(d.getDay());
    sidebarDayNumber.textContent = d.getDate();
    sidebarDayMonth.textContent = `${App.getMonthName(d.getMonth()).toUpperCase()} ${d.getFullYear()}`;
  }

  // --- Sidebar Next Event ---
  function updateNextEvent() {
    const today = '2026-06-22';
    const todayEvents = App.getEventsForDate(today);
    const sorted = todayEvents.sort((a, b) => {
      if (!a.startTime) return 1;
      if (!b.startTime) return -1;
      return a.startTime.localeCompare(b.startTime);
    });
    const next = sorted.find(e => !e.completed) || todayEvents[0];
    if (next) {
      sidebarNextEvent.innerHTML = `
        <h3 class="font-label-mono text-[10px] text-secondary mb-1 tracking-widest uppercase">Próximo evento</h3>
        <p class="font-body-sm font-semibold text-on-surface">${next.title}</p>
        <p class="font-body-sm text-secondary text-[12px]">${next.startTime || 'Dia inteiro'}${next.endTime ? ' — ' + next.endTime : ''}</p>
      `;
    } else {
      sidebarNextEvent.innerHTML = `
        <h3 class="font-label-mono text-[10px] text-secondary mb-1 tracking-widest uppercase">Próximo evento</h3>
        <p class="font-body-sm text-on-surface-variant/60">Nenhum evento hoje</p>
      `;
    }
  }

  // --- Detail Overlay ---
  function showDetail(evt) {
    const dayNames = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const d = new Date(evt.date);
    const dayName = dayNames[d.getDay()];
    const dateStr = `${dayName}, ${d.getDate()} de ${App.getMonthName(d.getMonth())}`;

    let tasksHtml = '';
    if (evt.tasks && evt.tasks.length > 0) {
      tasksHtml = `<div class="bg-surface-container-low p-4 rounded-xl">
        <h5 class="font-label-mono text-[11px] text-secondary mb-3 tracking-widest uppercase">Lista de tarefas</h5>
        <ul class="space-y-2">`;
      evt.tasks.forEach(task => {
        tasksHtml += `<li class="flex items-center gap-3">
          <div class="w-5 h-5 rounded-full border-2 ${task.completed ? 'bg-primary border-primary' : 'border-outline-variant'} flex items-center justify-center shrink-0 cursor-pointer" data-task-id="${task.id}">`;
        if (task.completed) {
          tasksHtml += `<span class="material-symbols-outlined text-[14px] text-white" style="font-variation-settings:'FILL' 1">check</span>`;
        }
        tasksHtml += `</div>
          <span class="font-body-sm ${task.completed ? 'line-through text-secondary' : 'text-on-surface'}">${task.text}</span>
        </li>`;
      });
      tasksHtml += `</ul></div>`;
    }

    detailContent.innerHTML = `
      <div class="bg-surface border border-outline-variant shadow-2xl rounded-2xl w-full max-w-lg overflow-hidden">
        <div class="p-6 border-b border-outline-variant flex justify-between items-start">
          <div>
            <h3 class="font-headline-lg text-[22px] text-on-surface">${dateStr}</h3>
            <p class="font-body-md text-secondary">${evt.title}</p>
          </div>
          <button class="p-2 hover:bg-surface-container rounded-full" id="detail-close">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        <div class="p-6 space-y-6">
          <div class="flex gap-4">
            <div class="w-1 bg-primary rounded-full"></div>
            <div>
              ${evt.startTime ? `<p class="font-label-mono text-[12px] text-primary">${evt.startTime}${evt.endTime ? ' — ' + evt.endTime : ''}</p>` : ''}
              <h4 class="font-headline-sm text-[18px] text-on-surface mt-1">${evt.title}</h4>
              ${evt.description ? `<p class="font-body-md text-secondary mt-2">${evt.description}</p>` : ''}
            </div>
          </div>
          ${tasksHtml}
        </div>
        <div class="p-6 bg-surface-container-lowest flex gap-3 border-t border-outline-variant">
          <button class="flex-1 py-2 bg-primary text-on-primary rounded-lg font-semibold font-body-sm" id="detail-edit">Editar</button>
          <button class="flex-1 py-2 border border-outline text-on-surface rounded-lg font-semibold font-body-sm" id="detail-delete">Excluir</button>
        </div>
      </div>
    `;

    detailOverlay.classList.remove('hidden');
    detailOverlay.classList.add('flex');

    document.getElementById('detail-close').addEventListener('click', closeDetail);
    document.getElementById('detail-delete').addEventListener('click', () => {
      App.deleteEvent(evt.id);
      closeDetail();
      if (App.getState().currentView === 'month') renderMonth();
      else if (App.getState().currentView === 'day') renderDay();
      else if (App.getState().currentView === 'week') renderWeek();
      updateNextEvent();
    });
    document.getElementById('detail-edit').addEventListener('click', () => {
      // Simple inline edit
      const newTitle = prompt('Editar título:', evt.title);
      if (newTitle && newTitle !== evt.title) {
        App.updateEvent(evt.id, { title: newTitle });
        closeDetail();
        if (App.getState().currentView === 'month') renderMonth();
        else if (App.getState().currentView === 'day') renderDay();
        else if (App.getState().currentView === 'week') renderWeek();
        updateNextEvent();
      }
    });
  }

  function showEmptyDay(dateStr) {
    const d = new Date(dateStr);
    const dayNames = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const dayName = dayNames[d.getDay()];

    detailContent.innerHTML = `
      <div class="bg-surface border border-outline-variant shadow-2xl rounded-2xl w-full max-w-lg overflow-hidden">
        <div class="p-6 border-b border-outline-variant flex justify-between items-start">
          <div>
            <h3 class="font-headline-lg text-[22px] text-on-surface">${dayName}, ${d.getDate()}</h3>
            <p class="font-body-md text-secondary">${App.getMonthName(d.getMonth())} ${d.getFullYear()}</p>
          </div>
          <button class="p-2 hover:bg-surface-container rounded-full" id="detail-close">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        <div class="p-12 text-center">
          <span class="material-symbols-outlined text-4xl text-outline-variant mb-4">event_busy</span>
          <p class="font-body-md text-on-surface-variant/60">Nenhum evento neste dia</p>
          <button class="mt-4 px-6 py-2 bg-primary text-on-primary rounded-lg font-semibold font-body-sm" id="detail-add-event">Adicionar evento</button>
        </div>
      </div>
    `;

    detailOverlay.classList.remove('hidden');
    detailOverlay.classList.add('flex');

    document.getElementById('detail-close').addEventListener('click', closeDetail);
    document.getElementById('detail-add-event').addEventListener('click', () => {
      const title = prompt('Título do evento:');
      if (title) {
        App.addEvent({
          title,
          date: dateStr,
          startTime: '12:00',
          endTime: '13:00',
          description: '',
          color: '#0459c5',
          completed: false,
          tasks: []
        });
        closeDetail();
        if (App.getState().currentView === 'month') renderMonth();
        updateNextEvent();
      }
    });
  }

  function closeDetail() {
    detailOverlay.classList.add('hidden');
    detailOverlay.classList.remove('flex');
  }

  detailOverlay.addEventListener('click', (e) => {
    if (e.target === detailOverlay) closeDetail();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDetail();
  });

  // --- FAB ---
  fab.addEventListener('click', () => {
    const view = App.getState().currentView;
    if (view === 'notes') {
      openNotesEditor(null);
    } else {
      const today = App.formatDate(App.getState().currentDate);
      const title = prompt('Novo evento:');
      if (title) {
        App.addEvent({
          title,
          date: today,
          startTime: '12:00',
          endTime: '13:00',
          description: '',
          color: '#0459c5',
          completed: false,
          tasks: []
        });
        if (view === 'month') renderMonth();
        else if (view === 'day') renderDay();
        else if (view === 'week') renderWeek();
        updateNextEvent();
      }
    }
  });

  // --- Init ---
  // Register service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js');
  }

  switchView('month');
});
