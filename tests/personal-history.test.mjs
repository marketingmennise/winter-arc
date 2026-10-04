import {test} from 'node:test';
import assert from 'node:assert/strict';
import seed from '../lib/seed.json' with {type:'json'};
import {applyAction,scheduled,score,aggregate,streak,arcStreak,dates} from '../lib/tracker.ts';
import {parseTrackerBackup,validateTrackerBackup} from '../lib/android-backup.ts';
import {alarmContext} from '../lib/alarm-context.ts';
import {configErrors} from '../lib/config-validation.ts';
const now=d=>new Date(d+'T06:00:00Z');
function fixture(){const s=structuredClone(seed);s.habits=[{id:'H01',name:'Daily habit',category:'Routine',definition:'Test',active:true,days:[0,1,2,3,4,5,6]}];s.checks={};s.logs={'2026-10-01':{journal:'Keep this note',sleep:7}};for(const d of dates(s).slice(0,4))s.checks[d]={H01:true};return s;}
test('disabling and rescheduling preserve all earlier scores, streaks, notes and alarm dates',()=>{
 let s=fixture();
 for(const [date,value] of [['2026-10-04',{active:false}],['2026-10-04',{active:true,days:[3]}],['2026-10-06',{days:[0,2,4]}],['2026-10-08',{active:false}]]){
  const before=s,next=applyAction(s,{type:'habit',id:'H01',value},now(date)),past=dates(s).filter(d=>d<date),cutoff=past.at(-1);
  for(const d of past)assert.deepEqual(score(next,d),score(before,d));
  assert.deepEqual(aggregate(next,past,cutoff),aggregate(before,past,cutoff));
  assert.equal(streak(next,next.habits[0],cutoff),streak(before,before.habits[0],cutoff));
  assert.equal(arcStreak(next,cutoff),arcStreak(before,cutoff));
  assert.deepEqual(next.checks,before.checks);assert.deepEqual(next.logs,before.logs);
  assert.deepEqual(parseTrackerBackup(JSON.stringify(next)),next);s=next;
 }
 assert.equal(s.habits[0].scheduleHistory.length,3);
 assert.equal(scheduled(s.habits[0],'2026-10-01'),true);
 assert.equal(scheduled(s.habits[0],'2026-10-09'),false);
 assert.deepEqual(alarmContext(s)['habit:H01'].dates.filter(d=>d>='2026-10-08'),[]);
});
test('legacy scheduleBefore and start dates survive multiple new edits',()=>{
 const s=fixture();s.habits[0].startsOn='2026-10-02';s.habits[0].scheduleBefore={date:'2026-10-03',active:false,days:[0,1,2,3,4,5,6]};
 const next=applyAction(s,{type:'habit',id:'H01',value:{active:false}},now('2026-10-05'));
 assert.equal(scheduled(next.habits[0],'2026-10-01'),false);assert.equal(scheduled(next.habits[0],'2026-10-02'),false);assert.equal(scheduled(next.habits[0],'2026-10-04'),true);assert.equal(scheduled(next.habits[0],'2026-10-05'),false);
 assert.deepEqual(parseTrackerBackup(JSON.stringify(next)),next);
});
test('invalid schedule history backups cannot replace saved data',()=>{
 for(const entries of [[{date:'bad',active:true,days:[0]}],[{date:'2026-10-04',active:true,days:[]}],[{date:'2026-10-04',active:'yes',days:[0]}],[{date:'2026-10-04',active:true,days:[0]},{date:'2026-10-04',active:false,days:[1]}]]){const s=fixture();s.habits[0].scheduleHistory=entries;assert.throws(()=>validateTrackerBackup(s));}
});
test('renaming and description edits do not create or alter schedule history',()=>{
 const s=fixture(),next=applyAction(s,{type:'habit',id:'H01',value:{name:'Renamed',definition:'New definition',days:[6,5,4,3,2,1,0]}},now('2026-10-04'));
 assert.equal(next.habits[0].scheduleHistory,undefined);assert.deepEqual(score(next,'2026-10-01'),score(s,'2026-10-01'));
});
test('sleep setting updates habit title and preserves authored references and records',()=>{
 const s=structuredClone(seed),h=s.habits.find(h=>h.id==='H14');h.definition='Old target\n\nReference: Keep my reference.';
 const next=applyAction(s,{type:'config',value:{...s.config,sleep:8}});
 assert.equal(next.habits.find(h=>h.id==='H14').name,'Sleep routine 8 hours');assert.match(next.habits.find(h=>h.id==='H14').definition,/8 hours/);assert.match(next.habits.find(h=>h.id==='H14').definition,/Reference: Keep my reference/);assert.deepEqual(next.logs,s.logs);
});
test('settings validation identifies each field and rejects blanks, bad dates and steps',()=>{
 const valid=seed.config;assert.deepEqual(configErrors(valid),{});
 for(const [key,value] of [['start','2026-02-30'],['start',''],['target',NaN],['target',.05],['wake','25:00'],['sleep',8.2],['social',1.5]]){const c={...valid,[key]:value};assert.ok(configErrors(c)[key]);assert.throws(()=>applyAction(structuredClone(seed),{type:'config',value:c}));}
});
