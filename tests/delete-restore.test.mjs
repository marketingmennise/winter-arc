import {test} from 'node:test';
import assert from 'node:assert/strict';
import seed from '../lib/seed.json' with {type:'json'};
import {applyAction,scheduled,score,dates} from '../lib/tracker.ts';
import {alarmContext} from '../lib/alarm-context.ts';
import {parseTrackerBackup,validateTrackerBackup} from '../lib/android-backup.ts';
const now=d=>new Date(d+'T06:00:00Z');
test('delete/restore habit preserves scores, check-ins and the deleted interval',()=>{
 const s=structuredClone(seed),id='H01';s.checks['2026-10-01']={[id]:true};s.logs['2026-10-01']={journal:'Preserve me'};
 const deleted=applyAction(s,{type:'deleteHabit',id},now('2026-10-04'));
 for(const d of dates(s).filter(d=>d<'2026-10-04'))assert.deepEqual(score(deleted,d),score(s,d));
 assert.equal(deleted.habits.find(h=>h.id===id).deleted,true);assert.equal(scheduled(deleted.habits.find(h=>h.id===id),'2026-10-04'),false);
 assert.deepEqual(alarmContext(deleted)['habit:'+id].dates,[]);assert.deepEqual(parseTrackerBackup(JSON.stringify(deleted)),deleted);
 assert.deepEqual(deleted.checks,s.checks);assert.deepEqual(deleted.logs,s.logs);
 const restored=applyAction(deleted,{type:'restoreHabit',id},now('2026-10-06')),h=restored.habits.find(h=>h.id===id);
 assert.equal(h.deleted,undefined);assert.equal(scheduled(h,'2026-10-05'),false);assert.equal(scheduled(h,'2026-10-06'),true);
 assert.deepEqual(score(restored,'2026-10-01'),score(s,'2026-10-01'));assert.deepEqual(parseTrackerBackup(JSON.stringify(restored)),restored);
});
test('inactive habits remain inactive on restore and repeat deletion is harmless',()=>{
 const s=structuredClone(seed),h=s.habits.find(h=>!h.active),id=h.id;
 const deleted=applyAction(s,{type:'deleteHabit',id},now('2026-10-04'));
 assert.deepEqual(applyAction(deleted,{type:'deleteHabit',id},now('2026-10-05')),deleted);
 assert.equal(applyAction(deleted,{type:'restoreHabit',id},now('2026-10-06')).habits.find(h=>h.id===id).active,false);
 assert.throws(()=>applyAction(deleted,{type:'habit',id,value:{active:true}}));
});
test('task delete/restore retains notes and completion, suppresses alarms and survives backup',()=>{
 const s=structuredClone(seed),task=s.tasks[0],id=task.id;task.notes='Saved outcome';
 const deleted=applyAction(s,{type:'deleteTask',id});assert.deepEqual(alarmContext(deleted)['task:'+id].dates,[]);
 assert.deepEqual(parseTrackerBackup(JSON.stringify(deleted)),deleted);assert.throws(()=>applyAction(deleted,{type:'task',id,done:true}));
 const restored=applyAction(deleted,{type:'restoreTask',id});assert.deepEqual(restored.tasks[0],task);
 const completed=applyAction(applyAction(s,{type:'task',id,done:true}),{type:'deleteTask',id});
 assert.equal(applyAction(completed,{type:'restoreTask',id}).tasks[0].done,true);
});
test('backup rejects malformed deletion metadata',()=>{
 for(const value of ['true',{},1]){const s=structuredClone(seed);s.tasks[0].deleted=value;assert.throws(()=>validateTrackerBackup(s));}
 const s=structuredClone(seed);s.habits[0].deleted=true;assert.throws(()=>validateTrackerBackup(s));
});
