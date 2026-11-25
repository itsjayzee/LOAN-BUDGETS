import { useEffect, useState, type ReactNode } from 'react';

type Lang = 'en' | 'ar' | 'ku' | 'tr';
type Dir = 'owe' | 'owed';
type Cur = 'USD' | 'IQD' | 'TRY';
type Tab = Dir | 'arch';
type Theme = '' | 'light' | 'dark';
type Dict = Record<string, string>;
interface Pay { a: number; at: number }
interface Loan { id: string; dir: Dir; cur: Cur; who: string; amt: number; paid: number; pays: Pay[]; due: number | null; note: string; created: number; done: boolean }
interface State { lang: Lang; theme: Theme; cur: Cur; tab: Tab; loans: Loan[] }
type SheetState = null | { k: 'add' } | { k: 'set' } | { k: 'pay'; id: string };


const css = `
:root{--bg:#f3f1fb;--card:#fff;--tx:#1b1740;--mut:#7b7899;--bd:#e8e5f5;--pri:#6c4cf1;--red:#ff5d73;--grn:#12b886;--amb:#f59f00;--sh:0 8px 24px rgba(80,60,160,.10);
box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#0d0b1e;--card:#171433;--tx:#f1efff;--mut:#9b97c2;--bd:#262250;--pri:#8b72ff;--sh:none;color-scheme:dark}}
:root[data-theme="dark"]{--bg:#0d0b1e;--card:#171433;--tx:#f1efff;--mut:#9b97c2;--bd:#262250;--pri:#8b72ff;--sh:none;color-scheme:dark}
html{scroll-padding-top:env(safe-area-inset-top,0px)}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--tx);font:16px/1.4 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;min-height:100vh}
.w{max-width:600px;margin:0 auto;padding:14px 16px 110px}
header{display:flex;align-items:center;gap:10px;margin-bottom:14px}
.lg{width:42px;height:42px;border-radius:14px;background:linear-gradient(135deg,#6c4cf1,#c04cf1);display:grid;place-items:center;font-size:22px}
h1{font-size:21px;margin:0;flex:1;letter-spacing:-.3px}
button{font:inherit;color:inherit;cursor:pointer}
.ib{width:42px;height:42px;border-radius:14px;border:1px solid var(--bd);background:var(--card);font-size:19px;box-shadow:var(--sh)}
.hero{border-radius:26px;padding:20px;color:#fff;background:linear-gradient(135deg,#5b3df0 0%,#9b4cf1 55%,#e04ca8 100%);box-shadow:0 14px 34px rgba(108,76,241,.38);margin-bottom:14px}
.clk{font-size:13px;opacity:.85;display:flex;justify-content:space-between;gap:8px}
.hl{font-size:13px;opacity:.8;margin-top:14px}
.hn{font-size:30px;font-weight:800;letter-spacing:-.5px;line-height:1.2}
.chips{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:16px}
.chip{background:rgba(255,255,255,.17);border-radius:16px;padding:10px 12px;backdrop-filter:blur(6px)}
.chip small{display:block;font-size:12px;opacity:.85}
.chip b{font-size:15px;line-height:1.5}
.tabs{display:flex;gap:6px;background:var(--card);border-radius:18px;padding:5px;margin-bottom:14px;box-shadow:var(--sh)}
.tabs button{flex:1;border:0;background:none;padding:10px;border-radius:14px;font-weight:700;color:var(--mut)}
.tabs .on{background:linear-gradient(135deg,#6c4cf1,#a04cf1);color:#fff}
.c{background:var(--card);border-radius:22px;padding:16px;margin-bottom:12px;box-shadow:var(--sh);border:1px solid var(--bd)}
.r{display:flex;align-items:center;gap:12px}
.av{width:46px;height:46px;border-radius:16px;display:grid;place-items:center;color:#fff;font-weight:800;font-size:19px;flex:none}
.g1{flex:1;min-width:0}
.nm{font-weight:700}
.mut{color:var(--mut);font-size:13px}
.am{font-weight:800;font-size:19px;text-align:end}
.bar{height:9px;background:var(--bd);border-radius:9px;margin:14px 0 10px;overflow:hidden}
.bar i{display:block;height:100%;border-radius:9px;background:linear-gradient(90deg,#12b886,#38d9a9)}
.meta{display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;font-size:13px;color:var(--mut)}
.bd{font-weight:700;padding:3px 10px;border-radius:20px;background:var(--bg)}
.det{margin-top:12px;padding-top:12px;border-top:1px dashed var(--bd);font-size:13px;color:var(--mut)}
.det div{display:flex;justify-content:space-between;padding:3px 0}
.acts{display:flex;gap:8px;margin-top:12px}
.b{flex:1;border:0;border-radius:14px;padding:12px;font-weight:700;background:linear-gradient(135deg,#6c4cf1,#a04cf1);color:#fff}
.b.g{background:var(--bg);color:var(--tx)}.b.d{background:var(--bg);color:var(--red)}
.em{text-align:center;color:var(--mut);padding:50px 0;font-size:15px}
.em span{font-size:44px;display:block}
.fab{position:fixed;inset-inline-end:20px;bottom:calc(20px + env(safe-area-inset-bottom,0px));width:62px;height:62px;border-radius:22px;border:0;background:linear-gradient(135deg,#6c4cf1,#e04ca8);color:#fff;font-size:32px;box-shadow:0 10px 26px rgba(160,76,241,.5)}
.ov{position:fixed;inset:0;background:rgba(10,8,30,.55);display:flex;align-items:flex-end;justify-content:center;z-index:9}
.pn{background:var(--card);width:100%;max-width:600px;max-height:92vh;overflow:auto;border-radius:28px 28px 0 0;padding:20px 18px calc(22px + env(safe-area-inset-bottom,0px))}
.pn h2{margin:0 0 6px;font-size:19px}
.pn label{display:block;font-size:13px;color:var(--mut);margin:14px 0 6px;font-weight:600}
.pn input{width:100%;font:inherit;color:inherit;background:var(--bg);border:1px solid var(--bd);border-radius:14px;padding:13px}
.sg{display:flex;gap:8px;flex-wrap:wrap}
.sg button{flex:1;min-width:30%;padding:11px 8px;border-radius:14px;border:2px solid var(--bd);background:var(--bg);font-weight:700}
.sg button.on{border-color:var(--pri);background:var(--card);color:var(--pri)}
`;

