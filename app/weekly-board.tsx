'use client';

import {useEffect,useRef,useState} from 'react';
import {Check,ChevronLeft,ChevronRight,CircleHelp,Flame,Minus,Moon,Sun,Compass,Settings2,ChevronDown} from 'lucide-react';
import {Checkbox} from '@/components/ui/checkbox';
import {Popover,PopoverContent,PopoverTrigger} from '@/components/ui/popover';
import {type Habit,type Tracker,dates,score,scheduled,streak,formatDate,dayNumber,habitGroup} from '@/lib/tracker';

const groups=[
 {key:'morning',title:'Morning',icon:Sun,},
 {key:'focus',title:'Focus',icon:Compass,},
 {key:'evening',title:'Evening',icon:Moon,}
];

type Props={state:Tracker;date:string;current:string;onDate:(date:string)=>void;onToggle:(id:string,date:string,done:boolean)=>void;onEdit:()=>void};

function Definition({habit,matrix=false}:{habit:Habit;matrix?:boolean}){
 return <Popover><PopoverTrigger asChild>{matrix?<button className="ledger-habit-name" aria-label={'Habit details: '+habit.name}><span>{habit.name}</span><CircleHelp size={14} aria-hidden="true"/></button>:<button className="habit-info" aria-label={'What counts for '+habit.name}><CircleHelp size={17} aria-hidden="true"/></button>}</PopoverTrigger><PopoverContent className="habit-popover" align="start"><strong>{habit.name}</strong><p>{habit.definition}</p></PopoverContent></Popover>;
}

