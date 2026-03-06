import { useState, useRef, useEffect } from "react";

const MOCK_CONTACTS = [
  { id: "c001", name: "יוסי כהן", phone: "050-123-4567", language: "he", building: 'בניין א - רחוב הרצל 12' },
  { id: "c002", name: "Борис Иванов", phone: "052-765-4321", language: "ru", building: 'בניין ב - רחוב ביאליק 5' },
  { id: "c003", name: "רחל לוי", phone: "054-111-2233", language: "he", building: 'בניין א - רחוב הרצל 12' },
];

const CEREMONY_SLOTS = [
  { id: 1, time: "09:00", rep: 'עו"ד דוד כהן', status: "open" },
  { id: 2, time: "09:15", rep: 'עו"ד דוד כהן', status: "open" },
  { id: 3, time: "09:30", rep: 'עו"ד דוד כהן', status: "open" },
  { id: 4, time: "09:45", rep: 'עו"ד דוד כהן', status: "open" },
  { id: 5, time: "10:00", rep: 'עו"ד מרים לוי', status: "open" },
  { id: 6, time: "10:15", rep: 'עו"ד מרים לוי', status: "open" },
];

const MEETING_DATES = [
  { date: "2026-03-10", label: "שלישי 10/03" },
  { date: "2026-03-11", label: "רביעי 11/03" },
  { date: "2026-03-12", label: "חמישי 12/03" },
];

const MEETING_TIMES = [
  { id: 10, time: "10:00", rep: "נציג: ענת שפירא" },
  { id: 11, time: "11:30", rep: "נציג: ענת שפירא" },
  { id: 12, time: "14:00", rep: "נציג: מיכאל גל" },
];

const TYPE_LABELS = {
  he: { consultation:"פגישת ייעוץ", physical:"פגישה פיזית במשרד", appraiser:"ביקור שמאי", surveyor:"ביקור מודד", signing_ceremony:"כנס חתימות" },
  ru: { consultation:"Консультация", physical:"Встреча в офисе", appraiser:"Визит оценщика", surveyor:"Визит геодезиста", signing_ceremony:"Церемония подписания" }
};

const STATUS_META = {
  bot_sent:     { label: "WA נשלח",       color: "#3b82f6", icon: "📤" },
  answered:     { label: "ענה",            color: "#8b5cf6", icon: "💬" },
  confirmed:    { label: "אישר פגישה ✅",  color: "#10b981", icon: "✅" },
  declined:     { label: "סירב ❌",        color: "#ef4444", icon: "❌" },
  maybe:        { label: "אולי 🤷",        color: "#f59e0b", icon: "🤷" },
  wrong_person: { label: "לא זוהה",       color: "#6b7280", icon: "❓" },
  pending:      { label: "ממתין",          color: "#6b7280", icon: "⏳" },
  no_slots:     { label: "אין מקומות",     color: "#6b7280", icon: "🚫" },
};

