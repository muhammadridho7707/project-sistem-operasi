const $ = s => document.querySelector(s);
const store = { get: k => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch {} } };

// ===== Modal =====
let openModal = null;
function open(id) { openModal = $('#' + id); openModal.classList.remove('off'); openModal.querySelector('button').focus(); }
function close() {
  if (!openModal) return;
  if (openModal.id === 'm-guide' && $('#hide').checked) store.set('rr-hide', '1');
  openModal.classList.add('off'); openModal = null;
}
document.querySelectorAll('[data-open]').forEach(b => b.onclick = () => { open(b.dataset.open); $('#menu').classList.add('hidden'); });
document.querySelectorAll('[data-close]').forEach(b => b.onclick = close);
document.querySelectorAll('.modal').forEach(m => m.onclick = e => { if (e.target === m) close(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
if (!store.get('rr-hide')) open('m-guide');

// ===== Navbar & tema =====
$('#burger').onclick = () => { const m = $('#menu'); const h = m.classList.toggle('hidden'); $('#burger').setAttribute('aria-expanded', !h); };
$('#menu').querySelectorAll('a').forEach(a => a.onclick = () => $('#menu').classList.add('hidden'));
$('#theme').onclick = () => { const d = document.documentElement.classList.toggle('dark'); store.set('rr-theme', d ? 'dark' : 'light'); };

// ===== Form =====
function makeInputs(vals) {
  const n = +$('#n').value;
  if (!Number.isInteger(n) || n < 1 || n > 10) { $('#err').textContent = 'Jumlah proses harus bilangan bulat 1–10.'; return; }
  $('#err').textContent = '';
  const t = document.createElement('table');
  t.innerHTML = '<tr><th>Proses</th><th>AT</th><th>BT</th></tr>';
  for (let i = 1; i <= n; i++) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>P${i}</td><td><input class="inp at" type="number" min="0" aria-label="AT P${i}"></td><td><input class="inp bt" type="number" min="1" aria-label="BT P${i}"></td>`;
    t.append(tr);
  }
  $('#inputs').replaceChildren(t); $('#actions').classList.remove('hidden');
  if (vals) vals.forEach((v, i) => { if (i < n) { t.querySelectorAll('.at')[i].value = v[0]; t.querySelectorAll('.bt')[i].value = v[1]; } });
}
$('#make').onclick = () => makeInputs();
$('#sample').onclick = () => { $('#n').value = 4; $('#q').value = 2; makeInputs([[0,5],[1,3],[2,1],[3,2]]); };
$('#sample2').onclick = () => { $('#n').value = 4; $('#q').value = 2; makeInputs([[0,3],[1,2],[10,2],[12,1]]); };
$('#reset').onclick = () => { $('#inputs').replaceChildren(); $('#actions').classList.add('hidden'); $('#result').classList.add('hidden'); $('#err').textContent = ''; stop(); };

function hitung() {
  if (typeof roundRobin === 'undefined') { $('#err').textContent = 'File assets/js/scheduler.js tidak termuat. Cek nama file dan lokasinya.'; return; }
  if (typeof renderResult === 'undefined') { $('#err').textContent = 'File assets/js/ui.js tidak termuat. Cek apakah file ini ada di folder assets/js/.'; return; }
  let ok = true; const q = Number($('#q').value);
  const qOk = $('#q').value !== '' && Number.isInteger(q) && q >= 1;
  $('#q').classList.toggle('bad', !qOk); if (!qOk) ok = false;
  const ats = [...document.querySelectorAll('.at')], bts = [...document.querySelectorAll('.bt')];
  if (!ats.length) { $('#err').textContent = 'Klik "Buat tabel input" dulu.'; return; }
  const check = (el, min) => { const v = Number(el.value); const g = el.value.trim() !== '' && Number.isInteger(v) && v >= min; el.classList.toggle('bad', !g); if (!g) ok = false; return v; };
  const list = ats.map((a, i) => ({ name: 'P' + (i + 1), at: check(a, 0), bt: check(bts[i], 1) }));
  if (!ok) { $('#err').textContent = 'Periksa kolom merah: AT harus bilangan bulat ≥ 0, BT dan quantum bilangan bulat ≥ 1.'; return; }
  $('#err').textContent = '';
  const res = roundRobin(list, q);
  renderResult(res, q); startSim(res);
  $('#result').classList.remove('hidden');
  try { $('#result').scrollIntoView({ behavior: 'smooth' }); } catch (e) {}
}
$('#calc').addEventListener('click', () => { try { hitung(); } catch (e) { console.error(e); $('#err').textContent = 'Terjadi kesalahan: ' + e.message; } });

// ===== Simulasi step-by-step =====
let SIM = null, step = 0, timer = null;
function startSim(res) { SIM = res; stop(); step = 0; drawSim(); }
function drawSim() {
  const sg = SIM.segs, cur = sg[step - 1];
  gantt($('#sim-gantt'), sg.slice(0, step));
  const info = $('#sim-info'); info.replaceChildren();
  info.append(`Waktu: t=${cur ? cur.e : 0} · Langkah ${step}/${sg.length} · Ready queue: `, chips(cur ? cur.rq : []));
  if (cur) { const r = document.createElement('div'); r.append('Sisa BT: ', ...Object.entries(cur.rem).map(([k, v]) => `${k}=${v} `)); info.append(r); }
  const log = $('#sim-log'); log.replaceChildren();
  sg.slice(0, step).forEach(s => { const li = document.createElement('li'); li.textContent = s.note; log.append(li); });
  log.scrollTop = log.scrollHeight;
  $('#s-play').textContent = timer ? '⏸ Pause' : '▶ Play';
}
function stop() { clearInterval(timer); timer = null; }
const go = d => { step = Math.max(0, Math.min(SIM.segs.length, step + d)); if (step === SIM.segs.length) stop(); drawSim(); };
$('#s-next').onclick = () => { stop(); go(1); };
$('#s-prev').onclick = () => { stop(); go(-1); };
$('#s-reset').onclick = () => { stop(); step = 0; drawSim(); };
$('#s-play').onclick = () => {
  if (timer) { stop(); drawSim(); return; }
  if (step >= SIM.segs.length) step = 0;
  timer = setInterval(() => go(1), +$('#s-speed').max + 200 - +$('#s-speed').value); go(1);
};

// ===== Kuis =====
const QZ = [
  ['Round Robin termasuk algoritma…', ['Non-preemptive', 'Preemptive', 'Berbasis prioritas'], 1],
  ['Jika quantum jauh lebih besar dari semua BT, hasil RR mirip…', ['FCFS', 'SJF', 'Priority'], 0],
  ['Rumus waiting time (WT) adalah…', ['CT − AT', 'TAT − BT', 'ST − AT'], 1],
  ['Quantum terlalu kecil menyebabkan…', ['Starvation', 'Banyak context switch', 'CPU selalu idle'], 1]
];
let qi = 0, score = 0;
function drawQuiz() {
  const box = $('#quiz'); box.replaceChildren();
  if (qi >= QZ.length) {
    const p = document.createElement('p'); p.textContent = `Skor kamu: ${score}/${QZ.length}`; const b = document.createElement('button');
    b.className = 'btn mt-3'; b.textContent = 'Ulangi kuis'; b.onclick = () => { qi = 0; score = 0; drawQuiz(); }; box.append(p, b); return;
  }
  const [q, opts, ans] = QZ[qi]; const h = document.createElement('p'); h.className = 'font-bold'; h.textContent = `${qi + 1}. ${q}`; box.append(h);
  opts.forEach((o, i) => {
    const b = document.createElement('button'); b.className = 'opt'; b.textContent = o;
    b.onclick = () => {
      box.querySelectorAll('.opt').forEach((x, j) => { x.disabled = true; if (j === ans) x.classList.add('ok'); });
      if (i === ans) score++; else b.classList.add('no');
      const n = document.createElement('button'); n.className = 'btn mt-3'; n.textContent = 'Lanjut'; n.onclick = () => { qi++; drawQuiz(); }; box.append(n);
    };
    box.append(b);
  });
}
drawQuiz(); makeInputs(); console.log('RR Lab: script siap');