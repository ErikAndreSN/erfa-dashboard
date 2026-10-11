import {CompanyLogo} from './CompanyLogo'
import React,{useState} from 'react'
import {ArrowRight,Check,ChevronRight,Wallet,CalendarDays,Download,BookOpen,Eye,EyeOff,Sparkles} from 'lucide-react'
import {Card} from './components/arc/card/card'
import {Progress} from './components/arc/progress/progress'
import './overview.css'
interface Quest {id:number;title:string;company:string;amount:number;category:string;deadline:string;match:number;applicants:number;stage?:number}
interface Experience {id:number;title:string;company:string;kind:string;date:string}
interface Profile {name:string;study:string;school:string;location:string;bio:string;skills:string}
interface Props {navigate:(page:string)=>void;openTask:(task:string)=>void;findQuest:(title:string)=>void;exportIncome:()=>void;quests:Quest[];experiences:Experience[];earnings:{month:string;amount:number}[];profile:Profile;applied:number[];editProfile:()=>void;addExperience:()=>void}
const money=(n:number)=>new Intl.NumberFormat('nb-NO').format(n)
export function AssignmentFocusCard({quest:q,onOpen}:{quest:Quest;onOpen:()=>void}){
 return <button className="sh-focus-card" onClick={onOpen}>
    <span className="sh-focus-top"><CompanyLogo name={q.company}/><span className="status-badge status-progress"><i/>Pågår</span></span>
    <span className="sh-focus-eyebrow">Din neste leveranse · {q.company}</span>
    <strong>{q.title}</strong>
    <span className="sh-focus-meta"><span><Wallet size={15}/>{money(q.amount)} kr</span><span><CalendarDays size={15}/>Frist {q.deadline}</span></span>
    <ol className="sh-steps" aria-label="Fremdrift i oppdraget">{['Avtalt','I arbeid','Levert','Attest'].map((step,i)=><li key={step} className={i===0?'is-done':i===1?'is-current':undefined} aria-current={i===1?'step':undefined}><span>{i===0&&<Check size={12} strokeWidth={3}/>}</span>{step}</li>)}</ol>
    <span className="sh-focus-cta">Fortsett oppdraget <ArrowRight size={16}/></span>
 </button>
}
export function ApplicationRow({quest:q,onOpen}:{quest:Quest;onOpen:()=>void}){
 return <button className="sh-app" onClick={onOpen}><span className="sh-row"><CompanyLogo name={q.company}/><span><strong>{q.title}</strong><small>{q.company} · {money(q.amount)} kr</small></span><ChevronRight size={17}/></span><ol className="sh-steps sh-steps-mini" aria-label="Status for søknaden">{['Sendt','Vurderes','Svar'].map((step,i)=><li key={step} className={i<(q.stage??0)?'is-done':i===(q.stage??0)?'is-current':undefined} aria-current={i===(q.stage??0)?'step':undefined}><span>{i<(q.stage??0)&&<Check size={11} strokeWidth={3}/>}</span>{step}</li>)}</ol></button>
}
export function ApplicationStack({quests,onOpen}:{quests:Quest[];onOpen:()=>void}){
 return <button className="sh-stack" style={{'--n':quests.length} as React.CSSProperties} onClick={onOpen} aria-label={'Se søknadene dine ('+quests.length+')'}>{quests.map((q,i)=><span key={q.id} className="sh-stack-card" style={{'--i':i} as React.CSSProperties} aria-hidden={i>0||undefined}><CompanyLogo name={q.company}/><span><strong>{q.title}</strong><small>{q.company} · {money(q.amount)} kr</small></span><span className={'sh-stack-status'+((q.stage??0)>0?' is-review':'')}>{(q.stage??0)>0?'Vurderes':'Sendt'}</span></span>)}</button>
}
export function StudentOverview({navigate,openTask,findQuest,exportIncome,quests,applied,earnings}:Props){
 const [hidden,setHidden]=useState(false)
 const topMonth=Math.max(...earnings.map(e=>e.amount))
 const recommendations=quests.filter(q=>q.id!==1&&q.id!==2&&!applied.includes(q.id))
 const applications=quests.filter(q=>q.id===2||(q.id!==1&&applied.includes(q.id)))
 return <div className="student-overview sh-overview">
  <div className="overview-content-grid">
   {quests.slice(0,1).map(q=><AssignmentFocusCard key={q.id} quest={q} onOpen={()=>openTask('assignment')}/>)}
   <Card hoverLift={false} title="Din inntekt" className="overview-panel income-overview"><button className="overview-icon-link" aria-label={hidden?'Vis inntekt':'Skjul inntekt'} onClick={()=>setHidden(!hidden)}>{hidden?<EyeOff size={17}/>:<Eye size={17}/>}</button><p className="panel-subtitle">Inntekt for 2026</p><div className="overview-income-number">{hidden?'•• •••':money(28500)}<span>kr</span></div><div className="income-goal"><span><b>4 av 5 oppdrag</b><span>Neste mål: 5</span></span><Progress value={4} max={5} label="Fullførte oppdrag mot neste mål"/><p>Bygg momentum med ett oppdrag til.</p></div><div className="sh-income-bars" aria-label="Inntekt per måned">{earnings.map((e,i)=><span key={e.month} className={i===earnings.length-1?'is-current':undefined}><b><i style={{height:e.amount/topMonth*100+'%'}} title={hidden?e.month:e.month+': '+money(e.amount)+' kr'}/></b><small>{e.month}</small></span>)}</div><div className="sh-income-links"><button onClick={exportIncome}><Download size={15}/>Last ned rapport</button><button onClick={()=>openTask('tax')}><BookOpen size={15}/>Inntekt & ENK<ChevronRight size={14}/></button></div></Card>
   <section className="sh-list-card">
    <div className="sh-list-head"><div><h2>Anbefalt for deg</h2><p><Sparkles size={13}/>Basert på ferdighetene dine</p></div><button className="sh-link" onClick={()=>navigate('Finn oppdrag')}>Se alle <ArrowRight size={14}/></button></div>
    {recommendations.map(q=><button className="sh-row" key={q.id} onClick={()=>findQuest(q.title)}><CompanyLogo name={q.company}/><span><strong>{q.title}</strong><small>{q.company} · {money(q.amount)} kr</small></span><span className="sh-chip sh-chip-match">{q.match} % match</span><ChevronRight size={17}/></button>)}
    {!recommendations.length&&<p className="sh-empty">Du har søkt på alle anbefalingene.</p>}
   </section>
   <section className="sh-list-card">
    <div className="sh-list-head"><div><h2>Søknadene dine</h2><p>{applications.length} {applications.length===1?'søknad venter':'søknader venter'} på svar</p></div><button className="sh-link" onClick={()=>navigate('Søknader')}>Se alle <ArrowRight size={14}/></button></div>
    <ApplicationStack quests={applications} onOpen={()=>navigate('Søknader')}/>
   </section>
  </div>
  <p className="overview-demo-note">Eksempelprofil · Oppdrag og beløp er demodata.</p>
 </div>
}
