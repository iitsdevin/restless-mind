import { useState, useEffect, useRef, useCallback, createContext, useContext } from "react";

// ============================================================
// THEME SYSTEM — Time of day + Season
// ============================================================

const NOONGAR = [
  { name:"Birak", months:"Dec–Jan", theme:"First Summer", desc:"Hot days, afternoon breezes. Fire season — clearing and renewal.", focus:"New beginnings. Clearing. Setting intentions.", nums:[12,1], warmth:0.9 },
  { name:"Bunuru", months:"Feb–Mar", theme:"Second Summer", desc:"Hottest period. White flowers (Jarrah, Marri, Ghost Gums).", focus:"Gratitude. Early/evening practice. Water connection.", nums:[2,3], warmth:1.0 },
  { name:"Djeran", months:"Apr–May", theme:"Autumn", desc:"Cooler nights, dew, red flowers. Southwest winds.", focus:"Gathering wisdom. Repair. Nourishment. Inward preparation.", nums:[4,5], warmth:0.6 },
  { name:"Makuru", months:"Jun–Jul", theme:"Deep Winter", desc:"Cold, wet. Heavy rain. Wardongs and mali nesting.", focus:"Deep inner work. Longer sits. Ancestor connection.", nums:[6,7], warmth:0.2 },
  { name:"Djilba", months:"Aug–Sep", theme:"Second Spring", desc:"Mixed weather warming. Wattles bloom. Migrants return.", focus:"Noticing what wants to be born. Emerging.", nums:[8,9], warmth:0.4 },
  { name:"Kambarang", months:"Oct–Nov", theme:"Wildflowers", desc:"Warming. Kangaroo paws, orchids, banksias.", focus:"Full expression. Celebration. Flowering.", nums:[10,11], warmth:0.75 },
];

function getSeason() { const m=new Date().getMonth()+1; return NOONGAR.find(s=>s.nums.includes(m))||NOONGAR[0]; }
function getTimeOfDay() { const h=new Date().getHours(); if(h>=5&&h<12) return "morning"; if(h>=12&&h<17) return "midday"; return "evening"; }
function getGreeting() { const t=getTimeOfDay(); return t==="morning"?"Good morning":t==="midday"?"Good afternoon":"Good evening"; }

