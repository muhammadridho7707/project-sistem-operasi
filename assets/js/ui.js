const PAL = ['#A9C5A0','#E2C58F','#9CB8C4','#D9A89A','#C2B1D6','#B7CF8E','#E8B98A','#8FC1B5','#CFC39A','#D6A7C0'];
const colorOf = n => n === 'Idle' ? '#B9B4A8' : PAL[(parseInt(n.slice(1)) - 1) % PAL.length];
const f2 = x => Number.isInteger(x) ? x : x.toFixed(2);

function table(head, rows) {
  const t = document.createElement('table');
  const mk = (tag, cells) => { const tr = document.createElement('tr'); cells.forEach(c => { const e = document.createElement(tag); e.textContent = c; tr.append(e); }); return tr; };
  t.append(mk('th', head)); rows.forEach(r => t.append(mk('td', r))); return t;
}
function gantt(el, segs) {
  el.replaceChildren();
  if (!segs.length) { el.textContent = 'Belum ada langkah dijalankan.'; return; }
  const g = document.createElement('div'); g.className = 'gantt';
  segs.forEach((s, i) => {
    const b = document.createElement('div'); b.className = 'blk';
    b.style.width = (s.e - s.s) * 40 + 'px'; b.style.background = colorOf(s.id);
    b.textContent = s.id === 'Idle' ? 'Idle' : s.id;
    const a = document.createElement('span'); a.textContent = s.s; b.append(a);
    if (i === segs.length - 1) { const z = document.createElement('span'); z.className = 'end'; z.textContent = s.e; b.append(z); }
    g.append(b);
  });
  el.append(g);
}
function chips(names) {
  const w = document.createDocumentFragment();
  if (!names.length) { w.append('(kosong)'); return w; }
  names.forEach(n => { const c = document.createElement('span'); c.className = 'chip'; c.style.background = colorOf(n); c.textContent = n; w.append(c); });
  return w;
}
function renderResult(res, q) {
  const ti = table(['Proses', 'AT', 'BT'], res.rows.map(r => [r.name, r.at, r.bt]));
  ti.createCaption().textContent = `Time quantum = ${q}`;
  document.querySelector('#t-in').replaceChildren(ti);
  gantt(document.querySelector('#gantt'), res.segs);
  document.querySelector('#t-out').replaceChildren(table(['Proses','AT','BT','ST','CT','TAT','WT','RT'], res.rows.map(r => [r.name, r.at, r.bt, r.st, r.ct, r.tat, r.wt, r.rt])));
  const a = document.querySelector('#avg'); a.replaceChildren();
  [['AWT', res.awt], ['ATAT', res.atat], ['Avg RT', res.art]].forEach(([l, v]) => {
    const d = document.createElement('div'); d.className = 'card text-center'; d.textContent = `${l} = ${f2(v)}`; a.append(d);
  });
}