function buildStrings(lang, contact) {
  const n = contact.name;
  if (lang === "ru") return {
    identity: `Здравствуйте, ${n} 👋\nЯ бот QUANTUM.\n\nДля подтверждения - вы ${n}?\n1️⃣ Да\n2️⃣ Нет, это ошибка`,
    wrongPerson: "Извините за беспокойство. Пожалуйста, передайте сообщение зарегистрированному владельцу. Спасибо 🙏",
    ceremonyIntro: `${n}, церемония подписания проекта *Комплекс Херцль 12*:\n📅 15/04/2026\n📍 Мэрия, зал А\n\nСможете прийти?\n1️⃣ Да, приду\n2️⃣ Не смогу\n3️⃣ Ещё не знаю`,
    slotSelect: (sl) => "Отлично! Выберите удобное время:\n\n" + sl.map((s,i)=>`${i+1}️⃣ ${s.time} — ${s.rep}`).join("\n"),
    slotTaken: "Это время уже занято 😔 Пожалуйста, выберите другое:",
    confirm: (s) => `✅ *Встреча назначена!*\n\n📅 15/04/2026\n⏰ ${s.time}\n📍 Мэрия, зал А\n👤 ${s.rep}\n\nНапомним за сутки и за 2 часа.\nДо встречи! 👋`,
    declined: "Спасибо за уведомление. Наш представитель свяжется с вами.",
    maybe: "Понятно. Мы свяжемся с вами ближе к дате.",
    meetingIntro: (type) => `Здравствуйте, ${n} 👋\nQUANTUM на связи.\n\nГотовы записать вас на *${type}*.\n\nВыберите дату:\n\n`+MEETING_DATES.map((d,i)=>`${i+1}️⃣ ${d.label}`).join("\n"),
    timeSelect: "Выберите время:\n\n"+MEETING_TIMES.map((t,i)=>`${i+1}️⃣ ${t.time} — ${t.rep}`).join("\n"),
    meetingConfirm: (type,date,time,rep)=>`✅ *${type} назначена!*\n\n📅 ${date}\n⏰ ${time}\n👤 ${rep}\n\nНапомним за сутки.\nДо встречи! 👋`,
    noSlots: "Свободных слотов нет. Наш представитель свяжется с вами.",
    invalid: "Не понял выбор. Введите номер из предложенных.",
  };
  return {
    identity: `שלום ${n} 👋\nאני הבוט של QUANTUM.\n\nרק לאימות - האם אתה/את ${n}?\n1️⃣ כן\n2️⃣ לא, מדובר בטעות`,
    wrongPerson: "מצטערים על הבלבול. נשמח אם תעביר/י את ההודעה לבעל הדירה הרשום. תודה 🙏",
    ceremonyIntro: `${n}, כנס החתימות לפרויקט *מתחם הרצל 12* יתקיים ב:\n📅 15/04/2026\n📍 בית העירייה, אולם א\n\nנשמח לראותך! האם תוכל/י להגיע?\n1️⃣ כן, אגיע\n2️⃣ לא אוכל להגיע\n3️⃣ עדיין לא יודע/ת`,
    slotSelect: (sl) => "מעולה! בחר/י שעה נוחה:\n\n"+sl.map((s,i)=>`${i+1}️⃣ ${s.time} — ${s.rep}`).join("\n"),
    slotTaken: "השעה שבחרת כבר תפוסה 😔 אנא בחר/י שעה אחרת:",
    confirm: (s) => `✅ *הפגישה נקבעה!*\n\n📅 15/04/2026\n⏰ ${s.time}\n📍 בית העירייה, אולם א\n👤 ${s.rep}\n\nתקבל/י תזכורת יום לפני ו-2 שעות לפני.\nלהתראות! 👋`,
    declined: "תודה שעדכנת אותנו. נציג שלנו ייצור איתך קשר בהקדם.",
    maybe: "מובן. נחזור אליך קרוב לתאריך הכנס לאישור סופי.",
    meetingIntro: (type) => `שלום ${n} 👋\nQUANTUM כאן.\n\nנשמח לתאם *${type}* עבור דירתך.\n\nבחר/י תאריך מועדף:\n\n`+MEETING_DATES.map((d,i)=>`${i+1}️⃣ ${d.label}`).join("\n"),
    timeSelect: "בחר/י שעה:\n\n"+MEETING_TIMES.map((t,i)=>`${i+1}️⃣ ${t.time} — ${t.rep}`).join("\n"),
    meetingConfirm: (type,date,time,rep)=>`✅ *${type} נקבעה!*\n\n📅 ${date}\n⏰ ${time}\n👤 ${rep}\n\nתקבל/י תזכורת יום לפני.\nלהתראות! 👋`,
    noSlots: "כרגע אין חלונות זמן פנויים. נציג שלנו ייצור איתך קשר בהקדם.",
    invalid: "לא הבנתי את הבחירה. אנא הקלד/י את המספר המתאים.",
  };
}

