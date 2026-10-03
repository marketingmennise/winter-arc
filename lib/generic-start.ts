import seed from './seed.json' with {type:'json'};
import {today,type Tracker} from './tracker.ts';
export function createGenericTracker(now=new Date()):Tracker{
 const state=structuredClone(seed) as Tracker;
 state.config.start=today(now);
 return state;
}
