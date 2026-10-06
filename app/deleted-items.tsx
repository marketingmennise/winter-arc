import type {Tracker,Action} from '../lib/tracker';
import {Button} from '../components/ui/button';
export default function DeletedItems({state,onRestore}:{state:Tracker;onRestore:(a:Action)=>void}){
 const habits=state.habits.filter(h=>h.deleted),tasks=state.tasks.filter(t=>t.deleted);
 return <section className="panel"><h2>Deleted items</h2><p className="muted">Your notes and check-ins stay saved. Restored habits resume their previous active setting from today; deleted days stay unchanged. Restoring an item makes its enabled alarms eligible again.</p>{!habits.length&&!tasks.length&&<p>No deleted items.</p>}{habits.map(h=><div className="deleted-item" key={h.id}><span><strong>{h.name}</strong><small>Habit</small></span><Button variant="outline" aria-label={'Restore habit '+h.name} onClick={()=>onRestore({type:'restoreHabit',id:h.id})}>Restore</Button></div>)}{tasks.map(t=><div className="deleted-item" key={t.id}><span><strong>{t.title}</strong><small>Task · Week {t.week} · {t.project}</small></span><Button variant="outline" aria-label={'Restore task '+t.title} onClick={()=>onRestore({type:'restoreTask',id:t.id})}>Restore</Button></div>)}</section>;
}