const T: Record<Lang, Dict> = {
en:{app:'Loan Budget',owe:'I owe',owed:'They owe',arch:'Archive',sOwe:'I owe',sOwed:'Owed to me',net:'Net balance',add:'New loan',who:'Person',amt:'Amount',due:'Due date & time',note:'Note',save:'Save',cancel:'Cancel',pay:'Add payment',left:'left',over:'Overdue',empty:'Nothing here yet',del:'Delete',dir:'Type',settled:'Settled',set:'Settings',lang:'Language',theme:'Theme',cur:'Currency',created:'Created',paidOn:'Payment',noDue:'No due date',auto:'Auto',light:'Light',dark:'Dark'},
ar:{app:'ميزانية القروض',owe:'عليّ',owed:'لي',arch:'الأرشيف',sOwe:'عليّ',sOwed:'مستحق لي',net:'الرصيد الصافي',add:'قرض جديد',who:'الشخص',amt:'المبلغ',due:'تاريخ ووقت الاستحقاق',note:'ملاحظة',save:'حفظ',cancel:'إلغاء',pay:'إضافة دفعة',left:'متبقي',over:'متأخر',empty:'لا يوجد شيء بعد',del:'حذف',dir:'النوع',settled:'مسدد',set:'الإعدادات',lang:'اللغة',theme:'المظهر',cur:'العملة',created:'تاريخ الإنشاء',paidOn:'دفعة',noDue:'بدون موعد',auto:'تلقائي',light:'فاتح',dark:'داكن'},
ku:{app:'بودجەی قەرز',owe:'قەرزارم',owed:'قەرزاریان',arch:'ئەرشیف',sOwe:'قەرزەکانم',sOwed:'داواکارم',net:'باڵانسی سافی',add:'قەرزی نوێ',who:'کەس',amt:'بڕ',due:'بەرواری کۆتایی و کات',note:'تێبینی',save:'پاشەکەوتکردن',cancel:'هەڵوەشاندنەوە',pay:'زیادکردنی پارەدان',left:'ماوە',over:'دواکەوتوو',empty:'هیچ نییە',del:'سڕینەوە',dir:'جۆر',settled:'تەواوکرا',set:'ڕێکخستنەکان',lang:'زمان',theme:'ڕووکار',cur:'دراو',created:'دروستکرا',paidOn:'پارەدان',noDue:'بێ بەروار',auto:'خۆکار',light:'ڕووناک',dark:'تاریک'},
tr:{app:'Borç Bütçesi',owe:'Borçluyum',owed:'Bana borçlu',arch:'Arşiv',sOwe:'Borcum',sOwed:'Alacağım',net:'Net bakiye',add:'Yeni borç',who:'Kişi',amt:'Tutar',due:'Vade tarihi ve saati',note:'Not',save:'Kaydet',cancel:'İptal',pay:'Ödeme ekle',left:'kaldı',over:'Gecikmiş',empty:'Henüz bir şey yok',del:'Sil',dir:'Tür',settled:'Ödendi',set:'Ayarlar',lang:'Dil',theme:'Tema',cur:'Para birimi',created:'Oluşturuldu',paidOn:'Ödeme',noDue:'Vade yok',auto:'Otomatik',light:'Açık',dark:'Koyu'}};
const CUR: Record<Cur, { s: string; d: number; suf?: number; n: string }> = {USD:{s:'$',d:2,n:'US Dollar'},IQD:{s:'IQD',d:0,suf:1,n:'Iraqi Dinar'},TRY:{s:'₺',d:2,n:'Turkish Lira'}};
const LN: Record<Lang, string> = {en:'English',ar:'العربية',ku:'کوردی',tr:'Türkçe'};

