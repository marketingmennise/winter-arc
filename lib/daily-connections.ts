import type {Habit,Tracker} from './tracker';
import {applyPersonalRoutine} from './personal-routine.ts';

export const DAILY_CONNECTIONS_UPDATE='rutvik-prayer-family-routine-2026-10-02';
export const jarwixConversationId=(week:number)=>'jarwix-conversation-W'+String(week).padStart(2,'0');
const daily=[0,1,2,3,4,5,6];
const additions:Habit[]=[
 {id:'H28',name:'Evening prayer',category:'Spiritual practice',group:'evening',active:true,days:daily,startsOn:'2026-10-02',definition:'Set aside time for your evening prayer. If you recite Hanuman Chalisa here, include those recitations in the separate daily total of seven.'},
 {id:'H29',name:'Hanuman Chalisa · 7 total today',category:'Spiritual practice',group:'evening',active:true,days:daily,startsOn:'2026-10-02',definition:'Recite Hanuman Chalisa seven times in total across the day. Split the seven between morning and evening however you prefer; it is not seven per session. Check this when all seven recitations are complete.'},
 {id:'H30',name:'Phone-free family time · 20 min',category:'Relationships',group:'evening',active:true,days:daily,startsOn:'2026-10-02',definition:'Spend at least 20 minutes with your family with your phone put away. Talk, share a meal, take a walk, or do something together with your full attention.'}
];

// Migrate saved trackers once. Stable IDs preserve completions and later edits.
export function applyDailyConnections(state:Tracker):Tracker {
 const base=applyPersonalRoutine(state);
 if(base.contentUpdates?.includes(DAILY_CONNECTIONS_UPDATE))return base;
 const next=structuredClone(base);
 next.config.social=10;
 const scrolling=next.habits.find(h=>h.id==='H12');
 if(scrolling){
  scrolling.name='Recreational scrolling · 10 min max';
  scrolling.definition='Keep recreational feeds, Reels and Shorts to a maximum of 10 minutes per day. This is a limit, not a quota. Intentional work, LinkedIn drafting or publishing, focused learning and family messages do not count. Use an app timer to help you stop.';
 }
 const morning=next.habits.find(h=>h.id==='H21');
 if(morning){
  morning.name='Morning prayer';
  morning.definition='Begin the day with your morning prayer. If you recite Hanuman Chalisa here, include those recitations in the separate daily total of seven.';
 }
 for(const habit of additions)if(!next.habits.some(h=>h.id===habit.id))next.habits.push(structuredClone(habit));
 for(let week=1;week<=13;week++){
  const id=jarwixConversationId(week);
  if(!next.tasks.some(t=>t.id===id))next.tasks.push({id,week,project:'Jarwix',title:'Jarwix customer conversation · 1 this week',definition:'Have one conversation with a Jarwix customer on any day this arc week. Listen to their experience, understand one problem or need, and note the takeaway and next step below. Check this after the conversation happens.',done:false});
 }
 next.contentUpdates=[...new Set([...(next.contentUpdates??[]),DAILY_CONNECTIONS_UPDATE])];
 return next;
}
