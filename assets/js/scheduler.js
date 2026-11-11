// Algoritma Round Robin (fungsi murni, tanpa DOM)
function roundRobin(list, q) {
  const P = list.map((p, i) => ({ ...p, i, rem: p.bt })).sort((a, b) => a.at - b.at || a.i - b.i);
  const segs = [], queue = [];
  let t = 0, k = 0, done = 0;
  const snap = () => Object.fromEntries(P.map(p => [p.name, p.rem]));
  const arrive = () => { while (k < P.length && P[k].at <= t) queue.push(P[k++]); };
  arrive();
  while (done < P.length) {
    if (!queue.length) {            // CPU idle sampai proses berikutnya tiba
      const nt = P[k].at;
      segs.push({ id: 'Idle', s: t, e: nt, rq: [], rem: snap(), note: `CPU idle sampai t=${nt}` });
      t = nt; arrive(); continue;
    }
    const p = queue.shift();
    if (p.st === undefined) p.st = t;
    const s = t, r = Math.min(q, p.rem);
    t += r; p.rem -= r;
    arrive();                        // yang baru tiba masuk queue lebih dulu
    if (p.rem > 0) queue.push(p); else { p.ct = t; done++; }
    segs.push({ id: p.name, s, e: t, rq: queue.map(x => x.name), rem: snap(),
      note: `${p.name} berjalan t=${s}–${t}, ${p.rem > 0 ? `sisa BT ${p.rem}, kembali ke queue` : 'selesai'}` });
  }
  const rows = P.sort((a, b) => a.i - b.i).map(p => {
    const tat = p.ct - p.at; return { name: p.name, at: p.at, bt: p.bt, st: p.st, ct: p.ct, tat, wt: tat - p.bt, rt: p.st - p.at };
  });
  const avg = key => rows.reduce((a, r) => a + r[key], 0) / rows.length;
  return { segs, rows, awt: avg('wt'), atat: avg('tat'), art: avg('rt') };
}