const DEF: State = { lang: 'en', theme: '', cur: 'IQD', tab: 'owe', loans: [] };
const loc = (l: Lang): string => (l === 'ku' ? 'ckb' : l);
const money = (n: number, c: Cur, l: Lang): string => {
  const m = CUR[c];
  let v: string;
  try { v = n.toLocaleString(loc(l), { maximumFractionDigits: m.d }); } catch { v = String(n); }
  return m.suf ? `${v} ${m.s}` : `${m.s}${v}`;
};
const dt = (ms: number, l: Lang): string => {
  try { return new Date(ms).toLocaleString(loc(l), { dateStyle: 'medium', timeStyle: 'short' }); } catch { return new Date(ms).toLocaleString(); }
};
const rem = (l: Loan): number => Math.max(0, l.amt - l.paid);
const curOpts = (): [Cur, string][] => (Object.keys(CUR) as Cur[]).map((c) => [c, c === 'IQD' ? 'IQD' : `${CUR[c].s} ${c}`]);

function Seg<V extends string>({ opts, value, onChange }: { opts: [V, string][]; value: V; onChange: (v: V) => void }) {
  return (
    <div className="sg">
      {opts.map(([v, label]) => (
        <button key={v || 'auto'} className={v === value ? 'on' : ''} onClick={() => onChange(v)}>{label}</button>
      ))}
    </div>
  );
}