function engine(config, contact, slots, state, msg, ctx) {
  const lang = config.language;
  const S = buildStrings(lang, contact);
  const num = parseInt(msg);
  const isCeremony = config.meetingType === "signing_ceremony";

  if (state === "identity") {
    if (msg === "1") return { reply: isCeremony ? S.ceremonyIntro : S.meetingIntro(TYPE_LABELS[lang][config.meetingType]), nextState: isCeremony ? "ceremony_attend" : "meeting_date", zoho: { status:"answered", log:'ענה "כן" — אימות זהות' } };
    if (msg === "2") return { reply: S.wrongPerson, nextState: "closed", zoho: { status:"wrong_person", log:"לא זוהה כבעל הדירה" } };
    return { reply: S.invalid, nextState: state };
  }
  if (state === "ceremony_attend") {
    if (msg === "1") { const open=slots.filter(s=>s.status==="open"); if(!open.length) return{reply:S.noSlots,nextState:"closed",zoho:{status:"no_slots",log:"אין מקומות"}}; return{reply:S.slotSelect(open),nextState:"ceremony_slot",zoho:{status:"answered",log:"אישר הגעה — בוחר שעה"}}; }
    if (msg === "2") return { reply: S.declined, nextState: "declined", zoho: { status:"declined", log:"סירב" } };
    if (msg === "3") return { reply: S.maybe, nextState: "maybe", zoho: { status:"maybe", log:"אולי" } };
    return { reply: S.invalid, nextState: state };
  }
  if (state === "ceremony_slot") {
    const open=slots.filter(s=>s.status==="open"); const idx=num-1;
    if(isNaN(num)||idx<0||idx>=open.length) return{reply:S.invalid,nextState:state};
    const c=open[idx];
    return{reply:S.confirm(c),nextState:"confirmed",slotToLock:c.id,zoho:{status:"confirmed",log:`אישר: ${c.time} — ${c.rep}`,event:{title:"כנס חתימות — QUANTUM",date:"15/04/2026",time:c.time,rep:c.rep}}};
  }
  if (state === "meeting_date") {
    const idx=num-1; if(isNaN(num)||idx<0||idx>=MEETING_DATES.length) return{reply:S.invalid,nextState:state};
    return{reply:S.timeSelect,nextState:"meeting_time",ctx:{...ctx,date:MEETING_DATES[idx]},zoho:{status:"answered",log:`בחר תאריך: ${MEETING_DATES[idx].label}`}};
  }
  if (state === "meeting_time") {
    const idx=num-1; if(isNaN(num)||idx<0||idx>=MEETING_TIMES.length) return{reply:S.invalid,nextState:state};
    const t=MEETING_TIMES[idx]; const tl=TYPE_LABELS[lang][config.meetingType];
    return{reply:S.meetingConfirm(tl,ctx?.date?.label||"",t.time,t.rep),nextState:"confirmed",zoho:{status:"confirmed",log:`אישר ${tl}: ${ctx?.date?.label} ${t.time}`,event:{title:`${tl} — QUANTUM`,date:ctx?.date?.label,time:t.time,rep:t.rep}}};
  }
  return { reply: S.invalid, nextState: state };
}

const nowStr = () => new Date().toLocaleTimeString("he-IL",{hour:"2-digit",minute:"2-digit",second:"2-digit"});
const inp = { width:"100%", background:"#040c18", border:"1px solid #1a2f4a", color:"#c8d8e8", padding:"7px 10px", borderRadius:5, fontSize:12, outline:"none", direction:"rtl", boxSizing:"border-box" };

