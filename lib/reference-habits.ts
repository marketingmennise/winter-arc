import type {Habit,Tracker} from './tracker';

// Requested additions from the user's Winter Arc reference, 1 October 2026.
// A one-time content update keeps later user edits and deactivations intact.
export const REFERENCE_UPDATE='winter-arc-reference-2026-10-01';
const daily=[0,1,2,3,4,5,6];
export const referenceHabits:Habit[]=[
 {id:'H17',name:'Water · 2 L+',category:'Hydration',group:'evening',active:true,days:daily,definition:'Reference target: drink at least 2 litres of water across the day. Edit the target if needed for your own routine.'},
 {id:'H18',name:'8,000+ steps',category:'Movement',group:'evening',active:true,days:daily,definition:'Reach at least 8,000 steps during the day. This is separate from your scheduled workout or recovery walk.'},
 {id:'H19',name:'Naam Jap · 30 min',category:'Spiritual',group:'morning',active:true,days:daily,definition:'Complete a minimum of 30 minutes of Naam Jap, as listed in your reference plan.'},
 {id:'H20',name:'Spiritual formation · 30 min',category:'Spiritual',group:'evening',active:true,days:daily,definition:'Spend 30 minutes in spiritual practice, separate from Naam Jap. Your reference suggests spiritual reading or scriptures (20–30 min), meditation or silence (10–15 min), satsang or kirtan, and seva (selfless service). Choose the practice for the day.'},
 {id:'H21',name:'Morning prayer & gratitude',category:'Spiritual',group:'morning',active:true,days:daily,definition:'Start the day with prayer and gratitude.'},
 {id:'H22',name:'Make your bed',category:'Home',group:'morning',active:true,days:daily,definition:'Make your bed after getting up.'},
 {id:'H23',name:'Clean your space · 5–10 min',category:'Home',group:'evening',active:true,days:daily,definition:'Spend 5–10 minutes cleaning and organising your room or workspace.'},
 {id:'H24',name:'First 30 min without social media',category:'Focus',group:'morning',active:true,days:daily,definition:'Avoid social media for the first 30 minutes after waking. Start with your morning routine instead.'},
 {id:'H25',name:'Top 3 priorities completed',category:'Routine',group:'evening',active:true,days:daily,definition:'At night, review the three priorities chosen during morning planning. Check this when all three are complete.'}
];

const additions:Record<string,string>={
 H01:'Reference: wake at a fixed time without snoozing.',
 H02:'Reference: a 45–60 minute workout, with recovery or light days. Follow your existing workout and recovery schedule.',
 H04:'Reference: include protein, fruit and vegetables, and limit junk food within your vegetarian meal plan.',
 H05:'Reference: read 10–20 pages or learn for 20–30 minutes, focusing on personal growth and skills.',
 H06:'Reference: choose your top three priorities each morning; review them at night.',
 H12:'Reference: avoid unnecessary scrolling and endless scrolling before sleep.',
 H13:'Reference: reflect at night with gratitude and offer the day to God.',
 H14:'Reference: go to bed on time, avoid late-night scrolling and aim for 7–9 hours of sleep alongside your configured goal.',
 H15:'Reference: review habits, weight, strength and energy; take progress photos and measurements. Make a fuller progress check every 30 days, and celebrate small wins.'
};

export function importReferenceHabits(state:Tracker):Tracker {
 if(state.contentUpdates?.includes(REFERENCE_UPDATE))return state;
 const next=structuredClone(state);
 for(const habit of referenceHabits){
  if(!next.habits.some(h=>h.id===habit.id||h.name.trim().toLowerCase()===habit.name.toLowerCase()))next.habits.push(structuredClone(habit));
 }
 for(const habit of next.habits){const extra=additions[habit.id];if(extra&&!habit.definition.includes(extra))habit.definition=[habit.definition,extra].filter(Boolean).join('\n\n')}
 next.contentUpdates=[...new Set([...(next.contentUpdates??[]),REFERENCE_UPDATE])];
 return next;
}
