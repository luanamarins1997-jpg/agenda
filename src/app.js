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
  const notesCanvas = $('notes-canvas');
  const notesCanvasHint = $('notes-canvas-hint');
  const notesToolsEl = $('notes-tools');
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
  const notesFab = $('notes-fab');
  const navBtns = document.querySelectorAll('.nav-btn');

  let editingNoteId = null;
  let highlightCanvasInited = false;
  let highlightInstance = null;
  let dayZoom = null;
  let penDrawing = false;
  const highlightTool = { color: '#1a1b1f', erasing: false };
  const notesTool = { color: '#1a1b1f', erasing: false };
  let notesInstance = null;
  let notesZoom = null;
  const weekTasksTool = { color: '#1a1b1f', erasing: false };
  let weekTasksPanelInst = null;
  let sidebarCollapsed = App.load('sidebarCollapsed', false);

  const weekTasksKey = (dt) => `weektasks-${App.formatDate(getWeekStart(dt))}`;


  // --- Navigation ---
  function switchView(viewName) {
    flushSave();
    App.setState({ currentView: viewName });
    [viewMonth, viewWeek, viewDay, viewYear, viewNotes].forEach(v => v.classList.remove('active'));
    navBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === viewName);
    });
    applySidebar(viewName);
    if (notesFab) {
      notesFab.classList.toggle('hidden', viewName !== 'notes');
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
  }

  navBtns.forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });

  // Painel lateral do dia: abrir/fechar
  function applySidebar(viewName) {
    const isDay = viewName === 'day';
    const reopen = document.getElementById('sidebar-reopen-btn');
    if (daySidebar) daySidebar.classList.toggle('hidden', !isDay || sidebarCollapsed);
    if (reopen) reopen.classList.toggle('hidden', !(isDay && sidebarCollapsed));
  }
  {
    const collapseBtn = document.getElementById('sidebar-collapse-btn');
    const reopenBtn = document.getElementById('sidebar-reopen-btn');
    if (collapseBtn) collapseBtn.addEventListener('click', () => {
      sidebarCollapsed = true; App.save('sidebarCollapsed', true);
      applySidebar(App.getState().currentView);
    });
    if (reopenBtn) reopenBtn.addEventListener('click', () => {
      sidebarCollapsed = false; App.save('sidebarCollapsed', false);
      applySidebar(App.getState().currentView);
      updateDaySidebar();
    });
  }

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
    App.setState({ currentDate: new Date() });
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

      const isToday = dateStr === App.getTodayStr();
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
    // Preenche toda a altura disponível, para o mês caber numa página só.
    monthGrid.style.gridTemplateRows = `repeat(${rows}, minmax(0, 1fr))`;
    monthGrid.style.maxHeight = '';

    monthGrid.querySelectorAll('.day-cell').forEach(cell => {
      const ds = cell.dataset.date;
      if (ds) {
        if (drawingStore[`${ds}-highlight`]?.strokes?.length > 0) {
          const dot = document.createElement('div');
          dot.className = 'absolute bottom-1 right-1 w-2 h-2 rounded-full bg-primary/40';
          cell.appendChild(dot);
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

  // --- Weekly Calendar (cards por tarefa, com escrita legível) ---
  function renderWeek() {
    const d = App.getState().currentDate;
    const start = getWeekStart(d);
    const todayStr = App.getTodayStr();

    // Preenche os 7 retângulos de dia (grade 4x2; o 8º é o quadro de tarefas)
    for (let i = 0; i < 7; i++) {
      const dt = new Date(start);
      dt.setDate(start.getDate() + i);
      const ds = App.formatDate(dt);
      const isToday = ds === todayStr;
      const cell = weekGrid.querySelector(`.wk-cell[data-slot="${i}"]`);
      if (!cell) continue;

      const items = [];
      const hData = drawingStore[`${ds}-highlight`];
      if (hData?.strokes?.length) items.push({ key: `${ds}-highlight`, label: 'Destaque' });
      for (let h = 0; h < 24; h++) {
        if (drawingStore[`${ds}-${h}`]?.strokes?.length) items.push({ key: `${ds}-${h}`, label: App.formatTime(h, 0) });
      }

      let inner = `<div class="wk-cell-head ${isToday ? 'wk-cell-today' : ''}">`;
      inner += `<span class="wk-dayname">${App.getDayName(dt.getDay())}</span>`;
      inner += `<span class="wk-daynum">${dt.getDate()}</span>`;
      inner += `</div>`;
      inner += `<div class="wk-cell-body" data-goto="${ds}">`;
      if (items.length) {
        items.forEach(it => {
          inner += `<div class="wk-mini">`;
          inner += `<span class="wk-mini-time">${it.label}</span>`;
          inner += `<canvas class="wk-card" data-key="${it.key}"></canvas>`;
          inner += `</div>`;
        });
      } else {
        inner += `<span class="wk-none">—</span>`;
      }
      inner += `</div>`;
      cell.className = `wk-cell wk-day-cell ${isToday ? 'wk-cell-is-today' : ''}`;
      cell.innerHTML = inner;
    }

    // Desenha as miniaturas
    requestAnimationFrame(() => {
      weekGrid.querySelectorAll('.wk-card').forEach(cvs => {
        const dd = drawingStore[cvs.dataset.key];
        if (dd?.strokes?.length) drawStrokesPreview(cvs, dd.strokes, { pad: { top: 5, bottom: 5, left: 8, right: 8 }, lineScale: 0.3, alignLeft: true });
      });
    });

    // Tocar no corpo de um dia abre aquele dia
    weekGrid.querySelectorAll('.wk-cell-body[data-goto]').forEach(el => {
      el.addEventListener('click', () => {
        const p = el.dataset.goto.split('-');
        App.setState({ currentDate: new Date(parseInt(p[0]), parseInt(p[1]) - 1, parseInt(p[2])) });
        switchView('day');
      });
    });

    setupWeekTasksPanel();
  }

  // Quadro "Tarefas da semana" (editável) no topo da aba Semana, por semana
  function setupWeekTasksPanel() {
    const canvas = document.getElementById('weektasks-panel-canvas');
    if (!canvas) return;
    const hint = document.getElementById('weektasks-panel-hint');
    if (!weekTasksPanelInst) {
      weekTasksPanelInst = initCanvas(canvas, 0, 'wt', {
        tool: weekTasksTool,
        oversample: 2,
        onStroke: () => { if (hint) hint.style.display = 'none'; }
      });
      const toolsEl = document.getElementById('weektasks-panel-tools');
      if (toolsEl && !toolsEl.childElementCount) {
        toolsEl.appendChild(buildDrawTools(weekTasksTool, {
          onUndo: () => weekTasksPanelInst.undoLast(),
          onClear: () => { weekTasksPanelInst.clear(); if (hint) hint.style.display = ''; }
        }));
      }
      const toggle = document.getElementById('weektasks-toggle');
      const body = document.getElementById('weektasks-panel-body');
      if (toggle && body) {
        toggle.addEventListener('click', () => {
          const hidden = body.classList.toggle('hidden');
          toggle.querySelector('.material-symbols-outlined').textContent = hidden ? 'expand_more' : 'expand_less';
          if (!hidden) requestAnimationFrame(() => weekTasksPanelInst.redraw());
        });
      }
    }
    weekTasksPanelInst.reload(weekTasksKey(App.getState().currentDate));
    if (hint) hint.style.display = weekTasksPanelInst.hasStrokes() ? 'none' : '';
    requestAnimationFrame(() => weekTasksPanelInst.redraw());
  }

  // --- Drawing Store ---
  const STORAGE_KEY = 'drawingStore';
  const drawingStore = App.load(STORAGE_KEY, {});

  let saveTimer = null;
  function saveDrawingStore() {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      App.save(STORAGE_KEY, drawingStore);
      saveTimer = null;
    }, 100);
  }
  // Salva imediatamente ao navegar para outra view
  function flushSave() {
    if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; }
    App.save(STORAGE_KEY, drawingStore);
  }

  // Paleta de cores dos traços (usada nas barras de ferramentas)
  const PEN_COLORS = [
    { name: 'Preto', value: '#1a1b1f' },
    { name: 'Azul', value: '#0459c5' },
    { name: 'Vermelho', value: '#ba1a1a' },
    { name: 'Verde', value: '#1b873f' },
    { name: 'Laranja', value: '#e8830c' }
  ];

  // Desenha os traços (strokes) ajustados dentro de um elemento <canvas> de preview.
  // Reutilizado no mês, na semana e na lista de notas.
  function drawStrokesPreview(cvs, strokes, opts = {}) {
    if (!strokes || !strokes.length) return;
    const pad = opts.pad || { top: 4, bottom: 4, left: 4, right: 4 };
    const allPts = strokes.flat();
    if (!allPts.length) return;
    const minX = Math.min(...allPts.map(p => p.x)), maxX = Math.max(...allPts.map(p => p.x));
    const minY = Math.min(...allPts.map(p => p.y)), maxY = Math.max(...allPts.map(p => p.y));
    const rangeX = maxX - minX || 1, rangeY = maxY - minY || 1;
    const w = cvs.clientWidth, h = cvs.clientHeight;
    if (w < 10 || h < 10) return;
    const dw = w - pad.left - pad.right, dh = h - pad.top - pad.bottom;
    if (dw < 6 || dh < 6) return;
    const dpr = (window.devicePixelRatio || 1) * 2;
    cvs.width = w * dpr; cvs.height = h * dpr;
    const s = Math.min(dw / rangeX, dh / rangeY) * 0.92;
    // alignLeft: escrita encostada à esquerda (padrão de leitura), senão centralizada
    const offsetX = opts.alignLeft ? pad.left : pad.left + (dw - rangeX * s) / 2;
    const offsetY = pad.top + (dh - rangeY * s) / 2;
    const c = cvs.getContext('2d');
    c.scale(dpr, dpr);
    c.lineCap = 'round'; c.lineJoin = 'round';
    c.lineWidth = Math.max(0.8, 1.5 / s * (opts.lineScale || 0.5));
    strokes.forEach(stroke => {
      if (stroke.length < 2) return;
      c.strokeStyle = stroke.color || '#1a1b1f';
      c.beginPath();
      c.moveTo((stroke[0].x - minX) * s + offsetX, (stroke[0].y - minY) * s + offsetY);
      for (let i = 1; i < stroke.length; i++) c.lineTo((stroke[i].x - minX) * s + offsetX, (stroke[i].y - minY) * s + offsetY);
      c.stroke();
    });
  }

  // Cria uma barra de ferramentas de desenho (cores, borracha, desfazer, limpar).
  // `tool` é um objeto compartilhado { color, erasing } que os canvas leem.
  function buildDrawTools(tool, handlers = {}) {
    const bar = document.createElement('div');
    bar.className = 'draw-tools';
    const swatches = PEN_COLORS.map(col => {
      const b = document.createElement('button');
      b.className = 'draw-swatch';
      b.style.background = col.value;
      b.title = col.name;
      b.dataset.color = col.value;
      if (col.value === tool.color) b.classList.add('active');
      b.addEventListener('click', () => {
        tool.color = col.value;
        tool.erasing = false;
        bar.querySelectorAll('.draw-swatch').forEach(s => s.classList.toggle('active', s.dataset.color === col.value));
        eraserBtn.classList.remove('active');
        handlers.onColor && handlers.onColor(col.value);
      });
      return b;
    });
    const mkIcon = (icon, title) => {
      const b = document.createElement('button');
      b.className = 'draw-tool-btn';
      b.title = title;
      b.innerHTML = `<span class="material-symbols-outlined text-[18px]">${icon}</span>`;
      return b;
    };
    const eraserBtn = mkIcon('ink_eraser', 'Borracha');
    eraserBtn.addEventListener('click', () => {
      tool.erasing = !tool.erasing;
      eraserBtn.classList.toggle('active', tool.erasing);
      if (tool.erasing) bar.querySelectorAll('.draw-swatch').forEach(s => s.classList.remove('active'));
      else bar.querySelectorAll('.draw-swatch').forEach(s => s.classList.toggle('active', s.dataset.color === tool.color));
    });
    const undoBtn = mkIcon('undo', 'Desfazer');
    undoBtn.addEventListener('click', () => handlers.onUndo && handlers.onUndo());
    const clearBtn = mkIcon('delete', 'Limpar tudo');
    clearBtn.addEventListener('click', () => handlers.onClear && handlers.onClear());

    swatches.forEach(s => bar.appendChild(s));
    const sep = document.createElement('div');
    sep.className = 'draw-tools-sep';
    bar.appendChild(sep);
    bar.appendChild(eraserBtn);
    bar.appendChild(undoBtn);
    bar.appendChild(clearBtn);
    return bar;
  }

  function initCanvas(canvas, hour, dateStr, opts = {}) {
    const ctx = canvas.getContext('2d');
    const container = canvas.parentElement;
    const tool = opts.tool || { color: '#1a1b1f', erasing: false };
    const oversample = opts.oversample || 1;
    let key = `${dateStr}-${hour}`;
    let data = drawingStore[key] || { strokes: [], sectionState: [0, 0, 0], written: [false, false, false] };
    let strokes = data.strokes;
    let sectionState = data.sectionState;
    let written = data.written;
    let isDrawing = false;
    let erasing = false;
    let currentStroke = [];
    let resizeTimer;

    function getPos(e) {
      const rect = canvas.getBoundingClientRect();
      const zoom = rect.width / (canvas.clientWidth || rect.width);
      return { x: (e.clientX - rect.left) / zoom, y: (e.clientY - rect.top) / zoom, pressure: e.pressure || 0.5 };
    }

    // Apaga (remove) traços cujos pontos passem perto de `pos`.
    function eraseAt(pos, threshold = 14) {
      let changed = false;
      for (let i = strokes.length - 1; i >= 0; i--) {
        const hit = strokes[i].some(p => Math.hypot(p.x - pos.x, p.y - pos.y) <= threshold);
        if (hit) { strokes.splice(i, 1); changed = true; }
      }
      if (changed) { data.strokes = strokes; drawingStore[key] = data; saveDrawingStore(); redraw(); }
      return changed;
    }

    function redraw() {
      const dpr = (window.devicePixelRatio || 1) * (strokes.length ? oversample : 1);
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
        ctx.strokeStyle = stroke.color || '#1a1b1f';
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

      recomputeWritten();
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
      drawingStore[key] = data; saveDrawingStore();
      redraw();
    }

    function startDrawing(e) {
      if (e.pointerType === 'pen') {
        e.preventDefault();
        penDrawing = true;
        if (tool.erasing) {
          erasing = true;
          eraseAt(getPos(e));
        } else {
          isDrawing = true;
          currentStroke = [getPos(e)];
          currentStroke.color = tool.color;
        }
        try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
      }
    }

    function draw(e) {
      if (e.pointerType !== 'pen') return;
      if (erasing) { e.preventDefault(); eraseAt(getPos(e)); return; }
      if (!isDrawing) return;
      e.preventDefault();
      const pos = getPos(e);
      const last = currentStroke[currentStroke.length - 1];
      currentStroke.push({ ...pos });
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.strokeStyle = tool.color;
      ctx.lineWidth = Math.max(1.5, (pos.pressure || 0.5) * 4);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    }

    function stopDrawing(e) {
      penDrawing = false;
      try { canvas.releasePointerCapture(e.pointerId); } catch (_) {}
      if (erasing) { erasing = false; return; }
      if (!isDrawing) return;
      isDrawing = false;
      if (currentStroke.length > 1) {
        strokes.push(currentStroke);
        data = { strokes, sectionState, written };
        drawingStore[key] = data; saveDrawingStore();
        redraw();
        if (opts.onStroke) opts.onStroke(api);
      }
    }

    // Cada traço pertence a UMA linha (terço), pela altura do seu centro.
    // Usa clientHeight (espaço do próprio canvas, sem zoom) para acertar em qualquer zoom.
    function recomputeWritten() {
      written[0] = written[1] = written[2] = false;
      const h = container.clientHeight || 1;
      const t = h / 3;
      strokes.forEach(s => {
        if (!s.length) return;
        let sum = 0;
        for (const p of s) sum += p.y;
        const cy = sum / s.length;
        const idx = cy < t ? 0 : cy < 2 * t ? 1 : 2;
        written[idx] = true;
      });
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

    const api = {
      clear() {
        strokes = [];
        sectionState = [0, 0, 0];
        written = [false, false, false];
        data = { strokes, sectionState, written };
        drawingStore[key] = data;
        redraw();
      },
      toggleDone,
      undoLast() {
        if (!strokes.length) return false;
        strokes.pop();
        data.strokes = strokes;
        drawingStore[key] = data;
        redraw();
        return true;
      },
      hasStrokes() { return strokes.length > 0; },
      redraw,
      reload(newKey) {
        key = newKey;
        data = drawingStore[key] || { strokes: [], sectionState: [0, 0, 0], written: [false, false, false] };
        strokes = data.strokes;
        sectionState = data.sectionState;
        written = data.written;
        redraw();
      }
    };
    return api;
  }

  // Pan + pinch-zoom totalmente controlado em JS para a grade do dia.
  // Usamos transform: translate()+scale() (coordenadas confiaveis no Safari/iPad,
  // ao contrario de CSS `zoom`). Nada de rolagem nativa: 1 dedo move (vertical, e
  // horizontal so quando ha zoom), 2 dedos dao zoom, e a caneta desenha com a tela
  // parada porque toques de stylus sao ignorados e a rolagem nativa esta desligada.
  function setupDayZoom(viewportEl, layerEl) {
    const MIN = 1, MAX = 4;
    let z = 1, tx = 0, ty = 0;
    let mode = null;          // 'pan' | 'pinch'
    let lastX = 0, lastY = 0; // ultimo ponto do dedo (pan)
    let startDist = 0, startZ = 1, anchorX = 0, anchorY = 0;
    let vy = 0, lastT = 0, inertiaRAF = 0;

    const fingers = (e) => Array.from(e.touches).filter(t => t.touchType !== 'stylus');
    const dist = (a, b) => Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);

    function clamp() {
      const CW = viewportEl.clientWidth, CH = viewportEl.clientHeight;
      const W = layerEl.offsetWidth * z, H = layerEl.offsetHeight * z;
      // horizontal: centraliza se couber, senao prende nas bordas
      if (W <= CW) tx = (CW - W) / 2;
      else tx = Math.max(CW - W, Math.min(0, tx));
      // vertical: topo se couber, senao rola entre o topo e o fim
      if (H <= CH) ty = 0;
      else ty = Math.max(CH - H, Math.min(0, ty));
    }

    function apply() {
      clamp();
      layerEl.style.transform = `translate(${tx}px, ${ty}px) scale(${z})`;
    }

    function stopInertia() { if (inertiaRAF) { cancelAnimationFrame(inertiaRAF); inertiaRAF = 0; } }

    function inertia() {
      vy *= 0.95;
      if (Math.abs(vy) < 0.05) { inertiaRAF = 0; return; }
      const before = ty;
      ty += vy;
      apply();
      if (ty === before) { inertiaRAF = 0; return; } // bateu na borda
      inertiaRAF = requestAnimationFrame(inertia);
    }

    viewportEl.addEventListener('touchstart', (e) => {
      stopInertia();
      if (penDrawing) return;
      const f = fingers(e);
      if (f.length === 1) {
        mode = 'pan';
        lastX = f[0].clientX; lastY = f[0].clientY;
        vy = 0; lastT = e.timeStamp;
      } else if (f.length >= 2) {
        mode = 'pinch';
        startDist = dist(f[0], f[1]) || 1;
        startZ = z;
        const rect = viewportEl.getBoundingClientRect();
        const mx = (f[0].clientX + f[1].clientX) / 2 - rect.left;
        const my = (f[0].clientY + f[1].clientY) / 2 - rect.top;
        anchorX = (mx - tx) / z; // ponto do conteudo sob o centro da pinca
        anchorY = (my - ty) / z;
      }
    }, { passive: false });

    viewportEl.addEventListener('touchmove', (e) => {
      if (penDrawing) { e.preventDefault(); return; } // tela parada para escrever
      const f = fingers(e);
      if (mode === 'pan' && f.length >= 1) {
        e.preventDefault();
        const dx = f[0].clientX - lastX, dy = f[0].clientY - lastY;
        lastX = f[0].clientX; lastY = f[0].clientY;
        tx += dx; ty += dy;
        const dt = e.timeStamp - lastT; lastT = e.timeStamp;
        if (dt > 0) vy = dy / dt * 16; // px por frame (~16ms)
        apply();
      } else if (mode === 'pinch' && f.length >= 2) {
        e.preventDefault();
        let nz = startZ * (dist(f[0], f[1]) / startDist);
        nz = Math.max(MIN, Math.min(MAX, nz));
        z = nz;
        const rect = viewportEl.getBoundingClientRect();
        const mx = (f[0].clientX + f[1].clientX) / 2 - rect.left;
        const my = (f[0].clientY + f[1].clientY) / 2 - rect.top;
        tx = mx - anchorX * z; // mantem o ponto ancorado sob a pinca
        ty = my - anchorY * z;
        apply();
      }
    }, { passive: false });

    const end = (e) => {
      const f = fingers(e);
      if (f.length === 0) {
        if (mode === 'pan' && Math.abs(vy) > 0.5) { inertiaRAF = requestAnimationFrame(inertia); }
        mode = null;
      } else if (f.length === 1) {
        // saiu da pinca para um dedo: continua em pan
        mode = 'pan';
        lastX = f[0].clientX; lastY = f[0].clientY; vy = 0; lastT = e.timeStamp;
      }
    };
    viewportEl.addEventListener('touchend', end);
    viewportEl.addEventListener('touchcancel', end);

    return {
      reset() { stopInertia(); z = 1; tx = 0; ty = 0; apply(); },
      // posiciona o topo visivel em "py" (px do conteudo, escala 1)
      scrollToY(py) { stopInertia(); ty = -py * z; apply(); }
    };
  }

  // --- Daily View ---
  function renderDay() {
    const d = App.getState().currentDate;
    const dateStr = App.formatDate(d);
    const dayEvents = App.getEventsForDate(dateStr);

    let html = `<div class="day-toolbar shrink-0">
      <div id="day-tools" class="flex items-center gap-1.5"></div>
      <span class="text-[11px] text-on-surface-variant/40 font-body-sm ml-auto">Escreva com a caneta</span>
    </div>
    <div id="day-zoom-viewport" class="flex-1 relative overflow-hidden" style="touch-action:none">
    <div id="day-zoom-layer" class="absolute top-0 left-0 w-full" style="transform-origin:0 0">`;

    for (let h = 0; h < 24; h++) {
      const timeStr = App.formatTime(h, 0);
      const hourEvents = dayEvents.filter(evt => {
        if (!evt.startTime) return false;
        const evtHour = parseInt(evt.startTime.split(':')[0]);
        return evtHour === h;
      });

      const currentHour = App.isToday(d) ? parseInt(new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', hour: 'numeric', hour12: false }).format(new Date())) : -1;
      const isCurrentHour = h === currentHour;

      html += `<div class="time-slot flex relative ${isCurrentHour ? 'bg-primary/[0.02]' : ''}">`;
      html += `<div class="w-[80px] shrink-0 flex items-start justify-end py-2 pr-3 border-r border-outline-variant"><span class="font-label-mono text-[10px] text-on-surface opacity-40">${timeStr}</span></div>`;
      html += `<div class="w-[22px] shrink-0 relative">`;
      html += `<div class="draw-circles absolute inset-0 cursor-pointer">`;
      html += `<div class="circle-dot absolute w-3 h-3 rounded-full border-2 border-primary/40" style="left:5px;top:16.667%;transform:translateY(-50%)" data-idx="0"></div>`;
      html += `<div class="circle-dot absolute w-3 h-3 rounded-full border-2 border-primary/40" style="left:5px;top:50%;transform:translateY(-50%)" data-idx="1"></div>`;
      html += `<div class="circle-dot absolute w-3 h-3 rounded-full border-2 border-primary/40" style="left:5px;top:83.333%;transform:translateY(-50%)" data-idx="2"></div>`;
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

    html += `</div></div>`; // fecha #day-zoom-layer e #day-zoom-viewport

    dayGrid.innerHTML = html;

    const dayTool = { color: '#1a1b1f', erasing: false };
    const dayUndoStack = []; // ordem dos traços entre os 24 canvas, para desfazer
    const canvasInstances = [];
    dayGrid.querySelectorAll('.draw-canvas').forEach(canvas => {
      const h = parseInt(canvas.dataset.hour);
      const inst = initCanvas(canvas, h, dateStr, {
        tool: dayTool,
        oversample: 3,
        onStroke: (i) => dayUndoStack.push(i)
      });
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

    // Barra de ferramentas (cores, borracha, desfazer, limpar) do dia
    const dayToolsEl = document.getElementById('day-tools');
    if (dayToolsEl) {
      dayToolsEl.appendChild(buildDrawTools(dayTool, {
        onUndo: () => {
          while (dayUndoStack.length) {
            const inst = dayUndoStack.pop();
            if (inst.undoLast()) break;
          }
        },
        onClear: () => {
          if (confirm('Limpar todos os desenhos do dia?')) {
            canvasInstances.forEach(inst => inst.clear());
            dayUndoStack.length = 0;
          }
        }
      }));
    }

    // Pan + pinch-zoom (dedos) na grade do dia. A grade e recriada a cada render,
    // entao recriamos o controlador e o ligamos ao viewport/layer novos.
    const dayViewport = document.getElementById('day-zoom-viewport');
    const dayLayer = document.getElementById('day-zoom-layer');
    if (dayViewport && dayLayer) {
      dayZoom = setupDayZoom(dayViewport, dayLayer);
      dayZoom.reset();
    }
    const goToY = (py) => { if (dayZoom) dayZoom.scrollToY(Math.max(0, py)); };

    // Current time indicator + scroll to current time
    if (dateStr === App.getTodayStr()) {
      const brasilia = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', hour: 'numeric', minute: 'numeric', hour12: false }).format(new Date()).split(':').map(Number);
      const hour = brasilia[0];
      const min = brasilia[1];
      const slot = dayGrid.querySelector(`.draw-canvas[data-hour="${hour}"]`)?.closest('.time-slot');
      if (slot) {
        const indicator = document.createElement('div');
        indicator.className = 'current-time-indicator';
        indicator.style.top = `${(min / 60) * 80}px`;
        slot.querySelector('.flex-1').appendChild(indicator);
        if (dayViewport) {
          const slotTop = slot.offsetTop + (min / 60) * 80;
          goToY(slotTop - dayViewport.clientHeight / 3);
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
      if (slot && dayViewport) {
        goToY(slot.offsetTop - dayViewport.clientHeight / 3);
      }
    }

    const highlightKey = `${dateStr}-highlight`;
    if (!highlightCanvasInited) {
      const el = document.getElementById('highlight-canvas');
      if (el) {
        highlightInstance = initCanvas(el, -1, dateStr, { tool: highlightTool, oversample: 3 });
        highlightInstance.reload(highlightKey);
        highlightCanvasInited = true;
        const toolsEl = document.getElementById('highlight-tools');
        if (toolsEl && !toolsEl.childElementCount) {
          toolsEl.appendChild(buildDrawTools(highlightTool, {
            onUndo: () => highlightInstance.undoLast(),
            onClear: () => highlightInstance.clear()
          }));
        }
      }
    } else if (highlightInstance) {
      highlightInstance.reload(highlightKey);
    }


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

      const now = new Date();
      const isCurrentMonth = (year === now.getFullYear() && m === now.getMonth());
      html += `<div class="year-month-card${isCurrentMonth ? ' year-month-current' : ''}" data-month="${m}" data-year="${year}">`;
      html += `<div class="font-headline-sm text-[15px] ${isCurrentMonth ? 'text-primary' : 'text-on-surface'} mb-2 font-semibold text-center">${App.getMonthName(m)}</div>`;
      html += `<div class="year-days grid grid-cols-7 flex-1 place-items-center">`;
      ['D','S','T','Q','Q','S','S'].forEach((day, idx) => {
        html += `<span class="text-center text-[9px] ${idx === 0 ? 'text-error/70' : 'text-secondary'} font-semibold">${day}</span>`;
      });
      for (let i = 0; i < firstDay; i++) {
        html += `<span></span>`;
      }
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const isToday = dateStr === App.getTodayStr();
        const dow = (firstDay + day - 1) % 7;
        const base = dow === 0 ? 'text-error/80' : 'text-on-surface';
        const cls = isToday ? 'bg-primary text-white rounded-full w-5 h-5 inline-flex items-center justify-center font-semibold' : base;
        html += `<span class="text-center text-[11px] ${cls}">${day}</span>`;
      }
      html += `</div>`;
      html += `</div>`;
    }
    yearGrid.innerHTML = html;
    yearGrid.style.gridTemplateRows = 'repeat(3, minmax(0, 1fr))';

    yearGrid.querySelectorAll('.year-month-card').forEach(card => {
      card.addEventListener('click', () => {
        const month = parseInt(card.dataset.month);
        const year = parseInt(card.dataset.year);
        App.setState({ currentDate: new Date(year, month, 1) });
  switchView(App.getState().currentView);
      });
    });
  }

  // --- Notes (escritas à caneta) ---
  const noteKey = (id) => `note-${id}`;

  function renderNotes() {
    const notes = App.getState().notes;
    if (notes.length === 0) {
      notesList.innerHTML = `<div class="col-span-2 text-center text-on-surface-variant/40 py-12 font-body-md">Nenhuma nota ainda. Toque em + para escrever.</div>`;
      return;
    }
    let html = '';
    notes.forEach(note => {
      html += `<div class="note-card" data-note-id="${note.id}">`;
      html += `<div class="font-headline-sm text-[16px] text-primary mb-2 truncate">${note.title || 'Sem título'}</div>`;
      html += `<div class="note-thumb-wrap"><canvas class="note-thumb" data-key="${noteKey(note.id)}"></canvas></div>`;
      html += `<div class="text-[10px] text-on-surface-variant/40 mt-2">${new Date(note.createdAt).toLocaleDateString('pt-BR')}</div>`;
      html += `</div>`;
    });
    notesList.innerHTML = html;

    requestAnimationFrame(() => {
      notesList.querySelectorAll('.note-thumb').forEach(cvs => {
        const dd = drawingStore[cvs.dataset.key];
        if (dd?.strokes?.length) drawStrokesPreview(cvs, dd.strokes, { pad: { top: 6, bottom: 6, left: 6, right: 6 }, lineScale: 0.45 });
      });
    });

    notesList.querySelectorAll('.note-card').forEach(card => {
      card.addEventListener('click', () => {
        const note = App.getState().notes.find(n => n.id === card.dataset.noteId);
        if (note) openNotesEditor(note);
      });
    });
  }

  function openNotesEditor(note) {
    // Notas novas já são criadas para ter um id (e guardar os traços por id)
    if (!note) note = App.addNote({ title: '' });
    editingNoteId = note.id;
    notesBackBtn.classList.remove('hidden');
    notesDeleteBtn.classList.remove('hidden');
    notesEditor.classList.remove('hidden');
    notesList.classList.add('hidden');
    if (notesFab) notesFab.classList.add('hidden'); // some ao editar
    notesEditorTitle.value = note.title || '';

    if (!notesInstance) {
      notesInstance = initCanvas(notesCanvas, editingNoteId, 'note', {
        tool: notesTool,
        oversample: 2,
        onStroke: () => { if (notesCanvasHint) notesCanvasHint.style.display = 'none'; }
      });
      if (notesToolsEl && !notesToolsEl.childElementCount) {
        notesToolsEl.appendChild(buildDrawTools(notesTool, {
          onUndo: () => notesInstance.undoLast(),
          onClear: () => { notesInstance.clear(); if (notesCanvasHint) notesCanvasHint.style.display = ''; }
        }));
      }
    }
    notesInstance.reload(noteKey(editingNoteId));
    if (notesCanvasHint) notesCanvasHint.style.display = notesInstance.hasStrokes() ? 'none' : '';

    // Zoom (dois dedos) no canvas da nota — reaproveita o motor de pan/zoom do dia
    if (!notesZoom) {
      const wrap = document.getElementById('notes-canvas-wrap');
      const layer = document.getElementById('notes-zoom-layer');
      if (wrap && layer) notesZoom = setupDayZoom(wrap, layer);
    }
    if (notesZoom) notesZoom.reset();

    // Garante o redimensionamento correto agora que o editor está visível
    requestAnimationFrame(() => notesInstance.redraw());
  }

  function closeNotesEditor() {
    saveCurrentNote();
    notesBackBtn.classList.add('hidden');
    notesDeleteBtn.classList.add('hidden');
    notesEditor.classList.add('hidden');
    notesList.classList.remove('hidden');
    if (notesFab) notesFab.classList.remove('hidden'); // volta na lista
    editingNoteId = null;
    renderNotes();
  }

  function saveCurrentNote() {
    if (!editingNoteId) return;
    const title = notesEditorTitle.value.trim();
    const hasStrokes = notesInstance && notesInstance.hasStrokes();
    // Nota vazia (sem título e sem traço) é descartada
    if (!title && !hasStrokes) {
      App.deleteNote(editingNoteId);
      delete drawingStore[noteKey(editingNoteId)];
    } else {
      App.updateNote(editingNoteId, { title });
    }
  }

  notesEditorTitle.addEventListener('blur', saveCurrentNote);

  notesBackBtn.addEventListener('click', () => {
    closeNotesEditor();
  });

  notesDeleteBtn.addEventListener('click', () => {
    if (editingNoteId) {
      App.deleteNote(editingNoteId);
      delete drawingStore[noteKey(editingNoteId)];
      editingNoteId = null;
    }
    notesBackBtn.classList.add('hidden');
    notesDeleteBtn.classList.add('hidden');
    notesEditor.classList.add('hidden');
    notesList.classList.remove('hidden');
    if (notesFab) notesFab.classList.remove('hidden'); // volta na lista
    renderNotes();
  });

  notesFab.addEventListener('click', () => openNotesEditor(null));

  // --- Sidebar Day Info ---
  function updateDaySidebar() {
    if (!sidebarDayName || !sidebarDayNumber || !sidebarDayMonth) return;
    const d = App.getState().currentDate;
    sidebarDayName.textContent = App.getFullDayName(d.getDay());
    sidebarDayNumber.textContent = d.getDate();
    sidebarDayMonth.textContent = `${App.getMonthName(d.getMonth()).toUpperCase()} ${d.getFullYear()}`;

    // Prévia (somente leitura) das tarefas da semana atual
    const cvs = document.getElementById('weektasks-sidebar-canvas');
    const empty = document.getElementById('weektasks-sidebar-empty');
    if (cvs) {
      const dd = drawingStore[weekTasksKey(d)];
      const has = dd?.strokes?.length;
      if (empty) empty.style.display = has ? 'none' : '';
      const ctx = cvs.getContext('2d');
      ctx.clearRect(0, 0, cvs.width, cvs.height);
      if (has) requestAnimationFrame(() => drawStrokesPreview(cvs, dd.strokes, { pad: { top: 6, bottom: 6, left: 6, right: 6 }, lineScale: 0.6 }));
    }
  }

  // --- Sidebar Next Event ---
  function updateNextEvent() {
    const today = App.formatDate(new Date());
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
  // --- Init ---
  // Register service worker (caminho relativo: funciona na raiz ou em subpasta)
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js');
  }

  // Salva dados antes de fechar/recarregar a página
  window.addEventListener('beforeunload', flushSave);
  document.addEventListener('visibilitychange', () => { if (document.hidden) flushSave(); });

  switchView('month');
});
