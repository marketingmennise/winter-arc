import type {Habit,Tracker} from './tracker';
import {importReferenceHabits} from './reference-habits.ts';

export const PERSONAL_ROUTINE_UPDATE='rutvik-personal-routine-2026-10-02';
const daily=[0,1,2,3,4,5,6];
const protein:Habit={
 id:'H26',name:'Protein goal · 120 g',category:'Nutrition',group:'evening',active:true,days:daily,
 definition:'Aim for about 120 g of protein across the day. This is an editable starting target for your confirmed weight of about 86 kg and regular workouts, not a vegetarian-diet checkbox. Use food labels or a food log to estimate grams. Spread protein across meals using foods such as tofu, soy, paneer, milk or curd, and dals or beans. Edit the target if your needs change.'
};
const linkedIn:Habit={
 id:'H27',name:'LinkedIn · publish a post',category:'Personal brand',group:'focus',active:true,days:[1,4],
 definition:'Publish two original posts per week on your personal LinkedIn profile. Tuesday and Friday are the planned posting days; change the weekdays in Settings to fit your routine. Share a practical marketing or AI lesson, a useful example, or a case study. Deliberate drafting and publishing do not count toward recreational scrolling.'
};

// Apply once to each saved tracker. Retired habits/check-ins remain in storage.
export function applyPersonalRoutine(state:Tracker):Tracker {
 const base=importReferenceHabits(state);
 if(base.contentUpdates?.includes(PERSONAL_ROUTINE_UPDATE))return base;
 const next=structuredClone(base);
 for(const habit of next.habits){
  if(['H04','H08','H11'].includes(habit.id))habit.active=false;
  if(habit.id==='H17'){
   habit.name='Water goal · 2.5 L';
   habit.definition='An editable step up from your usual 2 L: aim for around 2.5 litres of water, spread across the day. Adjust for heat, exercise and other drinks; more is not automatically better. Use thirst and pale-yellow urine as practical hydration guides. Follow any personalised fluid advice you have been given.';
  }
  if(habit.id==='H12'){
   habit.name='Recreational scrolling · '+next.config.social+' min';
   habit.definition='Keep recreational feeds, Reels and Shorts to '+next.config.social+' minutes per day. Intentional work, LinkedIn drafting or publishing, focused learning and family messages do not count. Stop the timer when the purposeful task is finished.\n\nReference: avoid unnecessary scrolling and endless scrolling before sleep.';
  }
 }
 if(!next.habits.some(h=>h.id===protein.id)){
  const index=next.habits.findIndex(h=>h.id==='H04');
  next.habits.splice(index<0?next.habits.length:index+1,0,structuredClone(protein));
 }
 if(!next.habits.some(h=>h.id===linkedIn.id))next.habits.push(structuredClone(linkedIn));
 next.contentUpdates=[...new Set([...(next.contentUpdates??[]),PERSONAL_ROUTINE_UPDATE])];
 return next;
}