function Sheet({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  return (
    <div className="ov" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="pn">{children}</div>
    </div>
  );
}

function Totals({ o, lang }: { o: Partial<Record<Cur, number>>; lang: Lang }) {
  const ks = Object.keys(o) as Cur[];
  if (!ks.length) return <>—</>;
  return <>{ks.map((c, i) => <span key={c}>{i > 0 && <br />}{money(o[c] ?? 0, c, lang)}</span>)}</>;
}

export default function LoanBudget() {
  const [S, setS] = useState<State>(() => {
    try { const r = localStorage.getItem('lb2'); return r ? { ...DEF, ...(JSON.parse(r) as Partial<State>) } : DEF; } catch { return DEF; }
  });
  const [openId, setOpenId] = useState<string | null>(null);
  const [sheet, setSheet] = useState<SheetState>(null);
  const [now, setNow] = useState<number>(Date.now());
  const up = (p: Partial<State>): void => setS((s) => ({ ...s, ...p }));
  const t = (k: string): string => T[S.lang][k] ?? T.en[k] ?? k;

  useEffect(() => { const i = setInterval(() => setNow(Date.now()), 20000); return () => clearInterval(i); }, []);
  useEffect(() => {
    try { localStorage.setItem('lb2', JSON.stringify(S)); } catch { /* ignore */ }
    const h = document.documentElement;
    h.lang = S.lang;
    h.dir = S.lang === 'ar' || S.lang === 'ku' ? 'rtl' : 'ltr';
    if (S.theme) h.setAttribute('data-theme', S.theme); else h.removeAttribute('data-theme');
  }, [S]);

  const tot = (d: Dir): Partial<Record<Cur, number>> => {
    const o: Partial<Record<Cur, number>> = {};
    S.loans.filter((l) => !l.done && l.dir === d).forEach((l) => { o[l.cur] = (o[l.cur] ?? 0) + rem(l); });
    return o;
  };
  const owe = tot('owe'), owed = tot('owed');
  const net: Partial<Record<Cur, number>> = {};
  (Object.keys(owed) as Cur[]).forEach((c) => { net[c] = (net[c] ?? 0) + (owed[c] ?? 0); });
  (Object.keys(owe) as Cur[]).forEach((c) => { net[c] = (net[c] ?? 0) - (owe[c] ?? 0); });
  const netKeys = Object.keys(net) as Cur[];

  const rows = (S.tab === 'arch' ? S.loans.filter((l) => l.done) : S.loans.filter((l) => !l.done && l.dir === S.tab))
    .sort((a, b) => (a.due ?? 9e15) - (b.due ?? 9e15));

  const addPay = (id: string, v: number): void =>
    up({ loans: S.loans.map((l) => {
      if (l.id !== id) return l;
      const a = Math.min(v, rem(l));
      const paid = l.paid + a;
      return { ...l, paid, pays: [...l.pays, { a, at: Date.now() }], done: paid >= l.amt };
    }) });

  return (
    <div>
      <style>{css}</style>
      <div className="w">
        <header>
          <div className="lg">💸</div><h1>{t('app')}</h1>
          <button className="ib" aria-label="settings" onClick={() => setSheet({ k: 'set' })}>⚙️</button>
        </header>
        <div className="hero">
          <div className="clk">
            <span>{new Date(now).toLocaleDateString(loc(S.lang), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
            <span>{new Date(now).toLocaleTimeString(loc(S.lang), { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div className="hl">{t('net')}</div>
          <div className="hn">
            {netKeys.length ? netKeys.map((c, i) => <span key={c}>{i > 0 && <br />}{(net[c] ?? 0) > 0 ? '+' : ''}{money(net[c] ?? 0, c, S.lang)}</span>) : money(0, S.cur, S.lang)}
          </div>
          <div className="chips">
            <div className="chip"><small>🔻 {t('sOwe')}</small><b><Totals o={owe} lang={S.lang} /></b></div>
            <div className="chip"><small>🔺 {t('sOwed')}</small><b><Totals o={owed} lang={S.lang} /></b></div>
          </div>
        </div>
        <div className="tabs">
          {(['owe', 'owed', 'arch'] as Tab[]).map((k) => <button key={k} className={S.tab === k ? 'on' : ''} onClick={() => up({ tab: k })}>{t(k)}</button>)}
        </div>
        {rows.length === 0 && <div className="em"><span>🪙</span>{t('empty')}</div>}
        {rows.map((l) => {
          const pct = Math.min(100, Math.round((l.paid / l.amt) * 100));
          let hue = 0;
          for (const ch of l.who) hue = (hue * 31 + ch.charCodeAt(0)) % 360;
          const ms = l.due !== null ? l.due - now : 0;
          const open = openId === l.id;
          return (
            <div className="c" key={l.id} onClick={() => setOpenId(open ? null : l.id)}>
              <div className="r">
                <div className="av" style={{ background: `linear-gradient(135deg,hsl(${hue} 75% 58%),hsl(${(hue + 40) % 360} 75% 48%))` }}>{[...l.who][0].toUpperCase()}</div>
                <div className="g1"><div className="nm">{l.who}</div><div className="mut">{l.note}</div></div>
                <div>
                  <div className="am" style={{ color: l.dir === 'owe' ? 'var(--red)' : 'var(--grn)' }}>{money(l.done ? l.amt : rem(l), l.cur, S.lang)}</div>
                  <div className="mut" style={{ textAlign: 'end' }}>{l.done ? '' : t('left')}</div>
                </div>
              </div>
              <div className="bar"><i style={{ width: `${pct}%` }} /></div>
              <div className="meta">
                <span>📅 {l.due !== null ? dt(l.due, S.lang) : t('noDue')}</span>
                {l.done ? <span className="bd" style={{ color: 'var(--grn)' }}>✓ {t('settled')}</span>
                  : l.due !== null && (ms < 0
                    ? <span className="bd" style={{ color: 'var(--red)' }}>⚠ {t('over')}</span>
                    : <span className="bd" style={{ color: ms < 2592e5 ? 'var(--amb)' : 'var(--mut)' }}>⏳ {Math.floor(ms / 864e5)}d {Math.floor((ms % 864e5) / 36e5)}h</span>)}
              </div>
              {open && (
                <div className="det" onClick={(e) => e.stopPropagation()}>
                  <div><span>{t('created')}</span><span>{dt(l.created, S.lang)}</span></div>
                  <div><span>{t('amt')}</span><span>{money(l.paid, l.cur, S.lang)} / {money(l.amt, l.cur, S.lang)}</span></div>
                  {l.pays.map((p, i) => <div key={i}><span>💳 {t('paidOn')}</span><span>{money(p.a, l.cur, S.lang)} · {dt(p.at, S.lang)}</span></div>)}
                  <div className="acts">
                    {!l.done && <button className="b" onClick={() => setSheet({ k: 'pay', id: l.id })}>{t('pay')}</button>}
                    <button className="b d" onClick={() => up({ loans: S.loans.filter((x) => x.id !== l.id) })}>{t('del')}</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <button className="fab" aria-label="add" onClick={() => setSheet({ k: 'add' })}>+</button>

      {sheet?.k === 'add' && <AddSheet t={t} defDir={S.tab === 'owed' ? 'owed' : 'owe'} defCur={S.cur} onClose={() => setSheet(null)}
        onSave={(l) => { up({ loans: [...S.loans, l], tab: l.dir, cur: l.cur }); setSheet(null); }} />}
      {sheet?.k === 'pay' && <PaySheet t={t} lang={S.lang} loan={S.loans.find((l) => l.id === sheet.id)} onClose={() => setSheet(null)}
        onSave={(v) => { addPay(sheet.id, v); setSheet(null); }} />}
      {sheet?.k === 'set' && (
        <Sheet onClose={() => setSheet(null)}>
          <h2>{t('set')}</h2>
          <label>{t('lang')}</label>
          <Seg<Lang> opts={(Object.keys(LN) as Lang[]).map((k) => [k, LN[k]])} value={S.lang} onChange={(v) => up({ lang: v })} />
          <label>{t('theme')}</label>
          <Seg<Theme> opts={[['', t('auto')], ['light', `☀️ ${t('light')}`], ['dark', `🌙 ${t('dark')}`]]} value={S.theme} onChange={(v) => up({ theme: v })} />
          <label>{t('cur')}</label>
          <Seg<Cur> opts={curOpts()} value={S.cur} onChange={(v) => up({ cur: v })} />
          <div className="acts" style={{ marginTop: 18 }}><button className="b g" onClick={() => setSheet(null)}>OK</button></div>
        </Sheet>
      )}
    </div>
  );
}

function AddSheet({ t, defDir, defCur, onSave, onClose }: { t: (k: string) => string; defDir: Dir; defCur: Cur; onSave: (l: Loan) => void; onClose: () => void }) {
  const [dir, setDir] = useState<Dir>(defDir);
  const [cur, setCur] = useState<Cur>(defCur);
  const [who, setWho] = useState('');
  const [amt, setAmt] = useState('');
  const [due, setDue] = useState('');
  const [note, setNote] = useState('');
  const submit = (): void => {
    const a = parseFloat(amt);
    if (!who.trim() || !(a > 0)) return;
    onSave({ id: Date.now().toString(36), dir, cur, who: who.trim(), amt: a, paid: 0, pays: [], due: due ? new Date(due).getTime() : null, note: note.trim(), created: Date.now(), done: false });
  };
  return (
    <Sheet onClose={onClose}>
      <h2>{t('add')}</h2>
      <label>{t('dir')}</label>
      <Seg<Dir> opts={[['owe', t('owe')], ['owed', t('owed')]]} value={dir} onChange={setDir} />
      <label>{t('who')}</label><input value={who} onChange={(e) => setWho(e.target.value)} autoComplete="off" />
      <label>{t('cur')}</label>
      <Seg<Cur> opts={curOpts()} value={cur} onChange={setCur} />
      <label>{t('amt')}</label><input type="number" inputMode="decimal" min="0" step="any" value={amt} onChange={(e) => setAmt(e.target.value)} />
      <label>{t('due')}</label><input type="datetime-local" value={due} onChange={(e) => setDue(e.target.value)} />
      <label>{t('note')}</label><input value={note} onChange={(e) => setNote(e.target.value)} autoComplete="off" />
      <div className="acts" style={{ marginTop: 18 }}>
        <button className="b g" onClick={onClose}>{t('cancel')}</button><button className="b" onClick={submit}>{t('save')}</button>
      </div>
    </Sheet>
  );
}

function PaySheet({ t, lang, loan, onSave, onClose }: { t: (k: string) => string; lang: Lang; loan?: Loan; onSave: (v: number) => void; onClose: () => void }) {
  const [v, setV] = useState<string>(loan ? String(rem(loan)) : '');
  if (!loan) return null;
  return (
    <Sheet onClose={onClose}>
      <h2>{loan.who}</h2>
      <label>{t('pay')} · {t('left')}: {money(rem(loan), loan.cur, lang)}</label>
      <input type="number" inputMode="decimal" min="0" step="any" value={v} onChange={(e) => setV(e.target.value)} />
      <div className="acts" style={{ marginTop: 18 }}>
        <button className="b g" onClick={onClose}>{t('cancel')}</button>
        <button className="b" onClick={() => { const n = parseFloat(v); if (n > 0) onSave(n); }}>{t('save')}</button>
      </div>
    </Sheet>
  );
}