export default function WeeklyBoard({state,date,current,onDate,onToggle,onEdit}:Props){
 const [filter,setFilter]=useState<'all'|'todo'|'done'>('all');
 const [view,setView]=useState<'day'|'week'>('day');
 const [collapsed,setCollapsed]=useState<string[]>(['focus','evening']);
 useEffect(()=>{const open=(event:Event)=>{const id=(event as CustomEvent<string>).detail;const habit=state.habits.find(h=>h.id===id);if(!habit)return;setView('day');setFilter('all');setCollapsed(groups.filter(g=>g.key!==habitGroup(habit)).map(g=>g.key));requestAnimationFrame(()=>{const element=document.getElementById(`day-${date}-${id}`);element?.scrollIntoView({block:'center',behavior:window.matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'});element?.focus({preventScroll:true})})};window.addEventListener('winter-arc-open-habit',open);return()=>window.removeEventListener('winter-arc-open-habit',open)},[state.habits,date]);
 const [last,setLast]=useState<{habit:Habit;date:string;done:boolean}|null>(null);
 useEffect(()=>{
  try{
   const saved=JSON.parse(localStorage.getItem('winter-arc-routine-view')||'null');
   if(saved){
    if(saved.view==='day'||saved.view==='week')setView(saved.view);
    if(['all','todo','done'].includes(saved.filter))setFilter(saved.filter);
    if(Array.isArray(saved.collapsed))setCollapsed(saved.collapsed.filter((g:unknown)=>['morning','focus','evening'].includes(String(g))));
   }else{
    const hour=Number(new Intl.DateTimeFormat('en-GB',{hour:'2-digit',hourCycle:'h23'}).format(new Date()));
    const currentGroup=hour<12?'morning':hour<18?'focus':'evening';
    setCollapsed(groups.filter(g=>g.key!==currentGroup).map(g=>g.key));
   }
  }catch{}
 },[]);
 const remember=(changes:Partial<{view:'day'|'week';filter:'all'|'todo'|'done';collapsed:string[]}>)=>{
  const next={view,filter,collapsed,...changes};setView(next.view);setFilter(next.filter);setCollapsed(next.collapsed);
  try{localStorage.setItem('winter-arc-routine-view',JSON.stringify(next))}catch{}
 };
 const root=useRef<HTMLElement>(null),ds=dates(state),week=Math.ceil(dayNumber(state.config.start,date)/7),weekDates=ds.slice((week-1)*7,week*7),future=date>current;
 const ordered=groups.flatMap(group=>state.habits.filter(h=>habitGroup(h)===group.key&&(h.active||weekDates.some(d=>scheduled(h,d)))));
 const daily=ordered.filter(h=>scheduled(h,date));
 const completed=future?0:daily.filter(h=>state.checks[date]?.[h.id]).length;
 const matches=(h:Habit)=>filter==='all'||(scheduled(h,date)&&(filter==='done'?(!future&&!!state.checks[date]?.[h.id]):(future||!state.checks[date]?.[h.id])));
 const toggle=(habit:Habit,d:string,done:boolean)=>{
  onToggle(habit.id,d,done);setLast({habit,date:d,done});
  if(filter==='all'||d!==date)return;
  const i=ordered.findIndex(h=>h.id===habit.id),next=[...ordered.slice(i+1),...ordered.slice(0,i)].find(h=>h.id!==habit.id&&matches(h));
  requestAnimationFrame(()=>{
   const mobile=view==='day'||window.matchMedia('(max-width:899px)').matches;
   const target=next?root.current?.querySelector<HTMLButtonElement>(`#${mobile?'day':'matrix'}-${d}-${next.id}`):root.current?.querySelector<HTMLButtonElement>(`[data-filter=${filter}]`);
   if(target&&!target.disabled&&target.getClientRects().length)target.focus();else root.current?.querySelector<HTMLButtonElement>(`[data-filter=${filter}]`)?.focus();
  });
 };
 const undo=()=>{
  if(!last)return;const previous=last;onToggle(previous.habit.id,previous.date,!previous.done);remember({filter:'all',collapsed:collapsed.filter(g=>g!==habitGroup(previous.habit))});setLast(null);
  requestAnimationFrame(()=>{
   const mobile=view==='day'||window.matchMedia('(max-width:899px)').matches;
   const selector=`#${mobile?'day':'matrix'}-${previous.date}-${previous.habit.id}`;
   root.current?.querySelector<HTMLButtonElement>(selector)?.focus();
  });
 };
 const moveWeek=(offset:number)=>onDate(ds[Math.max(0,Math.min(89,dayNumber(state.config.start,date)-1+offset*7))]);
 const visibleWeekly=ordered.filter(h=>weekDates.some(d=>scheduled(h,d))&&matches(h));
 const visibleDaily=daily.filter(matches);
 const keyboardCell=(e:React.KeyboardEvent<HTMLButtonElement>,habit:Habit,d:string)=>{
  const directions:Record<string,[number,number]>={ArrowLeft:[0,-1],ArrowRight:[0,1],ArrowUp:[-1,0],ArrowDown:[1,0]};
  if(!directions[e.key])return;e.preventDefault();
  const [vertical,horizontal]=directions[e.key];let r=visibleWeekly.findIndex(h=>h.id===habit.id),c=weekDates.indexOf(d);
  while(true){r+=vertical;c+=horizontal;if(r<0||r>=visibleWeekly.length||c<0||c>=weekDates.length)return;
   const target=root.current?.querySelector<HTMLButtonElement>(`#matrix-${weekDates[c]}-${visibleWeekly[r].id}`);
   if(target&&!target.disabled){target.focus();return}
  }
 };
 return <section className="weekly-board" data-view={view} ref={root} aria-labelledby="board-title">
  <div className="board-toolbar"><div className="board-period"><h2 id="board-title">{view==='day'?'Your daily routine':'Week '+String(week).padStart(2,'0')}</h2><span>{formatDate(weekDates[0])}–{formatDate(weekDates.at(-1)!)}</span></div><div className="board-tools"><div className="routine-view-toggle" role="group" aria-label="Routine layout"><button aria-pressed={view==='day'} onClick={()=>remember({view:'day'})}>Day</button><button aria-pressed={view==='week'} onClick={()=>remember({view:'week'})}>Week</button></div><div className="routine-filters" role="group" aria-label="Filter habits for selected day">{(['all','todo','done'] as const).map(value=><button key={value} data-filter={value} aria-pressed={filter===value} onClick={()=>remember({filter:value})}>{value==='all'?'All':value==='todo'?'Remaining':'Done'}<span className="filter-count">{value==='all'?daily.length:value==='todo'?daily.length-completed:completed}</span></button>)}</div><div className="board-week-controls"><button disabled={week===1} aria-label="Previous week" onClick={()=>moveWeek(-1)}><ChevronLeft size={18}/></button><button disabled={week===13} aria-label="Next week" onClick={()=>moveWeek(1)}><ChevronRight size={18}/></button></div></div></div>
  <div className="mobile-week" ref={node=>{if(node){const selected=node.querySelector<HTMLElement>('[aria-pressed=true]');if(selected&&node.scrollWidth>node.clientWidth)node.scrollLeft=Math.max(0,selected.offsetLeft-node.clientWidth/2+selected.offsetWidth/2)}}} style={{gridTemplateColumns:`repeat(${weekDates.length},minmax(44px,1fr))`}}>{weekDates.map(d=><button key={d} aria-label={'Open '+formatDate(d,{weekday:'long',day:'numeric',month:'long'})+(d>current?', upcoming':`, ${score(state,d).done} of ${score(state,d).total} complete`)} aria-pressed={d===date} onClick={()=>onDate(d)}><span>{d===current?'Today':formatDate(d,{weekday:'short'})}</span><strong>{Number(d.slice(-2))}</strong><small>{d>current?'—':`${score(state,d).done}/${score(state,d).total}`}</small><i className="week-day-progress" aria-hidden="true" style={{width:`${d>current?0:score(state,d).rate*100}%`}}/></button>)}</div>
  <div className="matrix-wrap"><table className="habit-matrix"><caption className="sr-only">Week {week} habit tracker. Checked means completed. Dashes are rest days. Future checkboxes are disabled. Arrow keys move between available checkboxes.</caption><colgroup><col className="habit-name-col"/>{weekDates.map(d=><col key={d}/>)}</colgroup><thead><tr><th scope="col" className="matrix-axis-label">HABIT / DAY</th>{weekDates.map(d=>{const summary=score(state,d);return <th scope="col" key={d} data-selected={d===date}><button onClick={()=>onDate(d)} aria-pressed={d===date} aria-label={'Open '+formatDate(d,{weekday:'long',day:'numeric',month:'long'})+(d>current?', upcoming':`, ${score(state,d).done} of ${score(state,d).total} complete`)}><span>{d===current?'Today':formatDate(d,{weekday:'short'})}</span><strong>{Number(d.slice(-2))}</strong><small>{d>current?'Upcoming':`${summary.done}/${summary.total}`}</small><i className="week-day-progress" aria-hidden="true" style={{width:`${d>current?0:summary.rate*100}%`}}/></button></th>})}</tr></thead>{groups.map(group=>{
   const items=visibleWeekly.filter(h=>habitGroup(h)===group.key);if(!items.length)return null;const Icon=group.icon;
   return <tbody key={group.key} className={'ledger-group '+group.key}><tr className="matrix-group-label"><th colSpan={weekDates.length+1} scope="rowgroup"><Icon size={14} aria-hidden="true"/>{group.title}</th></tr>{items.map(h=>{const run=streak(state,h,date<current?date:current);return <tr key={h.id}><th scope="row"><Definition habit={h} matrix/>{run>0&&<small className="ledger-streak"><Flame size={12} aria-hidden="true"/>{run} day streak</small>}</th>{weekDates.map(d=>{const due=scheduled(h,d),upcoming=d>current,done=!upcoming&&!!state.checks[d]?.[h.id];return <td key={d} data-selected={d===date} className={!due?'rest-cell':''}>{due?<Checkbox id={`matrix-${d}-${h.id}`} className={'matrix-check '+(upcoming?'upcoming-check':'')} checked={done} disabled={upcoming} aria-label={`${h.name}, ${formatDate(d)}${upcoming?', upcoming':''}`} onCheckedChange={v=>toggle(h,d,v===true)} onKeyDown={e=>keyboardCell(e,h,d)}/>:<span className="rest-mark"><Minus size={13} aria-hidden="true"/><span className="sr-only">Rest day</span></span>}</td>})}</tr>})}</tbody>})}</table>{!visibleWeekly.length&&<div className="board-empty">{filter==='done'?'No completed habits on this day yet.':filter==='all'?'No active habits scheduled for this week.':daily.length?'Everything scheduled for this day is complete.':'No habits scheduled for this day.'}</div>}</div>
  <div className="mobile-routine">{groups.map(group=>{
   const all=daily.filter(h=>habitGroup(h)===group.key),items=visibleDaily.filter(h=>habitGroup(h)===group.key);if(!all.length)return null;
   const Icon=group.icon,doneInGroup=future?0:all.filter(h=>state.checks[date]?.[h.id]).length,open=!collapsed.includes(group.key);
   return <section className={'day-group ledger-group '+group.key} key={group.key}>
    <h3><button className="day-group-toggle" aria-expanded={open} aria-controls={'routine-'+group.key} onClick={()=>remember({collapsed:open?[...collapsed,group.key]:collapsed.filter(g=>g!==group.key)})}><Icon size={18} aria-hidden="true"/><span>{group.title}<small>{doneInGroup} of {all.length} complete</small></span><strong>{all.length===doneInGroup?'All done':`${all.length-doneInGroup} left`}</strong><ChevronDown size={18} className={open?'expanded':''} aria-hidden="true"/></button></h3>
    <div id={'routine-'+group.key} hidden={!open} className="day-group-items">{items.map(h=>{
     const done=!future&&!!state.checks[date]?.[h.id],run=streak(state,h,date<current?date:current);
     return <div className={'day-habit '+(done?'is-done':'')} key={h.id}><Checkbox id={`day-${date}-${h.id}`} checked={done} disabled={future} aria-label={h.name} className="day-check" onCheckedChange={v=>toggle(h,date,v===true)}/><label htmlFor={`day-${date}-${h.id}`}><strong>{h.name}</strong><small>{done?'Completed':future?'Upcoming':h.category}{run>0&&<span><Flame size={11} aria-hidden="true"/>{run}d</span>}</small></label><Definition habit={h}/></div>
    })}{!items.length&&<p className="group-empty">{filter==='done'?'Nothing checked off here yet.':'Everything in this section is complete.'}</p>}</div>
   </section>;
  })}{!daily.length&&<div className="board-empty">No habits scheduled. A rest day.</div>}<button className="expand-routine" onClick={()=>remember({collapsed:collapsed.length?[]:groups.map(g=>g.key)})}>{collapsed.length?'Expand all sections':'Collapse all sections'}</button></div>
  <div className="board-footer"><div className="board-legend"><span><Check size={12} aria-hidden="true"/>Done</span><span><Minus size={12} aria-hidden="true"/>Rest</span><span className="legend-future">Future dates open on their day</span></div><button onClick={onEdit}><Settings2 size={14} aria-hidden="true"/>Edit routine</button></div>
  <div className="board-feedback"><span>{last?`${last.habit.name} ${last.done?'completed':'reopened'} · ${formatDate(last.date)}`:''}</span>{last&&<button onClick={undo}>Undo</button>}</div>
  <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">{last?(`${last.habit.name} ${last.done?'completed':'reopened'} on ${formatDate(last.date)}.`): ''}</span>
 </section>
}
