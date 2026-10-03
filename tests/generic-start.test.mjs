import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createGenericTracker} from '../lib/generic-start.ts';
import {applyAction,dates,today,scheduled} from '../lib/tracker.ts';
import {validateTrackerBackup} from '../lib/android-backup.ts';

test('fresh generic arc uses device date and has no personal history or goals',()=>{
 const now=new Date(2027,2,14,23,40),s=createGenericTracker(now);
 assert.equal(s.config.start,today(now));assert.equal(dates(s).length,90);
 assert.equal(s.config.name,'Your name');assert.equal(s.habits.length,8);
 assert.deepEqual(s.tasks,[]);assert.deepEqual(s.goals,[]);
 for(const key of ['checks','logs','reviews'])assert.deepEqual(s[key],{});
 assert.doesNotMatch(JSON.stringify(s),/rutvik|jarwix|sensinova|primez|hanuman|naam|chalisa|linkedin/i);
 assert.deepEqual(validateTrackerBackup(s),s);
 s.habits[0].name='Changed';assert.equal(createGenericTracker(now).habits[0].name,'Plan the day');
});
test('users can add and reschedule their own habits without changing starter data',()=>{
 const s=createGenericTracker(),value={name:'Practice piano',group:'evening',days:[0,2,4],definition:'Practice a piece.'};
 const next=applyAction(s,{type:'addHabit',id:'my-habit',value});assert.equal(s.habits.length,8);
 assert.equal(next.habits.length,9);assert.equal(next.habits.at(-1).name,'Practice piano');
 assert.equal(scheduled(next.habits.at(-1),'2026-10-05'),true);assert.equal(scheduled(next.habits.at(-1),'2026-10-06'),false);
 for(const bad of [{...value,name:''},{...value,days:[]},{...value,days:[7]},{...value,group:'unknown'}])assert.throws(()=>applyAction(s,{type:'addHabit',id:'bad',value:bad}));
 assert.throws(()=>applyAction(next,{type:'addHabit',id:'my-habit',value}));
 assert.deepEqual(validateTrackerBackup(next),next);
});
test('optional goals start blank, remain editable and can be removed',()=>{
 let s=applyAction(createGenericTracker(),{type:'addGoal',id:'pages',name:'Books read',unit:'books'});
 assert.equal(s.goals[0].target,null);
 s=applyAction(s,{type:'goal',id:'pages',key:'target',value:6});
 assert.equal(s.goals[0].target,6);assert.deepEqual(validateTrackerBackup(s),s);
 assert.equal(applyAction(s,{type:'removeGoal',id:'pages'}).goals.length,0);
 assert.throws(()=>applyAction(s,{type:'addGoal',id:'empty',name:' '}));
});
