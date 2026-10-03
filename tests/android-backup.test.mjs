import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseTrackerBackup,validateTrackerBackup,backupSummary,OrderedTrackerWriter,MAX_BACKUP_BYTES} from '../lib/android-backup.ts';
const seed=JSON.parse(readFileSync(new URL('../lib/seed.json',import.meta.url)));
const fixture=()=>structuredClone(seed);

test('web backup round trip preserves real entries and optional history',()=>{
 const s=fixture();s.logs['2026-10-01']={sleep:0,mood:10,priority:'My priority',journal:'My reflection'};s.tasks[0].done=true;s.tasks[0].notes='Keep my notes';s.recitations={'2026-10-03':4};s.activity={'2026-10-03':{cycling:true,other:false}};s.contentUpdates=['imported'];s.appliedEditIds=['my-id'];s.textEditRevisions={'log:2026-10-01:priority':{time:123,id:'my-id'}};s.habits[0].scheduleBefore={date:'2026-10-03',active:false,days:[1,3]};s.habits[0].startsOn='2026-10-01';
 const next=parseTrackerBackup(JSON.stringify(s));assert.deepEqual(next,s);assert.notEqual(next,s);assert.equal(backupSummary(next).completedTasks,1);assert.equal(backupSummary(next).checkinDays,1);
});
test('invalid input, snapshots and oversized files cannot replace tracker data',()=>{
 for(const bad of ['not JSON','null','[]','{}',JSON.stringify({state:fixture(),version:2})])assert.throws(()=>parseTrackerBackup(bad),/Invalid Winter Arc backup/);
 assert.throws(()=>parseTrackerBackup(' '.repeat(MAX_BACKUP_BYTES+1)),/larger than 2 MB/);
});
test('calendar dates and required numeric ranges are validated',()=>{
 for(const start of ['2026-02-31','2026-13-01','not-a-date','2100-02-01']){const s=fixture();s.config.start=start;assert.throws(()=>validateTrackerBackup(s),/Invalid Winter Arc backup/)}
 for(const log of [{sleep:-1},{sleep:25},{mood:0},{energy:11},{motivation:1.5},{sleep:NaN}]){const s=fixture();s.logs={'2026-10-01':log};assert.throws(()=>validateTrackerBackup(s),/allowed range/)}
 const s=fixture();s.logs={'2026-10-01':{sleep:7.3}};assert.equal(validateTrackerBackup(s).logs['2026-10-01'].sleep,7.3,'valid historical web sleep decimals are preserved');
});
test('duplicate IDs, broken schedules and nonboolean completions are rejected',()=>{
 let s=fixture();s.habits.push(structuredClone(s.habits[0]));assert.throws(()=>validateTrackerBackup(s),/unique/);
 s=fixture();s.tasks.push(structuredClone(s.tasks[0]));assert.throws(()=>validateTrackerBackup(s),/unique/);
 for(const days of [[],[7],[0,0],['1']]){s=fixture();s.habits[0].days=days;assert.throws(()=>validateTrackerBackup(s),/Invalid Winter Arc backup/)}
 s=fixture();s.checks={'2026-10-01':{H01:'yes'}};assert.throws(()=>validateTrackerBackup(s),/true or false/);
});
test('prototype keys and deeply nested unknown input are rejected',()=>{
 const text=JSON.stringify(fixture()).replace('{','{"__proto__":{"polluted":true},');assert.throws(()=>parseTrackerBackup(text),/unsupported property/);assert.equal({}.polluted,undefined);
 const s=fixture();let node={};s.extra=node;for(let i=0;i<22;i++)node=node.next={};assert.throws(()=>validateTrackerBackup(s),/nested too deeply/);
});
test('ordered writes prevent an older slow snapshot from winning',async()=>{
 const written=[],status=[];let release;const gate=new Promise(resolve=>release=resolve);
 const writer=new OrderedTrackerWriter(async state=>{if(state.config.name==='First')await gate;written.push(state.config.name)},value=>status.push(value));
 const a=fixture();a.config.name='First';const b=fixture();b.config.name='Second';const first=writer.save(a),second=writer.save(b);b.config.name='Mutated after enqueue';
 await Promise.resolve();assert.deepEqual(written,[]);release();await Promise.all([first,second]);assert.deepEqual(written,['First','Second']);assert.equal(writer.hasPending(),false);assert.equal(status.at(-1).durable,true);
});
test('a later complete snapshot recovers earlier failed edits',async()=>{
 let count=0;const written=[];const writer=new OrderedTrackerWriter(async state=>{if(++count===1)throw new Error('Storage full');written.push(state)});
 const a=fixture();a.logs={'2026-10-01':{sleep:7.5}};const b=structuredClone(a);b.logs['2026-10-01'].mood=9;
 const first=writer.save(a),second=writer.save(b);await assert.rejects(first,/Storage full/);await second;assert.deepEqual(written[0].logs,b.logs);assert.equal(writer.hasPending(),false);
});
test('retry persists the latest failed snapshot without losing edits',async()=>{
 let available=false,persisted;const states=[];const writer=new OrderedTrackerWriter(async state=>{if(!available)throw new Error('Unavailable');persisted=state},value=>states.push(value));
 const s=fixture();s.logs={'2026-10-01':{sleep:0,priority:'Keep this'}};await assert.rejects(writer.save(s),/Unavailable/);assert.equal(writer.hasPending(),true);assert.equal(states.at(-1).durable,false);
 available=true;await writer.retry();assert.deepEqual(persisted.logs,s.logs);assert.equal(writer.hasPending(),false);assert.equal(states.at(-1).error,'');
});