function lerp(a,b,t) { return a+(b-a)*t; }
function lerpColor(c1,c2,t) {
  const p = (h) => [parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
  const [r1,g1,b1]=p(c1), [r2,g2,b2]=p(c2);
  const r=Math.round(lerp(r1,r2,t)), g=Math.round(lerp(g1,g2,t)), b=Math.round(lerp(b1,b2,t));
  return `#${[r,g,b].map(x=>x.toString(16).padStart(2,"0")).join("")}`;
}

const TIME_THEMES = {
  morning: {
    bg1:"#1f1a12", bg2:"#2a2015", bg3:"#1f1a12",
    accent:"#d4b058", accentLight:"#f0da90", accentMuted:"#b8a060",
    accentDim:"#6b5a2a", accentGlow:"rgba(201,164,74,",
    text:"#f0e8d4", textMuted:"#d4c4a0", textDim:"#a08850",
    surface:"rgba(201,164,74,0.04)", surfaceHover:"rgba(201,164,74,0.1)",
    border:"rgba(201,164,74,0.12)", borderActive:"rgba(201,164,74,0.3)",
    gradAngle:"160deg",
    label: "Dawn",
  },
  midday: {
    bg1:"#181d14", bg2:"#1e2418", bg3:"#181d14",
    accent:"#7ea06a", accentLight:"#c8dab2", accentMuted:"#94ac80",
    accentDim:"#4a5a3a", accentGlow:"rgba(107,142,90,",
    text:"#dce8cc", textMuted:"#aabb96", textDim:"#7a946a",
    surface:"rgba(107,142,90,0.04)", surfaceHover:"rgba(107,142,90,0.1)",
    border:"rgba(107,142,90,0.12)", borderActive:"rgba(107,142,90,0.3)",
    gradAngle:"170deg",
    label: "Daylight",
  },
  evening: {
    bg1:"#15131e", bg2:"#1a1726", bg3:"#15131e",
    accent:"#9080b4", accentLight:"#ccc0e4", accentMuted:"#8878a8",
    accentDim:"#4a3a6a", accentGlow:"rgba(122,106,154,",
    text:"#e4dcf0", textMuted:"#baaed0", textDim:"#7a6a94",
    surface:"rgba(122,106,154,0.04)", surfaceHover:"rgba(122,106,154,0.1)",
    border:"rgba(122,106,154,0.12)", borderActive:"rgba(122,106,154,0.3)",
    gradAngle:"175deg",
    label: "Twilight",
  },
};

function getBlendedTheme() {
  const h = new Date().getHours();
  const m = new Date().getMinutes();
  const frac = m / 60;

  // Transition windows with smooth blending
  // 5-7am: night→morning, 7-12: morning, 12-13: morning→midday, 13-17: midday, 17-19: midday→evening, 19+: evening
  let theme;
  if (h >= 7 && h < 12) theme = TIME_THEMES.morning;
  else if (h >= 13 && h < 17) theme = TIME_THEMES.midday;
  else if (h >= 19 || h < 5) theme = TIME_THEMES.evening;
  else if (h >= 5 && h < 7) {
    const t = (h - 5 + frac) / 2;
    theme = blendThemes(TIME_THEMES.evening, TIME_THEMES.morning, t);
  } else if (h >= 12 && h < 13) {
    theme = blendThemes(TIME_THEMES.morning, TIME_THEMES.midday, frac);
  } else { // 17-19
    const t = (h - 17 + frac) / 2;
    theme = blendThemes(TIME_THEMES.midday, TIME_THEMES.evening, t);
  }

  // Season warmth adjustment
  const season = getSeason();
  const w = season.warmth;
  // Slightly warm or cool the accent based on season
  return { ...theme, seasonWarmth: w };
}

function blendThemes(a, b, t) {
  const result = {};
  for (const key of Object.keys(a)) {
    if (typeof a[key] === "string" && a[key].startsWith("#")) {
      result[key] = lerpColor(a[key], b[key], t);
    } else if (typeof a[key] === "string" && a[key].startsWith("rgba")) {
      // For rgba strings, just crossfade by picking closer one
      result[key] = t < 0.5 ? a[key] : b[key];
    } else {
      result[key] = t < 0.5 ? a[key] : b[key];
    }
  }
  return result;
}

const ThemeContext = createContext(null);
function useTheme() { return useContext(ThemeContext); }

// ============================================================
// DATA
// ============================================================

const TRADITIONS = {
  zen: { name:"Zen", icon:"◯" },
  vajrayana: { name:"Vajrayana", icon:"◆" },
  theravada: { name:"Theravāda", icon:"❋" },
  secular: { name:"Secular", icon:"●" },
};

const MOODS = {
  restless: { label:"Restless", icon:"〰", tags:["movement","tactile","body"], tip:"Your body needs to move. Walking, mala, or dynamic body scan." },
  scattered: { label:"Scattered", icon:"✦", tags:["structure","focus"], tip:"Structure helps. Noting or mala — give the mind a task." },
  anxious: { label:"Anxious", icon:"◇", tags:["grounding","calming"], tip:"Ground first. Earth touching, sensory grounding, or body scan." },
  sluggish: { label:"Low energy", icon:"◠", tags:["imagination","sound"], tip:"Arousal not relaxation. Vajrayana visualisation or mantra aloud." },
  shame: { label:"Self-critical", icon:"♡", tags:["self-compassion","heart","emotional"], tip:"Self-compassion first. RAIN or loving-kindness — hands on heart." },
  open: { label:"Open", icon:"○", tags:["spacious","open","advanced"], tip:"Rest in open awareness, shikantaza, or ancestor meditation." },
};

const PRACTICES = [
  { id:"body-scan", name:"Dynamic Body Scan", minutes:5, traditions:["theravada","secular"], times:["morning","evening"], tags:["grounding","body","beginner"],
    steps:["Sit or lie comfortably. Three grounding breaths.","Crown → tense and release.","Face, jaw, neck → tense, release.","Shoulders, arms, hands → squeeze fists, release.","Hand on belly → three breaths of movement.","Hips, thighs, knees → tense, release.","Calves, feet, toes → press into floor, release.","Whole body → three final breaths."],
    why:"Physical tensing/releasing keeps the ADHD body involved with clear sensation to attend to." },
  { id:"walking", name:"Walking Meditation", minutes:7, traditions:["zen","theravada"], times:["morning","midday","evening"], tags:["movement","grounding","beginner"],
    steps:["Stand at one end of a 10–20 pace path.","Hands in shashu or at sides.","Walk very slowly. Feel: lifting, moving, placing.","Mind wanders → \"wandering\" → return to soles of feet.","End of path: pause, turn, walk back.","NATURE: Natural pace outdoors. All five senses."],
    why:"Alternating sitting and walking is standard Zen — not an accommodation but an ancient recognition." },
  { id:"mala", name:"Mala & Mantra", minutes:5, traditions:["vajrayana","theravada"], times:["morning","evening"], tags:["tactile","sound","focus"],
    steps:["Choose: Om Mani Padme Hum, Buddho, Om, or personal phrase.","Mala in right hand. Thumb advances one bead per recitation.","RECITE ALOUD — hearing, vibration, touch, mind at once.","Wrist mala (27) ≈ 3–5 min. Full (108) ≈ 10–15 min.","The beads are your \"acceptable fidget.\""],
    why:"Multi-channel engagement (sound + touch + rhythm + meaning) suits high-stimulation brains." },
  { id:"noting", name:"Noting Practice", minutes:5, traditions:["theravada"], times:["morning","midday"], tags:["focus","structure","intermediate"],
    steps:["Sit or walk. Anchor on breath.","Mind wanders → one word: \"thinking,\" \"planning,\" \"hearing,\" \"restless.\"","Simple labels. Don't analyse. The label interrupts the train.","Rapid-fire is fine: \"thinking... hearing... planning...\"","Drop noting when burdensome — scaffold, not destination."],
    why:"Speed of noting matches ADHD mind. Keeps it occupied with a continuous task." },
  { id:"visualisation", name:"Light Visualisation", minutes:5, traditions:["vajrayana"], times:["morning","evening"], tags:["imagination","calming","intermediate"],
    steps:["Sit comfortably. Eyes half-closed.","Golden light at heart centre.","Inhale: brighter, warmer.","Exhale: radiates outward, dissolving tension.","Add detail: colour, texture, warmth, rays.","Rest in luminous feeling. Final breaths."],
    why:"Vajrayana produces arousal (not relaxation) with enhanced cognitive performance." },
  { id:"rain", name:"RAIN (Tara Brach)", minutes:5, traditions:["secular","theravada"], times:["morning","midday","evening"], tags:["emotional","self-compassion","anytime"],
    steps:["For strong emotion (shame, frustration, anxiety).","R — Recognise: \"What is happening right now?\"","A — Allow: \"This belongs.\"","I — Investigate: Where in my body? What does it need?","N — Nurture: Hand on heart. Kindness to what hurts.","After: rest in awareness. Notice what shifted."],
    why:"Self-compassion mediates positive mental health in MBCT for ADHD (Geurts et al., 2020)." },
  { id:"metta", name:"Loving-Kindness", minutes:5, traditions:["theravada","secular"], times:["evening"], tags:["self-compassion","heart","beginner"],
    steps:["Hands on heart. Three slow breaths.","\"May I be happy. May I be healthy. May I be safe. May I be at ease.\"","Repeat each 2–3 times. Feel the intention.","Mind wanders → phrases are the anchor.","Extend to one loved one if you like.","End: \"May all beings be at ease.\""],
    why:"Counteracts ~20,000 corrective comments ADHD children receive by age 10." },
  { id:"shikantaza", name:"Shikantaza (Just Sitting)", minutes:10, traditions:["zen"], times:["morning","evening"], tags:["open","advanced","spacious"],
    steps:["Stable posture. Spine upright, chin tucked.","Eyes half-open, soft gaze at 45°.","No object. No counting. No mantra.","Simply sit. Everything is included.","Think not-thinking. How? Non-thinking.","Noticing you were lost IS the practice."],
    why:"Removes the performance metric. Your notice-everything mind becomes the practice itself." },
  { id:"earth-touch", name:"Earth Touching", minutes:3, traditions:["zen","theravada","vajrayana","secular"], times:["morning","midday"], tags:["nature","grounding","beginner"],
    steps:["Sit. Left hand in lap, palm up.","Right hand over knee, fingers touching earth.","(Bhūmisparśa — the Buddha calling earth as witness.)","Close eyes or soften gaze. 10–15 breaths.","Awareness on every point of body-earth contact.","Outdoors on actual soil amplifies."],
    why:"Nature contact reduces ADHD symptoms 20–30%. Physical anchor provides what ADHD brains need." },
  { id:"sensory", name:"Sensory Grounding", minutes:3, traditions:["secular"], times:["morning","midday","evening"], tags:["nature","grounding","quick","beginner"],
    steps:["Go outdoors if possible. Name aloud:","5 things you SEE in detail","4 things you TOUCH","3 things you HEAR","2 things you SMELL","1 thing you TASTE","Quick: 3 sights, 2 touches, 1 breath."],
    why:"Activates parasympathetic nervous system and quiets default mode network." },
  { id:"ancestor-am", name:"Morning Ancestor Offering", minutes:3, traditions:["vajrayana","theravada","zen"], times:["morning"], tags:["ancestors","ritual","beginner"],
    steps:["Pour out yesterday's water onto earth.","Fresh water on altar.","Light candle or incense.","\"Good morning. Thank you. I love you.\"","Silence — notice impressions.","Intention or question for the day."],
    why:"Ritual provides external scaffolding. Sensory cues substitute for ADHD's missing internal scaffolding." },
  { id:"ancestor-pm", name:"Ancestral Lineage Meditation", minutes:7, traditions:["vajrayana","theravada","zen","secular"], times:["evening"], tags:["ancestors","visualisation","intermediate"],
    steps:["Sit, eyes closed. Three breaths.","Visualise a beautiful natural place.","Behind you: parents. Then grandparents. Great-grandparents.","Lineage stretching into deep time.","Focus on most ancient, most well ancestors.","Sense support flowing toward you.","Ask or receive. Thank them. Return."],
    why:"Begin with ancient, well ancestors — safer than recently deceased. Daniel Foor's approach." },
];

const MORNING_RITUAL = [
  { time:"1–2 min", action:"Change water on ancestor altar. Greeting. Light candle or incense." },
  { time:"3–7 min", action:"Step outside. Sit spot or earth touching practice." },
  { time:"8–10 min", action:"Sensory grounding walking inside. Set intention." },
];

const RESEARCH = [
  { cat:"Meta-Analyses", items:[
    { t:"Oliva et al. (2021)", d:"31 studies, 1,336 patients. Medium-to-large vs inactive controls, low-to-negligible vs active controls. The key finding.", j:"J Affect Disord" },
    { t:"Cairncross & Miller (2020)", d:"10 studies. d = −0.66 inattention, d = −0.53 hyperactivity-impulsivity.", j:"J Atten Disord" },
    { t:"Xue et al. (2019)", d:"11 studies, 682 participants. g = −0.825 inattention. Self-report > observer ratings.", j:"Curr Med Res Opin" },
    { t:"2025 Meta-Analysis", d:"10 controlled studies. SMD = 0.48 symptoms, 0.56 function. Non-significant for emotional wellbeing.", j:"Multiple" },
  ]},
  { cat:"Key Trials", items:[
    { t:"Janssen et al. (2019)", d:"120 adults. MBCT + TAU vs TAU. Clinician-rated improvements persisting at 6 months. Most rigorous.", j:"Psych Med" },
    { t:"Hoxhaj et al. (2018)", d:"81 adults. MAPs NOT superior to psychoeducation. Both improved equally.", j:"Eur Arch Psych" },
    { t:"Zylowska et al. (2008)", d:"32 participants. MAPs feasibility. 78% retention, 90% satisfaction.", j:"J Atten Disord" },
  ]},
  { cat:"Neuroimaging", items:[
    { t:"Default Mode Network", d:"ADHD DMN stays active during tasks (predicting errors 20 sec early). Meditation reduces DMN activity and improves switching." },
    { t:"Kjaer et al. (2002)", d:"PET: 65% dopamine increase in ventral striatum during Yoga Nidra. Directly relevant to ADHD.", j:"Cog Brain Res" },
    { t:"Bachmann et al. (2018)", d:"fMRI: mindfulness → stronger working memory/attention activation vs psychoeducation.", j:"Behav Res Ther" },
    { t:"Fox et al. (2014)", d:"21 studies: greater grey matter in anterior cingulate — most underactivated region in ADHD.", j:"Neurosci Biobehav Rev" },
    { t:"Geurts et al. (2020)", d:"Two pathways: inhibition → reduced symptoms; self-compassion → positive mental health. Both core.", j:"J Atten Disord" },
  ]},
  { cat:"Tradition-Specific", items:[
    { t:"Vipassana (Cahn 2009)", d:"Decreased P3a to distractors — \"consonant with therapeutic effects for ADHD.\"", j:"Int J Psychophysiol" },
    { t:"Vajrayana (NUS)", d:"Arousal response with \"immediate dramatic cognitive performance increase.\" ADHD needs arousal.", j:"NUS" },
    { t:"Zen (Pagnoni 2007)", d:"No age-related grey matter loss in putamen; improved sustained attention.", j:"Neurobiol Aging" },
    { t:"Yoga (2025)", d:"9 studies. SMD = −1.79 hyperactivity, −1.43 emotional instability in children.", j:"Meta-analysis" },
  ]},
  { cat:"Honest Limitations", items:[
    { t:"Active Control Problem", d:"Vs any structured intervention, MBIs lose advantage. Benefits may = group support + expectancy." },
    { t:"Small Samples", d:"Largest RCT: 120. Some neuroimaging: 13." },
    { t:"Self-Report Bias", d:"Self-report consistently > clinician ratings." },
    { t:"Bottom Line", d:"Complementary. Safe. Plausible mechanisms. Most valuable in multimodal approach." },
  ]},
];

const QUOTES = [
  { text:"Think not-thinking. How? Non-thinking.", by:"Dōgen" },
  { text:"The most radical project is the project of embodiment.", by:"Lama Rod Owens" },
  { text:"Thoughts are clouds. Rigpa is sunlit space.", by:"Tsoknyi Rinpoche" },
  { text:"What if neurodivergent bodies were compasses, not broken?", by:"Sophie Strand" },
  { text:"Animism is normative consciousness.", by:"Josh Schrei" },
  { text:"Do not try to stop your mind. Leave everything as it is.", by:"Shunryu Suzuki" },
  { text:"Being at peace with how we are is the precondition to transformation.", by:"Tara Brach" },
  { text:"You are not failing at meditation. You are doing more of it.", by:"—" },
  { text:"The energy of distraction and of awakening are the same substance.", by:"Vajrayana" },
];

// ============================================================
// AUDIO
// ============================================================
function useBell() {
  const ctxRef = useRef(null);
  const getCtx = useCallback(() => {
    if (!ctxRef.current || ctxRef.current.state === "closed") ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    if (ctxRef.current.state === "suspended") ctxRef.current.resume();
    return ctxRef.current;
  }, []);

  return useCallback((type = "full") => {
    try {
      const ctx = getCtx(), now = ctx.currentTime;
      const master = ctx.createGain();
      master.connect(ctx.destination);
      master.gain.setValueAtTime(type === "interval" ? 0.12 : 0.22, now);
      master.gain.exponentialRampToValueAtTime(0.001, now + (type === "interval" ? 2.5 : 4.5));
      const freqs = type === "start" ? [261.6,523.2,784] : type === "interval" ? [392,784] : [261.6,392,523.2,784,1046.5];
      freqs.forEach((f, i) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.connect(g); g.connect(master); o.type = "sine"; o.frequency.setValueAtTime(f, now);
        g.gain.setValueAtTime(i === 0 ? 0.35 : 0.18/(i+1), now);
        const dur = type === "interval" ? 2.5 : 4.5 - i*0.3;
        g.gain.exponentialRampToValueAtTime(0.001, now + dur);
        o.start(now + i*0.015); o.stop(now + dur + 0.1);
      });
      if (type === "full") setTimeout(() => {
        try {
          const c2 = getCtx(), n2 = c2.currentTime, m2 = c2.createGain();
          m2.connect(c2.destination); m2.gain.setValueAtTime(0.12, n2); m2.gain.exponentialRampToValueAtTime(0.001, n2+3);
          [293.7,440,587.3].forEach((f,i)=>{ const o=c2.createOscillator(),g=c2.createGain(); o.connect(g);g.connect(m2); o.type="sine";o.frequency.setValueAtTime(f,n2); g.gain.setValueAtTime(0.2/(i+1),n2);g.gain.exponentialRampToValueAtTime(0.001,n2+3); o.start(n2);o.stop(n2+3.1); });
        } catch(e){}
      }, 2500);
    } catch(e){}
  }, [getCtx]);
}

