(function(){
  const monthNames = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
  const MAX_PAST_EVENTS = 10;
  
  function parseYMD(s){
    if(!s) return null;
    const value = String(s).trim();
    const ymdMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if(ymdMatch){
      const y = Number(ymdMatch[1]);
      const m = Number(ymdMatch[2]);
      const d = Number(ymdMatch[3]);
      return new Date(y, m - 1, d);
    }
    const parsed = new Date(value);
    if(Number.isNaN(parsed.getTime())) return null;
    return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  }
  
  function fmtDate(d){
    return d.getDate() + '. ' + monthNames[d.getMonth()] + ' ' + d.getFullYear();
  }
  
  function fmtRange(start, end){
    const s = parseYMD(start);
    const e = parseYMD(end);
    if(!s) return '';
    if(!e || s.getTime() === e.getTime()) return fmtDate(s);
    if(s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()){
      return s.getDate() + '. – ' + e.getDate() + '. ' + monthNames[s.getMonth()] + ' ' + s.getFullYear();
    }
    return fmtDate(s) + ' – ' + fmtDate(e);
  }

  function eventEndDate(event){
    return parseYMD(event.end || event.start);
  }

  function clamp(value, min, max){
    return Math.min(max, Math.max(min, value));
  }
  
  function buildEventsList(container){
    const dataEl = container.querySelector('[data-events]');
    if(!dataEl) return;
    
    let data;
    try { data = JSON.parse(dataEl.textContent || '{}'); } catch(err) { return; }
    
    const events = data.events || [];
    if(!events.length){
      container.innerHTML = '<div class="no-events">Keine Einträge vorhanden.</div>';
      return;
    }
    
    events.sort((a, b) => {
      const da = parseYMD(a.start);
      const db = parseYMD(b.start);
      return da - db;
    });
    
    const typeLabels = {
      parent: 'Elterntermin',
      family: 'Familienveranstaltung',
      child: 'Kinderaktion',
      closure: 'Schließzeit'
    };
    
    const now = new Date();
    now.setHours(0,0,0,0);
    
    const futureEvents = events.filter(e => {
      const end = eventEndDate(e);
      return end >= now;
    });
    
    const pastEvents = events
      .filter(e => {
        const end = eventEndDate(e);
        return end < now;
      })
      .sort((a, b) => eventEndDate(b) - eventEndDate(a))
      .slice(0, MAX_PAST_EVENTS);
    
    function renderEvents(list, title, options = {}){
      if(!list.length) return '';

      const isPast = !!options.isPast;
      const stepCount = Math.max(list.length - 1, 1);
      
      const items = list.map((e, index) => {
        const s = parseYMD(e.start);
        const type = e.type || 'parent';
        const fade = isPast ? clamp(1 - (index / stepCount) * 0.45, 0.55, 1) : 1;
        return `
          <div class="event-item${isPast ? ' is-past' : ''}" data-type="${type}" style="--past-fade:${fade.toFixed(2)}">
            <div class="event-date">
              <div class="day">${s.getDate()}</div>
              <div class="month">${monthNames[s.getMonth()]}</div>
            </div>
            <div class="event-content">
              <div class="event-title">${e.label}</div>
              <div class="event-duration">${fmtRange(e.start, e.end || e.start)}</div>
            </div>
            <span class="event-type ${type}">${typeLabels[type] || 'Eintrag'}</span>
          </div>
        `;
      }).join('');
      
      return `
        <div class="events-section">
          ${title ? `<h3 class="text-lg font-semibold mb-3">${title}</h3>` : ''}
          ${isPast ? `<p class="events-note">Nur die letzten ${MAX_PAST_EVENTS} vergangenen Einträge, von neu nach alt zunehmend abgeschwächt.</p>` : ''}
          <div class="events-list">${items}</div>
        </div>
      `;
    }
    
    container.innerHTML = `
        <div class="events-header">
          <div class="events-filter">
            <button class="filter-btn active" data-filter="all">Alle</button>
          <button class="filter-btn" data-filter="parent">Elterntermine</button>
          <button class="filter-btn" data-filter="family">Familienveranstaltungen</button>
          <button class="filter-btn" data-filter="child">Kinderaktionen</button>
          <button class="filter-btn" data-filter="closure">Schließzeiten</button>
        </div>
      </div>
      ${renderEvents(futureEvents, 'Kommende Einträge')}
      ${pastEvents.length ? renderEvents(pastEvents, 'Vergangene Einträge', { isPast: true }) : ''}
    `;
    
    container.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const filter = btn.dataset.filter;
        container.querySelectorAll('.event-item').forEach(item => {
          if(filter === 'all' || item.dataset.type === filter){
            item.style.display = '';
          } else {
            item.style.display = 'none';
          }
        });
      });
    });
  }
  
  function init(){
    document.querySelectorAll('[data-events-list]').forEach(buildEventsList);
  }
  
  document.addEventListener('astro:page-load', init);
})();
