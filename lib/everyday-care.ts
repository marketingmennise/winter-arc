import {type Habit,type Tracker} from './tracker.ts';
import {applyActivityRoutine} from './activity-routine.ts';

export const EVERYDAY_CARE_UPDATE='rutvik-everyday-care-2026-10-03';
export const personalCommitmentId=(kind:'catchup'|'enjoyment',week:number)=>`personal-${kind}-W${String(week).padStart(2,'0')}`;
const daily=[0,1,2,3,4,5,6];
const additions:Habit[]=[
 {id:'H31',name:'Night dental care',category:'Self-care',group:'evening',active:true,days:daily,startsOn:'2026-10-03',definition:'Before bed: brush your teeth and clean between them with floss or an interdental brush. Keep the supplies together so the routine is easy to repeat.'},
 {id:'H32',name:'Desk breaks · every 30 min',category:'Movement',group:'focus',active:true,days:daily,startsOn:'2026-10-03',definition:'While working at your desk, stand up and move briefly about every 30 minutes. Mark this at the end of a day when you kept up with your breaks. A day spent away from your desk also counts. Android reminder settings let you choose your desk hours.'}
];
export function applyEverydayCare(state:Tracker):Tracker {
 const base=applyActivityRoutine(state);
 if(base.contentUpdates?.includes(EVERYDAY_CARE_UPDATE))return base;
 const next=structuredClone(base);
 for(const h of additions)if(!next.habits.some(x=>x.id===h.id))next.habits.push(structuredClone(h));
 const water=next.habits.find(h=>h.id==='H17');
 if(water)water.definition+=' Optional Android water reminders run every 30 minutes during your chosen desk hours. They are a prompt to check thirst and sip as needed, not a requirement to drink a fixed amount each time.';
 for(let week=1;week<=13;week++)for(const kind of ['catchup','enjoyment'] as const){
  const id=personalCommitmentId(kind,week);
  if(!next.tasks.some(t=>t.id===id))next.tasks.push({id,week,project:'Personal',title:kind==='catchup'?'Personal catch-up · 1 this week':'Time for enjoyment · 1 hour this week',definition:kind==='catchup'?'Have one intentional call or meet-up with a friend or relative this week. Choose any day and give them your full attention.':'Set aside an hour this week for something you enjoy: music, a hobby, a film, a relaxed outing, or simply play. This is time to enjoy, with no productivity target.',done:false});
 }
 next.contentUpdates=[...new Set([...(next.contentUpdates??[]),EVERYDAY_CARE_UPDATE])];
 return next;
}