// ============================================================
// HELPERS
// ============================================================
function fmt(s){return`${Math.floor(s/60)}:${(s%60).toString().padStart(2,"0")}`}
function loadStreak(){try{const r=JSON.parse(localStorage?.getItem?.("rms")||"null");if(r?.dates)return r}catch(e){}return{dates:[],current:0}}
function saveStreak(d){try{localStorage?.setItem?.("rms",JSON.stringify(d))}catch(e){}}
function recordPractice(){const s=loadStreak(),t=new Date().toISOString().slice(0,10);if(!s.dates.includes(t))s.dates.push(t);const sorted=[...s.dates].sort().reverse();let c=0;for(let i=0;i<sorted.length;i++){const e=new Date();e.setDate(e.getDate()-i);if(sorted[i]===e.toISOString().slice(0,10))c++;else break}s.current=c;saveStreak(s);return s}

// ============================================================
// COMPONENTS
// ============================================================
function Nav({active,setActive}){
  const T=useTheme();
  const tabs=[{id:"practice",l:"Practice"},{id:"timer",l:"Timer"},{id:"research",l:"Research"},{id:"seasons",l:"Seasons"}];
  return(
    <nav style={{display:"flex",justifyContent:"center",gap:2,padding:"10px 8px",background:`${T.bg1}f0`,borderBottom:`1px solid ${T.border}`,position:"sticky",top:0,zIndex:100,backdropFilter:"blur(20px)",transition:"all 1.5s ease"}}>
      {tabs.map(t=>(
        <button key={t.id} onClick={()=>setActive(t.id)} style={{
          background:active===t.id?`${T.accentGlow}0.18)`:  "transparent",
          border:active===t.id?`1px solid ${T.borderActive}`:"1px solid transparent",
          color:active===t.id?T.accentLight:T.accentMuted,
          padding:"10px 20px",borderRadius:8,cursor:"pointer",fontFamily:"'EB Garamond',Georgia,serif",fontSize:15,letterSpacing:"0.02em",transition:"all 0.3s",
        }}>{t.l}</button>
      ))}
    </nav>
  );
}

