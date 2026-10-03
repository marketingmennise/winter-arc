import {Checkbox} from '@/components/ui/checkbox';
import {dates,formatDate,type Tracker} from '@/lib/tracker';
export default function WeeklyCommitment({state,week,current,onToggle,onPlan}:{state:Tracker;week:number;current:string;onToggle:(id:string,done:boolean)=>void;onPlan:()=>void}){
 const ds=dates(state).slice((week-1)*7,week*7),tasks=state.tasks.filter(t=>t.week===week),upcoming=ds[0]>current;
 return <section className="weekly-commitments" aria-labelledby="commitments-title"><div className="commitments-heading"><div><p className="eyebrow">WEEK {week}</p><h2 id="commitments-title">Your weekly priorities</h2></div><span>{formatDate(ds[0])}–{formatDate(ds.at(-1)!)}</span></div>
 {tasks.length?<div className="personal-week-items">{tasks.map(task=><label className="personal-week-item" key={task.id}><Checkbox className="habit-checkbox" checked={task.done} disabled={upcoming} aria-label={task.title} onCheckedChange={value=>onToggle(task.id,value===true)}/><span><strong>{task.title}</strong><small>{task.project}</small></span></label>)}</div>:<p className="muted">No priorities yet. Add a task you want to finish this week.</p>}
 <button className="text-link" style={{minHeight:48,marginTop:12}} onClick={onPlan}>Plan this week</button></section>;
}
