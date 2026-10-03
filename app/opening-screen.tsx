import {ArrowRight,RefreshCw,Snowflake} from 'lucide-react';
import {type Tracker,score,scheduled,habitGroup,formatDate,pct} from '@/lib/tracker';
import {Button} from '@/components/ui/button';

export function OpeningScreen({loading,error,onRetry}:{loading:boolean;error:string;onRetry:()=>void}){
 return <main className="arc-opening"><div className="opening-wordmark"><Snowflake size={24} aria-hidden="true"/>WINTER ARC</div><div className="opening-center"><span className="opening-kicker">YOUR 90-DAY JOURNAL</span><h1>Your time.<br/><em>Your arc.</em></h1><div className="opening-line" aria-hidden="true"><i/></div><p role={loading?'status':'alert'}>{loading?'Getting your day ready…':error||'Your tracker could not open.'}</p>{!loading&&<Button className="primary-button" onClick={onRetry}><RefreshCw size={16}/>Try again</Button>}</div><p className="opening-foot">A little time for what matters.</p></main>;
}

export function DayOpening({state,date,current}:{state:Tracker;date:string;current:string}){
 const future=date>current,v=score(state,date),done=future?0:v.done;
 const hour=Number(new Intl.DateTimeFormat('en-GB',{hour:'2-digit',hourCycle:'h23',timeZone:'Asia/Kolkata'}).format(new Date()));
 const group=hour<12?'morning':hour<18?'focus':'evening';
 const remaining=state.habits.filter(h=>scheduled(h,date)&&!state.checks[date]?.[h.id]);
 const next=remaining.find(h=>habitGroup(h)===group)??remaining[0];
 const greeting=hour<12?'Good morning':hour<18?'Good afternoon':'Good evening';
 const openNext=()=>{if(next)window.dispatchEvent(new CustomEvent('winter-arc-open-habit',{detail:next.id}))};
 return <section className="day-opening" aria-label="Your day at a glance"><div className="day-opening-copy"><p className="eyebrow">{date===current?formatDate(date,{weekday:'long'}):future?'LOOKING AHEAD':'YOUR DAILY JOURNAL'}</p><h2>{date===current?<>{greeting}, <span>{state.config.name.split(' ')[0]}.</span></>:future?'A little room to plan.':'Every check-in counts.'}</h2><p>{future?'Your habits open on this date.':v.total===0?'No habits scheduled. Enjoy your rest day.':done===v.total?'Everything scheduled is complete. Enjoy the rest of your day.':`${v.total-done} habits remaining · ${pct(state.config.target)} daily target`}</p></div><div className="day-opening-ring" role="img" aria-label={`${done} of ${v.total} habits ${future?'planned':'complete'}`}><svg viewBox="0 0 100 100" aria-hidden="true"><circle className="ring-track" cx="50" cy="50" r="43"/><circle className="ring-fill" cx="50" cy="50" r="43" pathLength="100" strokeDasharray={`${future?0:v.rate*100} 100`} transform="rotate(-90 50 50)"/></svg><span><strong>{done}<small>/{v.total}</small></strong><em>{future?'planned':'complete'}</em></span></div>{!future&&next&&<button className="day-next" onClick={openNext}><span><small>UP NEXT</small><strong>{next.name}</strong></span><ArrowRight size={20} aria-hidden="true"/></button>}</section>;
}