function QuoteBar(){
  const T=useTheme();
  const[i,setI]=useState(()=>Math.floor(Math.random()*QUOTES.length));
  const q=QUOTES[i];
  return(
    <div onClick={()=>setI((i+1)%QUOTES.length)} style={{padding:"14px 24px",textAlign:"center",cursor:"pointer",borderBottom:`1px solid ${T.border}`,background:`${T.accentGlow}0.03)`,minHeight:56,display:"flex",flexDirection:"column",justifyContent:"center",userSelect:"none",transition:"all 1.5s ease"}}>
      <p style={{fontFamily:"'EB Garamond',Georgia,serif",fontSize:15,fontStyle:"italic",color:T.textMuted,lineHeight:1.5,margin:0}}>"{q.text}"</p>
      <p style={{fontSize:11,color:T.accentDim,margin:"4px 0 0",letterSpacing:"0.1em",textTransform:"uppercase"}}>— {q.by}</p>
    </div>
  );
}

function Pill({active,onClick,children}){
  const T=useTheme();
  return(
    <button onClick={onClick} style={{
      background:active?`${T.accentGlow}0.2)`:  `${T.accentGlow}0.04)`,
      border:`1px solid ${active?T.borderActive:T.border}`,
      color:active?T.accentLight:T.accentMuted,
      padding:"7px 14px",borderRadius:20,cursor:"pointer",fontSize:13,fontFamily:"'EB Garamond',Georgia,serif",transition:"all 0.25s",whiteSpace:"nowrap",
    }}>{children}</button>
  );
}

