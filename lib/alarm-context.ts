import {dates,scheduled,type Tracker} from './tracker.ts';
export type AlarmSource={label:string;detail:string;dates:string[]};
export function alarmContext(state:Tracker):Record<string,AlarmSource>{
 const arc=dates(state),result:Record<string,AlarmSource>={};
 for(const h of state.habits)result['habit:'+h.id]={label:h.name,detail:h.definition.split('\n\n')[0].slice(0,320),dates:arc.filter(d=>scheduled(h,d)&&!state.checks[d]?.[h.id])};
 for(const t of state.tasks)result['task:'+t.id]={label:t.title,detail:t.definition.slice(0,320),dates:t.done?[]:arc.filter((d,i)=>t.date?d===t.date:Math.floor(i/7)+1===t.week)};
 return result;
}