function Section({ title, children }) {
  return (
    <div style={{ background:"#0a1628", border:"1px solid #1a2f4a", borderRadius:8, padding:16, marginBottom:14 }}>
      <div style={{ fontSize:11, fontWeight:700, color:"#00d4ff", letterSpacing:1, marginBottom:12, display:"flex", alignItems:"center", gap:6 }}>
        <div style={{ width:3, height:14, background:"#00d4ff", borderRadius:2 }} />{title}
      </div>
      {children}
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState("config");
  const [config, setConfig] = useState({ meetingType:"signing_ceremony", language:"he", reminderDelay:24, botFollowup:48, preMeeting:24, morningReminder:2, campaignName:"מתחם הרצל 12 — כנס חתימות" });
  const [contact, setContact] = useState(MOCK_CONTACTS[0]);
  const [started, setStarted] = useState(false);
  const [msgs, setMsgs] = useState([]);
  const [botState, setBotState] = useState("identity");
  const [botCtx, setBotCtx] = useState({});
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [slots, setSlots] = useState(CEREMONY_SLOTS.map(s=>({...s})));
  const [zStatus, setZStatus] = useState("pending");
  const [zMsgs, setZMsgs] = useState([]);
  const [zEvent, setZEvent] = useState(null);
  const [reminders, setReminders] = useState([]);
  const chatRef = useRef(null);

  useEffect(() => { if(chatRef.current) chatRef.current.scrollTop=chatRef.current.scrollHeight; }, [msgs, typing]);

  function start() {
    const lang = config.language;
    const isC = config.meetingType === "signing_ceremony";
    const tl = TYPE_LABELS[lang][config.meetingType];
    const n = contact.name;
    const im = isC
      ? (lang==="ru" ? `Здравствуйте, ${n} 👋\nQUANTUM на связи.\n\nЦеремония подписания *Комплекс Херцль 12*:\n📅 15/04/2026\n📍 Мэрия, зал А\n\nНажмите *1* для подтверждения.`
                     : `שלום ${n} 👋\nQUANTUM כאן.\n\nכנס החתימות לפרויקט *מתחם הרצל 12*:\n📅 15/04/2026\n📍 בית העירייה, אולם א\n\nענה/י *1* לאישור ובחירת שעה.`)
      : (lang==="ru" ? `Здравствуйте, ${n} 👋\nQUANTUM на связи.\n\nГотовы записать вас на *${tl}*.\n\nНажмите *1*.`
                     : `שלום ${n} 👋\nQUANTUM כאן.\n\nנשמח לתאם *${tl}* עבור דירתך.\n\nענה/י *1* ונתאם עכשיו.`);
    setMsgs([{id:1,from:"bot",text:im,time:nowStr()}]);
    setZMsgs([{dir:"יוצאת",text:im.substring(0,55)+"…",time:nowStr(),subject:"WA ראשוני"}]);
    setZStatus("bot_sent");
    setReminders([{type:"reminder_24h",at:`בעוד ${config.reminderDelay}ש`,status:"pending"},{type:"bot_followup_48h",at:`בעוד ${config.botFollowup}ש`,status:"pending"}]);
    setBotState("identity"); setBotCtx({}); setStarted(true); setTab("chat");
  }

  function send() {
    const terminal=["confirmed","closed","declined","maybe"];
    if(!input.trim()||typing||terminal.includes(botState)) return;
    const txt=input; setInput("");
    setMsgs(p=>[...p,{id:Date.now(),from:"user",text:txt,time:nowStr()}]);
    setZMsgs(p=>[...p,{dir:"נכנסת",text:txt,time:nowStr(),subject:`תגובה — ${botState}`}]);
    setTyping(true);
    setTimeout(()=>{
      const r=engine(config,contact,slots,botState,txt,botCtx);
      setMsgs(p=>[...p,{id:Date.now()+1,from:"bot",text:r.reply,time:nowStr()}]);
      setBotState(r.nextState);
      if(r.ctx) setBotCtx(r.ctx);
      if(r.slotToLock) setSlots(p=>p.map(s=>s.id===r.slotToLock?{...s,status:"taken"}:s));
      if(r.zoho){
        setZStatus(r.zoho.status);
        setZMsgs(p=>[...p,{dir:"יוצאת",text:r.reply.substring(0,55)+"…",time:nowStr(),subject:r.zoho.log}]);
        if(r.zoho.event) setZEvent(r.zoho.event);
        if(r.zoho.status==="confirmed") setReminders([{type:"pre_meeting_24h",at:"24ש לפני",status:"pending"},{type:"pre_meeting_2h",at:"2ש לפני",status:"pending"}]);
      }
      setTyping(false);
    }, 800+Math.random()*500);
  }

  function reset() {
    setStarted(false);setMsgs([]);setBotState("identity");setBotCtx({});
    setZStatus("pending");setZMsgs([]);setZEvent(null);setReminders([]);
    setSlots(CEREMONY_SLOTS.map(s=>({...s})));setTab("config");
  }

  const sm = STATUS_META[zStatus]||STATUS_META.pending;
  const TABS=[{id:"config",label:"⚙️ הגדרות"},{id:"chat",label:"💬 שיחה"},{id:"zoho",label:"🏢 Zoho"},{id:"slots",label:"📅 Slots"}];
  const STATES=["identity","ceremony_attend","ceremony_slot","meeting_date","meeting_time","confirmed","declined","maybe","closed"];

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100vh",background:"#060b14",color:"#c8d8e8",fontFamily:"'IBM Plex Sans','Segoe UI',sans-serif",direction:"rtl",overflow:"hidden"}}>
      {/* HEADER */}
      <div style={{background:"linear-gradient(90deg,#0a1628,#0d1f3c)",borderBottom:"1px solid #1a2f4a",padding:"10px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,flexWrap:"wrap",gap:8}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:32,height:32,borderRadius:8,background:"linear-gradient(135deg,#00d4ff,#0066cc)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:900,color:"#000"}}>Q</div>
          <div>
            <div style={{fontSize:13,fontWeight:700,color:"#00d4ff",letterSpacing:1}}>QUANTUM SCHEDULING SANDBOX</div>
            <div style={{fontSize:10,color:"#4a7a9a"}}>סביבת בדיקה — לפני עלייה ל-Zoho CRM</div>
          </div>
        </div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"5px 13px",borderRadius:5,border:"1px solid",fontSize:11,fontWeight:600,cursor:"pointer",background:tab===t.id?"#00d4ff":"transparent",color:tab===t.id?"#001020":"#4a7a9a",borderColor:tab===t.id?"#00d4ff":"#1a2f4a"}}>{t.label}</button>
          ))}
        </div>
        {started && <button onClick={reset} style={{padding:"5px 12px",borderRadius:5,background:"#1a0505",border:"1px solid #cc2200",color:"#ff6666",fontSize:11,fontWeight:600,cursor:"pointer"}}>↺ איפוס</button>}
      </div>

      <div style={{flex:1,overflow:"hidden",display:"flex"}}>

        {/* CONFIG */}
        {tab==="config" && (
          <div style={{flex:1,overflowY:"auto",padding:24}}>
            <div style={{maxWidth:640,margin:"0 auto"}}>
              <div style={{fontSize:17,fontWeight:700,color:"#00d4ff",marginBottom:16}}>הגדרות קמפיין לסימולציה</div>
              <Section title="איש קשר">
                {MOCK_CONTACTS.map(c=>(
                  <div key={c.id} onClick={()=>setContact(c)} style={{padding:"9px 13px",borderRadius:6,border:"1px solid",cursor:"pointer",marginBottom:6,borderColor:contact.id===c.id?"#00d4ff":"#1a2f4a",background:contact.id===c.id?"#001830":"#0a1628"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:6}}>
                      <div>
                        <span style={{fontWeight:600,color:contact.id===c.id?"#00d4ff":"#c8d8e8"}}>{c.name}</span>
                        <span style={{marginRight:8,fontSize:11,color:"#4a7a9a"}}>{c.phone}</span>
                      </div>
                      <div style={{display:"flex",gap:5}}>
                        <span style={{fontSize:9,padding:"2px 6px",borderRadius:3,background:"#002244",color:"#80c0e0",border:"1px solid #0d3a5a"}}>{c.language==="he"?"עברית":"Русский"}</span>
                        <span style={{fontSize:9,padding:"2px 6px",borderRadius:3,background:"#001a20",color:"#80c0e0",border:"1px solid #0d3a5a"}}>{c.building}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </Section>
              <Section title="סוג פגישה ושפה">
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                  <div>
                    <div style={{fontSize:10,color:"#3a6a8a",marginBottom:4,fontWeight:600}}>סוג פגישה</div>
                    <select value={config.meetingType} onChange={e=>setConfig(p=>({...p,meetingType:e.target.value}))} style={inp}>
                      <option value="signing_ceremony">כנס חתימות</option>
                      <option value="consultation">פגישת ייעוץ</option>
                      <option value="appraiser">ביקור שמאי</option>
                      <option value="surveyor">ביקור מודד</option>
                      <option value="physical">פגישה פיזית</option>
                    </select>
                  </div>
                  <div>
                    <div style={{fontSize:10,color:"#3a6a8a",marginBottom:4,fontWeight:600}}>שפת השיחה</div>
                    <select value={config.language} onChange={e=>setConfig(p=>({...p,language:e.target.value}))} style={inp}>
                      <option value="he">עברית</option>
                      <option value="ru">Русский</option>
                    </select>
                  </div>
                </div>
                <div style={{fontSize:10,color:"#3a6a8a",marginBottom:4,fontWeight:600}}>שם הקמפיין</div>
                <input value={config.campaignName} onChange={e=>setConfig(p=>({...p,campaignName:e.target.value}))} style={inp} />
              </Section>
              <Section title="קבועי זמן (שעות)">
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  {[["reminderDelay","תזכורת ראשונה אחרי"],["botFollowup","BOT חוזר אחרי"],["preMeeting","תזכורת לפני פגישה"],["morningReminder","תזכורת בוקר לפני"]].map(([k,label])=>(
                    <div key={k}>
                      <div style={{fontSize:10,color:"#3a6a8a",marginBottom:4}}>{label}</div>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <input type="number" value={config[k]} min={1} max={168} onChange={e=>setConfig(p=>({...p,[k]:+e.target.value}))} style={{...inp,width:60,textAlign:"center",direction:"ltr"}} />
                        <span style={{fontSize:11,color:"#3a6a8a"}}>שעות</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
              <button onClick={start} style={{width:"100%",padding:14,background:"linear-gradient(90deg,#00aacc,#0066cc)",border:"none",borderRadius:8,color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",letterSpacing:0.5,marginTop:4}}>▶ הפעל סימולציה</button>
            </div>
          </div>
        )}

        {/* CHAT */}
        {tab==="chat" && (
          <div style={{flex:1,display:"flex"}}>
            <div style={{flex:1,display:"flex",justifyContent:"center",alignItems:"center",padding:20,background:"#060b14"}}>
              <div style={{width:350,height:"min(670px,calc(100vh - 130px))",background:"#0a1a10",borderRadius:20,overflow:"hidden",display:"flex",flexDirection:"column",border:"1px solid #1a3a1a",boxShadow:"0 0 40px #00d4ff12"}}>
                <div style={{background:"#0d2010",padding:"10px 14px",display:"flex",alignItems:"center",gap:10,borderBottom:"1px solid #1a3a1a",flexShrink:0}}>
                  <div style={{width:36,height:36,borderRadius:"50%",background:"linear-gradient(135deg,#00d4ff,#0066cc)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,color:"#fff"}}>Q</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:600,color:"#e0ffe0"}}>QUANTUM 🔒</div>
                    <div style={{fontSize:10,color:"#3a7a3a"}}>{started?"פעיל":"לא מחובר"}</div>
                  </div>
                  <div style={{fontSize:11,color:"#3a7a3a",direction:"ltr"}}>{contact.phone}</div>
                </div>
                <div ref={chatRef} style={{flex:1,overflowY:"auto",padding:"12px 10px",display:"flex",flexDirection:"column",gap:8,background:"#040c06"}}>
                  {!started && <div style={{textAlign:"center",color:"#2a5a2a",fontSize:12,marginTop:40}}><div style={{fontSize:28}}>💬</div><div>הגדר קמפיין והפעל</div></div>}
                  {msgs.map(m=>(
                    <div key={m.id} style={{display:"flex",justifyContent:m.from==="user"?"flex-start":"flex-end"}}>
                      <div style={{maxWidth:"82%",padding:"8px 12px",borderRadius:m.from==="user"?"4px 14px 14px 14px":"14px 4px 14px 14px",background:m.from==="user"?"#1a2a1a":"#0d2a0d",border:`1px solid ${m.from==="user"?"#1a3a1a":"#1a4a1a"}`}}>
                        <div style={{fontSize:12,color:"#c0e0c0",whiteSpace:"pre-wrap",lineHeight:1.5}}>{m.text}</div>
                        <div style={{fontSize:9,color:"#3a6a3a",marginTop:4,textAlign:"left",direction:"ltr"}}>{m.time}</div>
                      </div>
                    </div>
                  ))}
                  {typing && (
                    <div style={{display:"flex",justifyContent:"flex-end"}}>
                      <div style={{padding:"10px 14px",borderRadius:"14px 4px 14px 14px",background:"#0d2a0d",border:"1px solid #1a4a1a"}}>
                        <div style={{display:"flex",gap:4}}>
                          {[0,1,2].map(i=><div key={i} style={{width:6,height:6,borderRadius:"50%",background:"#3a9a3a",animation:`pulse 1s ${i*0.2}s infinite`}} />)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div style={{padding:"8px 10px",background:"#0d2010",borderTop:"1px solid #1a3a1a",display:"flex",gap:6,flexShrink:0}}>
                  {["1","2","3"].map(n=><button key={n} onClick={()=>setInput(n)} style={{padding:"6px 11px",borderRadius:20,background:"#1a3a1a",border:"1px solid #2a5a2a",color:"#80c080",fontSize:12,cursor:"pointer"}}>{n}</button>)}
                  <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="הקלד תגובה…" style={{flex:1,background:"#1a3a1a",border:"1px solid #2a5a2a",borderRadius:20,padding:"6px 10px",color:"#c0e0c0",fontSize:12,outline:"none",direction:"rtl"}} />
                  <button onClick={send} style={{padding:"6px 11px",borderRadius:20,background:"#1a5a1a",border:"none",color:"#80ff80",fontSize:14,cursor:"pointer"}}>➤</button>
                </div>
              </div>
            </div>
            <div style={{width:185,background:"#080e18",borderRight:"1px solid #1a2f4a",padding:14,display:"flex",flexDirection:"column",gap:9,overflowY:"auto"}}>
              <div style={{fontSize:10,fontWeight:700,color:"#3a6a8a",letterSpacing:1}}>מצב BOT</div>
              {STATES.map(s=>(
                <div key={s} style={{display:"flex",alignItems:"center",gap:7}}>
                  <div style={{width:7,height:7,borderRadius:"50%",background:botState===s?"#00d4ff":"#1a2f4a",flexShrink:0,boxShadow:botState===s?"0 0 5px #00d4ff":"none"}} />
                  <div style={{fontSize:9,color:botState===s?"#00d4ff":"#2a4a6a",fontWeight:botState===s?700:400}}>{s}</div>
                </div>
              ))}
              <div style={{borderTop:"1px solid #1a2f4a",paddingTop:9,marginTop:2}}>
                <div style={{fontSize:10,color:"#3a6a8a",fontWeight:700,marginBottom:5}}>איש קשר</div>
                <div style={{fontSize:11,color:"#a0c0d8"}}>{contact.name}</div>
                <div style={{fontSize:10,color:"#3a6a8a",marginTop:2}}>{contact.phone}</div>
              </div>
            </div>
          </div>
        )}

        {/* ZOHO */}
        {tab==="zoho" && (
          <div style={{flex:1,overflowY:"auto",padding:20}}>
            <div style={{maxWidth:820,margin:"0 auto"}}>
              <div style={{fontSize:14,fontWeight:700,color:"#00d4ff",marginBottom:12}}>מה מוצג ב-Zoho CRM — בזמן אמת</div>
              <div style={{background:"#0a1628",border:`1px solid ${sm.color}30`,borderRadius:8,padding:14,marginBottom:12,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div>
                  <div style={{fontSize:10,color:"#3a6a8a",marginBottom:3}}>סטטוס נוכחי — אנשי קשר בקמפיין</div>
                  <div style={{fontSize:20,fontWeight:700,color:sm.color}}>{sm.icon} {sm.label}</div>
                  <div style={{fontSize:11,color:"#3a6a8a",marginTop:3}}>{contact.name} — {config.campaignName}</div>
                </div>
                <div style={{width:46,height:46,borderRadius:"50%",background:`${sm.color}20`,border:`2px solid ${sm.color}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>{sm.icon}</div>
              </div>
              {zEvent && (
                <div style={{background:"#001830",border:"1px solid #10b98130",borderRadius:8,padding:13,marginBottom:12}}>
                  <div style={{fontSize:10,color:"#10b981",fontWeight:700,marginBottom:9,letterSpacing:1}}>📅 EVENT שנוצר ב-Zoho CRM</div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
                    {[["כותרת",zEvent.title],["תאריך",zEvent.date],["שעה",zEvent.time],["נציג",zEvent.rep]].map(([l,v])=>(
                      <div key={l} style={{background:"#002a20",borderRadius:5,padding:"7px 9px"}}>
                        <div style={{fontSize:9,color:"#3a9a6a",marginBottom:2}}>{l}</div>
                        <div style={{fontSize:11,color:"#80e0b0"}}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <Section title={`הודעות נכנסות (${zMsgs.length})`}>
                {zMsgs.length===0 ? <div style={{color:"#3a6a8a",fontSize:12,padding:8}}>אין הודעות עדיין</div> : (
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                    <thead><tr>{["כיוון","שעה","נושא","תוכן"].map(h=><th key={h} style={{textAlign:"right",padding:"5px 8px",color:"#3a6a8a",borderBottom:"1px solid #1a2f4a"}}>{h}</th>)}</tr></thead>
                    <tbody>
                      {zMsgs.map((m,i)=>(
                        <tr key={i} style={{borderBottom:"1px solid #0d1e30"}}>
                          <td style={{padding:"6px 8px"}}><span style={{fontSize:10,padding:"2px 7px",borderRadius:3,background:m.dir==="נכנסת"?"#002040":"#001a30",color:m.dir==="נכנסת"?"#4a9eff":"#80c0ff",border:"1px solid",borderColor:m.dir==="נכנסת"?"#004a8a":"#002a5a"}}>{m.dir==="נכנסת"?"↓ נכנסת":"↑ יוצאת"}</span></td>
                          <td style={{padding:"6px 8px",color:"#3a6a8a",direction:"ltr",fontSize:10}}>{m.time}</td>
                          <td style={{padding:"6px 8px",color:"#a0c0d8"}}>{m.subject}</td>
                          <td style={{padding:"6px 8px",color:"#6a9aba",maxWidth:160,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.text}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </Section>
              <Section title="תור תזכורות">
                {reminders.length===0 ? <div style={{color:"#3a6a8a",fontSize:12,padding:8}}>אין תזכורות</div> : (
                  <div style={{display:"flex",flexDirection:"column",gap:6}}>
                    {reminders.map((r,i)=>(
                      <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 10px",background:"#040c18",borderRadius:5,border:"1px solid #0d1e30"}}>
                        <div style={{width:7,height:7,borderRadius:"50%",background:"#f59e0b"}} />
                        <div style={{fontSize:11,color:"#f59e0b",fontWeight:600}}>{r.type}</div>
                        <div style={{fontSize:11,color:"#3a6a8a"}}>{r.at}</div>
                        <span style={{fontSize:9,padding:"2px 7px",borderRadius:3,background:"#1a0a00",color:"#f59e0b",border:"1px solid #3a2000",marginRight:"auto"}}>pending</span>
                      </div>
                    ))}
                  </div>
                )}
              </Section>
            </div>
          </div>
        )}

        {/* SLOTS */}
        {tab==="slots" && (
          <div style={{flex:1,overflowY:"auto",padding:20}}>
            <div style={{maxWidth:620,margin:"0 auto"}}>
              <div style={{fontSize:14,fontWeight:700,color:"#00d4ff",marginBottom:5}}>לוח Slots — כנס חתימות</div>
              <div style={{fontSize:11,color:"#3a6a8a",marginBottom:12}}>מתחם הרצל 12 | 15/04/2026 | 09:00 — 11:00</div>
              <div style={{display:"grid",gap:5}}>
                <div style={{display:"grid",gridTemplateColumns:"70px 1fr 1fr 90px",gap:8,padding:"5px 10px",fontSize:10,color:"#3a6a8a",fontWeight:600}}>
                  <div>שעה</div><div>עמדה</div><div>נציג</div><div>סטטוס</div>
                </div>
                {slots.map(s=>(
                  <div key={s.id} style={{display:"grid",gridTemplateColumns:"70px 1fr 1fr 90px",gap:8,padding:"8px 10px",background:"#0a1628",borderRadius:5,border:`1px solid ${s.status==="open"?"#0d2a40":"#1a0a00"}`}}>
                    <div style={{fontSize:13,fontWeight:700,color:s.status==="open"?"#00d4ff":"#6b7280"}}>{s.time}</div>
                    <div style={{fontSize:11,color:"#6a9aba"}}>עמדה {Math.ceil(s.id/2)}</div>
                    <div style={{fontSize:11,color:"#a0c0d8"}}>{s.rep}</div>
                    <span style={{fontSize:10,padding:"2px 8px",borderRadius:3,background:s.status==="open"?"#001a10":"#1a0000",color:s.status==="open"?"#10b981":"#ef4444",border:`1px solid ${s.status==="open"?"#10b98140":"#ef444440"}`,alignSelf:"center"}}>
                      {s.status==="open"?"✓ פתוח":"✗ תפוס"}
                    </span>
                  </div>
                ))}
              </div>
              <div style={{marginTop:14,display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
                {[["פתוחים",slots.filter(s=>s.status==="open").length,"#10b981"],["תפוסים",slots.filter(s=>s.status==="taken").length,"#ef4444"],['סה"כ',slots.length,"#00d4ff"]].map(([l,v,c])=>(
                  <div key={l} style={{background:"#0a1628",border:`1px solid ${c}20`,borderRadius:6,padding:12,textAlign:"center"}}>
                    <div style={{fontSize:26,fontWeight:700,color:c}}>{v}</div>
                    <div style={{fontSize:11,color:"#3a6a8a"}}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:.3}50%{opacity:1}} ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-track{background:#040c14} ::-webkit-scrollbar-thumb{background:#1a2f4a;border-radius:2px}`}</style>
    </div>
  );
}