function Card({p,expanded,onToggle,onStart}){
  const T=useTheme();
  return(
    <div style={{background:expanded?T.surfaceHover:T.surface,border:`1px solid ${expanded?T.borderActive:T.border}`,borderRadius:12,padding:expanded?"18px 20px":"14px 18px",marginBottom:8,transition:"all 0.3s"}}>
      <div onClick={onToggle} style={{cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
        <div style={{flex:1}}>
          <h3 style={{fontFamily:"'EB Garamond',Georgia,serif",fontSize:17,color:T.text,margin:0,lineHeight:1.3}}>{p.name}</h3>
          <div style={{display:"flex",gap:6,marginTop:5,flexWrap:"wrap",alignItems:"center"}}>
            <span style={{fontSize:12,color:T.accentMuted,background:`${T.accentGlow}0.1)`,padding:"2px 8px",borderRadius:10}}>{p.minutes} min</span>
            {p.traditions.map(t=><span key={t} style={{fontSize:11,color:T.accentMuted}}>{TRADITIONS[t].icon} {TRADITIONS[t].name}</span>)}
          </div>
        </div>
        <span style={{color:T.accentDim,fontSize:18,transform:expanded?"rotate(45deg)":"none",transition:"transform 0.2s",flexShrink:0,marginLeft:12}}>+</span>
      </div>
      {expanded&&(
        <div style={{marginTop:14,paddingTop:14,borderTop:`1px solid ${T.border}`}}>
          <div style={{background:`${T.bg1}88`,borderLeft:`3px solid ${T.borderActive}`,borderRadius:"0 8px 8px 0",padding:"14px 18px",marginBottom:14}}>
            {p.steps.map((s,i)=><p key={i} style={{margin:"5px 0",fontSize:15,color:T.textMuted,lineHeight:1.6,fontFamily:"'EB Garamond',Georgia,serif"}}>{s}</p>)}
          </div>
          <p style={{fontSize:14,color:T.textDim,fontStyle:"italic",lineHeight:1.5,margin:"0 0 12px"}}>{p.why}</p>
          <button onClick={e=>{e.stopPropagation();onStart(p.minutes*60)}} style={{
            background:`${T.accentGlow}0.12)`,border:`1px solid ${T.borderActive}`,color:T.accentLight,
            padding:"8px 20px",borderRadius:8,cursor:"pointer",fontFamily:"'EB Garamond',Georgia,serif",fontSize:14,
          }}>Start {p.minutes} min timer →</button>
        </div>
      )}
    </div>
  );
}

function PracticeTab({goTimer}){
  const T=useTheme();
  const[trad,setTrad]=useState("all");
  const[mood,setMood]=useState(null);
  const[exp,setExp]=useState(null);
  const[showAM,setShowAM]=useState(false);
  const tod=getTimeOfDay(),season=getSeason(),streak=loadStreak();

  let list=PRACTICES.filter(p=>trad==="all"||p.traditions.includes(trad));
  if(mood){const mt=MOODS[mood].tags;list=list.map(p=>({...p,score:p.tags.filter(t=>mt.includes(t)).length})).sort((a,b)=>b.score-a.score)}
  const suggested=mood?list.filter(p=>p.score>0):list.filter(p=>p.times.includes(tod));
  const others=mood?list.filter(p=>p.score===0):list.filter(p=>!p.times.includes(tod));

  return(
    <div style={{padding:"20px 16px",maxWidth:640,margin:"0 auto"}}>
      <div style={{textAlign:"center",marginBottom:4}}>
        <h1 style={{fontFamily:"'EB Garamond',Georgia,serif",fontSize:26,color:T.text,fontWeight:400,margin:0}}>{getGreeting()}</h1>
        <p style={{fontSize:12,color:T.accentDim,margin:"6px 0 0",letterSpacing:"0.06em"}}>{season.name} · {season.theme}</p>
        {streak.current>0&&<p style={{fontSize:11,color:T.accentDim,margin:"4px 0 0"}}>{streak.current} day{streak.current>1?"s":""} showing up ◯</p>}
      </div>
      <div style={{textAlign:"center",margin:"16px 0 4px"}}>
        <p style={{fontSize:12,color:T.accentDim,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:8}}>How are you right now?</p>
        <div style={{display:"flex",gap:6,justifyContent:"center",flexWrap:"wrap"}}>
          {Object.entries(MOODS).map(([k,m])=><Pill key={k} active={mood===k} onClick={()=>setMood(mood===k?null:k)}>{m.icon} {m.label}</Pill>)}
        </div>
        {mood&&<p style={{fontSize:14,color:T.textMuted,fontStyle:"italic",margin:"10px 0 0",lineHeight:1.5}}>{MOODS[mood].tip}</p>}
      </div>
      <div style={{display:"flex",gap:6,justifyContent:"center",flexWrap:"wrap",padding:"12px 0"}}>
        <Pill active={trad==="all"} onClick={()=>setTrad("all")}>All</Pill>
        {Object.entries(TRADITIONS).map(([k,t])=><Pill key={k} active={trad===k} onClick={()=>setTrad(k)}>{t.icon} {t.name}</Pill>)}
      </div>
      {tod==="morning"&&(
        <div style={{background:T.surfaceHover,border:`1px solid ${T.borderActive}`,borderRadius:12,padding:"16px 18px",marginBottom:16}}>
          <div onClick={()=>setShowAM(!showAM)} style={{cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div><h3 style={{fontFamily:"'EB Garamond',Georgia,serif",fontSize:17,color:T.accentLight,margin:0}}>☀ Combined Morning Ritual</h3><p style={{fontSize:12,color:T.textMuted,margin:"4px 0 0"}}>10 min · Ancestors + Nature + Awareness</p></div>
            <span style={{color:T.accentDim,fontSize:14,transform:showAM?"rotate(90deg)":"none",transition:"transform 0.2s"}}>▸</span>
          </div>
          {showAM&&(
            <div style={{marginTop:12,paddingTop:12,borderTop:`1px solid ${T.border}`}}>
              {MORNING_RITUAL.map((s,i)=><div key={i} style={{display:"flex",gap:12,marginBottom:8}}><span style={{fontSize:12,color:T.accent,fontWeight:600,minWidth:55,fontFamily:"'EB Garamond',Georgia,serif"}}>{s.time}</span><span style={{fontSize:15,color:T.textMuted,lineHeight:1.5}}>{s.action}</span></div>)}
              <button onClick={()=>goTimer(600)} style={{marginTop:8,background:`${T.accentGlow}0.12)`,border:`1px solid ${T.borderActive}`,color:T.accentLight,padding:"8px 20px",borderRadius:8,cursor:"pointer",fontFamily:"'EB Garamond',Georgia,serif",fontSize:14}}>Start 10 min timer →</button>
            </div>
          )}
        </div>
      )}
      {suggested.length>0&&(<>
        <h2 style={{fontFamily:"'EB Garamond',Georgia,serif",fontSize:14,color:T.accentMuted,textTransform:"uppercase",letterSpacing:"0.1em",margin:"16px 0 10px",borderBottom:`1px solid ${T.border}`,paddingBottom:6}}>{mood?"Recommended":"Suggested for "+tod}</h2>
        {suggested.map(p=><Card key={p.id} p={p} expanded={exp===p.id} onToggle={()=>setExp(exp===p.id?null:p.id)} onStart={goTimer}/>)}
      </>)}
      {others.length>0&&(<>
        <h2 style={{fontFamily:"'EB Garamond',Georgia,serif",fontSize:13,color:T.accentDim,textTransform:"uppercase",letterSpacing:"0.1em",margin:"20px 0 10px",borderBottom:`1px solid ${T.border}`,paddingBottom:6}}>Other practices</h2>
        {others.map(p=><Card key={p.id} p={p} expanded={exp===p.id} onToggle={()=>setExp(exp===p.id?null:p.id)} onStart={goTimer}/>)}
      </>)}
    </div>
  );
}

function BreathGuide({running}){
  const T=useTheme();
  const[phase,setPhase]=useState("in");
  const[scale,setScale]=useState(1);
  const ref=useRef(0);const iRef=useRef(null);
  useEffect(()=>{
    if(!running){setScale(1);setPhase("in");ref.current=0;return}
    iRef.current=setInterval(()=>{ref.current+=50;const c=8000,p=ref.current%c;if(p<4000){setPhase("in");setScale(1+0.35*(p/4000))}else{setPhase("out");setScale(1.35-0.35*((p-4000)/4000))}},50);
    return()=>clearInterval(iRef.current);
  },[running]);
  if(!running)return null;
  return(
    <div style={{textAlign:"center",marginBottom:20}}>
      <div style={{width:60,height:60,borderRadius:"50%",background:`radial-gradient(circle,${T.accentGlow}0.2),transparent)`,border:`1.5px solid ${T.accentGlow}0.3)`,margin:"0 auto 8px",transform:`scale(${scale})`,transition:"transform 0.05s linear"}}/>
      <p style={{fontSize:12,color:T.accentDim,letterSpacing:"0.1em",textTransform:"uppercase",margin:0}}>{phase==="in"?"Breathe in":"Breathe out"}</p>
    </div>
  );
}

function TimerTab({initialDuration}){
  const T=useTheme();
  const[dur,setDur]=useState(initialDuration||300);
  const[rem,setRem]=useState(initialDuration||300);
  const[run,setRun]=useState(false);
  const[done,setDone]=useState(false);
  const[intv,setIntv]=useState(0);
  const[streak,setStreak]=useState(()=>loadStreak());
  const iRef=useRef(null);const bRef=useRef(0);
  const bell=useBell();

  const presets=[{l:"1m",v:60},{l:"3m",v:180},{l:"5m",v:300},{l:"10m",v:600},{l:"15m",v:900},{l:"20m",v:1200}];
  const bellOpts=[{l:"Off",v:0},{l:"2m",v:120},{l:"5m",v:300}];

  useEffect(()=>{if(initialDuration&&initialDuration!==dur){setDur(initialDuration);setRem(initialDuration);setRun(false);setDone(false)}},[initialDuration]);
  useEffect(()=>{
    if(run&&rem>0){
      iRef.current=setInterval(()=>{setRem(r=>{const n=r-1;bRef.current+=1;if(intv>0&&bRef.current>=intv&&n>3){bRef.current=0;bell("interval")}if(n<=0){clearInterval(iRef.current);setRun(false);setDone(true);bell("full");setStreak(recordPractice());return 0}return n})},1000);
    }
    return()=>clearInterval(iRef.current);
  },[run,intv,bell]);

  const reset=()=>{clearInterval(iRef.current);setRun(false);setDone(false);setRem(dur);bRef.current=0};
  const toggle=()=>{if(done){reset();return}if(!run){bell("start");bRef.current=0}setRun(!run)};
  const pick=v=>{clearInterval(iRef.current);setDur(v);setRem(v);setRun(false);setDone(false);bRef.current=0};

  const progress=dur>0?1-rem/dur:0;
  const R=105,C=2*Math.PI*R;

  return(
    <div style={{padding:"32px 16px",maxWidth:480,margin:"0 auto",textAlign:"center"}}>
      <h2 style={{fontFamily:"'EB Garamond',Georgia,serif",fontSize:22,color:T.textMuted,fontWeight:400,margin:"0 0 4px"}}>Meditation Timer</h2>
      <p style={{fontSize:12,color:T.accentDim,fontStyle:"italic",margin:"0 0 24px"}}>Start small. 1–3 minutes counts.</p>
      <BreathGuide running={run}/>
      <div style={{position:"relative",width:240,height:240,margin:"0 auto 24px"}}>
        <svg width="240" height="240" viewBox="0 0 240 240" style={{transform:"rotate(-90deg)"}}>
          <circle cx="120" cy="120" r={R} fill="none" stroke={`${T.accentGlow}0.1)`} strokeWidth="3"/>
          <circle cx="120" cy="120" r={R} fill="none" stroke={done?T.textMuted:run?T.accentLight:`${T.accentGlow}0.3)`} strokeWidth="3" strokeDasharray={C} strokeDashoffset={C*(1-progress)} strokeLinecap="round" style={{transition:run?"stroke-dashoffset 1s linear":"none"}}/>
        </svg>
        <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",textAlign:"center"}}>
          {done?(<><div style={{fontFamily:"'EB Garamond',Georgia,serif",fontSize:40,color:T.textMuted}}>◯</div><p style={{fontSize:14,color:T.textMuted,margin:"4px 0 0",fontStyle:"italic"}}>Complete</p>{streak.current>0&&<p style={{fontSize:11,color:T.accentDim,margin:"4px 0 0"}}>{streak.current} day streak</p>}</>):(
            <div style={{fontFamily:"'EB Garamond',Georgia,serif",fontSize:44,color:T.text,letterSpacing:"0.04em",lineHeight:1}}>{fmt(rem)}</div>
          )}
        </div>
      </div>
      <div style={{display:"flex",gap:10,justifyContent:"center",marginBottom:24}}>
        <button onClick={toggle} style={{background:run?`rgba(180,120,80,0.15)`:`${T.accentGlow}0.12)`,border:`1px solid ${run?"rgba(180,120,80,0.3)":T.borderActive}`,color:T.accentLight,padding:"12px 36px",borderRadius:8,cursor:"pointer",fontSize:16,fontFamily:"'EB Garamond',Georgia,serif",minWidth:120}}>{done?"Reset":run?"Pause":"Begin"}</button>
        {(run||rem!==dur)&&!done&&<button onClick={reset} style={{background:"transparent",border:`1px solid ${T.border}`,color:T.accentDim,padding:"12px 18px",borderRadius:8,cursor:"pointer",fontSize:14,fontFamily:"'EB Garamond',Georgia,serif"}}>Reset</button>}
      </div>
      <div style={{display:"flex",gap:6,justifyContent:"center",flexWrap:"wrap",marginBottom:20}}>
        {presets.map(p=><Pill key={p.v} active={dur===p.v} onClick={()=>pick(p.v)}>{p.l}</Pill>)}
      </div>
      <div style={{marginBottom:32}}>
        <p style={{fontSize:12,color:T.accentDim,letterSpacing:"0.08em",textTransform:"uppercase",margin:"0 0 8px"}}>Interval bell</p>
        <div style={{display:"flex",gap:6,justifyContent:"center"}}>{bellOpts.map(b=><Pill key={b.v} active={intv===b.v} onClick={()=>setIntv(b.v)}>{b.l}</Pill>)}</div>
      </div>
      <div style={{padding:"18px 20px",borderRadius:12,background:`${T.accentGlow}0.05)`,border:`1px solid ${T.border}`,textAlign:"left",transition:"all 1s"}}>
        <p style={{fontFamily:"'EB Garamond',Georgia,serif",fontSize:14,color:T.accentMuted,margin:"0 0 6px",fontWeight:600,letterSpacing:"0.06em",textTransform:"uppercase"}}>Quick self-compassion — 30 sec</p>
        {["Hands on heart. Three breaths.","\"This is a moment of difficulty.\"","\"Difficulty is part of being human.\"","\"May I be kind to myself.\""].map((t,i)=><p key={i} style={{fontSize:15,color:T.textMuted,margin:"3px 0",fontFamily:"'EB Garamond',Georgia,serif",fontStyle:i===0?"italic":"normal"}}>{t}</p>)}
      </div>
    </div>
  );
}

function ResearchTab(){
  const T=useTheme();
  const[oc,setOc]=useState(RESEARCH[0].cat);
  const[oi,setOi]=useState(null);
  return(
    <div style={{padding:"24px 16px",maxWidth:640,margin:"0 auto"}}>
      <h2 style={{fontFamily:"'EB Garamond',Georgia,serif",fontSize:22,color:T.textMuted,fontWeight:400,margin:"0 0 4px",textAlign:"center"}}>The Evidence Base</h2>
      <p style={{fontSize:12,color:T.accentDim,textAlign:"center",margin:"0 0 20px",fontStyle:"italic"}}>What the research says — and what it doesn't</p>
      {RESEARCH.map(c=>(
        <div key={c.cat} style={{marginBottom:10}}>
          <button onClick={()=>setOc(oc===c.cat?null:c.cat)} style={{width:"100%",textAlign:"left",background:oc===c.cat?T.surfaceHover:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:"13px 16px",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",transition:"all 0.3s"}}>
            <span style={{fontFamily:"'EB Garamond',Georgia,serif",fontSize:16,color:T.text}}>{c.cat}</span>
            <span style={{color:T.accentDim,fontSize:13,transform:oc===c.cat?"rotate(90deg)":"none",transition:"transform 0.2s"}}>▸</span>
          </button>
          {oc===c.cat&&(
            <div style={{padding:"6px 0 6px 10px",borderLeft:`2px solid ${T.border}`,marginLeft:10,marginTop:4}}>
              {c.items.map((item,i)=>{const k=`${c.cat}-${i}`,open=oi===k;return(
                <div key={i} onClick={()=>setOi(open?null:k)} style={{padding:"9px 12px",marginBottom:3,borderRadius:8,cursor:"pointer",background:open?T.surfaceHover:"transparent",transition:"background 0.2s"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
                    <span style={{fontFamily:"'EB Garamond',Georgia,serif",fontSize:15,color:T.textMuted,fontWeight:600}}>{item.t}</span>
                    {item.j&&<span style={{fontSize:11,color:T.accentDim,fontStyle:"italic",flexShrink:0}}>{item.j}</span>}
                  </div>
                  {open&&<p style={{fontSize:15,color:T.textMuted,margin:"8px 0 0",lineHeight:1.6,fontFamily:"'EB Garamond',Georgia,serif"}}>{item.d}</p>}
                </div>
              )})}
            </div>
          )}
        </div>
      ))}
      <div style={{marginTop:20,padding:"18px 20px",borderRadius:12,background:`${T.accentGlow}0.04)`,border:`1px solid ${T.border}`,transition:"all 1s"}}>
        <p style={{fontFamily:"'EB Garamond',Georgia,serif",fontSize:13,color:T.accent,margin:"0 0 6px",fontWeight:600,letterSpacing:"0.06em",textTransform:"uppercase"}}>The honest bottom line</p>
        <p style={{fontSize:15,color:T.textMuted,margin:0,lineHeight:1.6,fontFamily:"'EB Garamond',Georgia,serif"}}>MBIs consistently help and are safe. Self-compassion is a core active ingredient. Most valuable in a multimodal approach — not replacing medication or behavioural treatment. Not superior to other structured psychological interventions.</p>
      </div>
    </div>
  );
}

function SeasonsTab(){
  const T=useTheme();const cur=getSeason();
  return(
    <div style={{padding:"24px 16px",maxWidth:640,margin:"0 auto"}}>
      <h2 style={{fontFamily:"'EB Garamond',Georgia,serif",fontSize:22,color:T.textMuted,fontWeight:400,margin:"0 0 4px",textAlign:"center"}}>Noongar Seasons</h2>
      <p style={{fontSize:12,color:T.accentDim,textAlign:"center",margin:"0 0 20px",fontStyle:"italic"}}>Practising on Whadjuk Noongar boodja</p>
      {NOONGAR.map((s,i)=>{const isCur=s.name===cur.name;return(
        <div key={i} style={{padding:"16px 18px",marginBottom:8,borderRadius:12,background:isCur?T.surfaceHover:T.surface,border:`1px solid ${isCur?T.borderActive:T.border}`,position:"relative",transition:"all 0.5s"}}>
          {isCur&&<span style={{position:"absolute",top:10,right:14,fontSize:10,color:T.accentMuted,textTransform:"uppercase",letterSpacing:"0.1em",background:`${T.accentGlow}0.15)`,padding:"2px 8px",borderRadius:10}}>Now</span>}
          <div style={{display:"flex",alignItems:"baseline",gap:8,marginBottom:4,flexWrap:"wrap"}}>
            <h3 style={{fontFamily:"'EB Garamond',Georgia,serif",fontSize:19,color:isCur?T.text:T.textMuted,margin:0,fontWeight:600}}>{s.name}</h3>
            <span style={{fontSize:12,color:T.accentDim}}>{s.months} · {s.theme}</span>
          </div>
          <p style={{fontSize:15,color:T.textMuted,margin:"3px 0",lineHeight:1.5,fontFamily:"'EB Garamond',Georgia,serif"}}>{s.desc}</p>
          <p style={{fontSize:13,color:isCur?T.accentLight:T.accentMuted,margin:"6px 0 0",fontStyle:"italic"}}>Practice: {s.focus}</p>
        </div>
      )})}
      <div style={{marginTop:16,padding:"16px 18px",borderRadius:12,background:`${T.accentGlow}0.04)`,border:`1px solid ${T.border}`,transition:"all 1s"}}>
        <p style={{fontFamily:"'EB Garamond',Georgia,serif",fontSize:13,color:T.accent,margin:"0 0 8px",fontWeight:600,letterSpacing:"0.06em",textTransform:"uppercase"}}>Cyclical markers</p>
        {[["Full & New Moons","Extend practice to 20–30 min."],["Winter Solstice (Makuru)","Candlelit ancestor meditation."],["Summer Solstice","Extended outdoor practice. Sunrise sit spot."],["Season Shifts","Every two months: seasonal review & altar refresh."]].map(([t,d],i)=><p key={i} style={{fontSize:14,color:T.textMuted,margin:"4px 0",lineHeight:1.5}}><strong style={{color:T.accentMuted}}>{t}:</strong> {d}</p>)}
      </div>
      <div style={{marginTop:16,padding:"16px 18px",borderRadius:12,background:T.surface,border:`1px solid ${T.border}`,textAlign:"center",transition:"all 1s"}}>
        <p style={{fontFamily:"'EB Garamond',Georgia,serif",fontSize:15,color:T.textMuted,margin:0,lineHeight:1.6,fontStyle:"italic"}}>Begin each meditation by naming where you are —<br/>Whadjuk Noongar boodja.<br/><span style={{fontSize:12,color:T.accentDim}}>Rooting practice in 45,000+ years of spiritual tending.</span></p>
      </div>
    </div>
  );
}

// ============================================================
// APP
// ============================================================
export default function App(){
  const[tab,setTab]=useState("practice");
  const[timerDur,setTimerDur]=useState(300);
  const[theme,setTheme]=useState(()=>getBlendedTheme());

  // Update theme every 60s for smooth time-of-day transitions
  useEffect(()=>{
    const id=setInterval(()=>setTheme(getBlendedTheme()),60000);
    return()=>clearInterval(id);
  },[]);

  const goTimer=(s)=>{setTimerDur(s);setTab("timer")};

  return(
    <ThemeContext.Provider value={theme}>
      <div style={{minHeight:"100vh",background:`linear-gradient(${theme.gradAngle||"170deg"},${theme.bg1} 0%,${theme.bg2} 40%,${theme.bg3} 100%)`,color:theme.text,fontFamily:"'EB Garamond',Georgia,serif",transition:"background 2s ease"}}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&display=swap');
          *{box-sizing:border-box;margin:0;padding:0}
          body{margin:0;background:${theme.bg1};-webkit-font-smoothing:antialiased;transition:background 2s ease}
          ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:${theme.accentGlow}0.12);border-radius:3px}
          button{cursor:pointer}button:active{transform:scale(0.97)}
        `}</style>
        <Nav active={tab} setActive={setTab}/>
        <QuoteBar/>
        {tab==="practice"&&<PracticeTab goTimer={goTimer}/>}
        {tab==="timer"&&<TimerTab initialDuration={timerDur}/>}
        {tab==="research"&&<ResearchTab/>}
        {tab==="seasons"&&<SeasonsTab/>}
        <div style={{textAlign:"center",padding:"36px 20px 20px",borderTop:`1px solid ${theme.border}`,marginTop:32,transition:"all 1.5s"}}>
          <p style={{fontSize:13,color:theme.accentDim,fontStyle:"italic",lineHeight:1.6}}>You simply have more clouds — and therefore, more sky.</p>
        </div>
      </div>
    </ThemeContext.Provider>
  );
}
