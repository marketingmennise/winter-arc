import {ACTIVITY_START,type Tracker} from './tracker.ts';
import {applyDailyConnections} from './daily-connections.ts';

export const ACTIVITY_ROUTINE_UPDATE='rutvik-malas-movement-2026-10-03';

// Apply once; keep completed entries and the schedule used before this change.
export function applyActivityRoutine(state:Tracker):Tracker {
 const base=applyDailyConnections(state);
 if(base.contentUpdates?.includes(ACTIVITY_ROUTINE_UPDATE))return base;
 const next=structuredClone(base);
 const naam=next.habits.find(h=>h.id==='H19');
 if(naam){naam.name='Naam Jap · 21 malas';naam.definition='Complete 21 malas of Naam Jap in total during the day. Split them across sessions as you prefer. Check this when all 21 malas are complete.';}
 const workout=next.habits.find(h=>h.id==='H02');
 if(workout){
  workout.scheduleBefore={date:ACTIVITY_START,active:workout.active,days:[...workout.days]};
  workout.name='Workout · 6 days/week';workout.active=true;workout.days=[0,1,2,3,4,5];
  workout.definition='Complete your planned workout Monday–Saturday. Sunday is the default rest day; change weekdays in Settings if needed. Cycling or running can be part of a workout day. Record those sessions under Weekly commitments.';
 }
 const recovery=next.habits.find(h=>h.id==='H03');
 if(recovery){
  recovery.scheduleBefore={date:ACTIVITY_START,active:recovery.active,days:[...recovery.days]};
  recovery.active=false;
  recovery.definition+=' The fixed recovery-day checklist was replaced on 3 October 2026 by flexible cycling and running/other activity goals under Weekly commitments. Earlier check-ins remain available.';
 }
 next.contentUpdates=[...new Set([...(next.contentUpdates??[]),ACTIVITY_ROUTINE_UPDATE])];
 return next;
}
