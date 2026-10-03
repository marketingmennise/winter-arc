import type {Tracker} from './tracker';

export const MAX_BACKUP_BYTES=2*1024*1024;
export const PHONE_STORAGE_KEY='winter-arc.phone.tracker.v1';
const unsafe=new Set(['__proto__','prototype','constructor']);
function fail(message:string):never{throw new Error('Invalid Winter Arc backup: '+message)}
function object(value:unknown,label:string):Record<string,unknown>{if(!value||typeof value!=='object'||Array.isArray(value))fail(label+' must be an object.');return value as Record<string,unknown>}
function string(value:unknown,label:string,max=5000){if(typeof value!=='string'||value.length>max)fail(label+' must be text of at most '+max+' characters.');return value}
function number(value:unknown,label:string,min:number,max:number,integer=false){if(typeof value!=='number'||!Number.isFinite(value)||value<min||value>max||(integer&&!Number.isInteger(value)))fail(label+' is outside its allowed range.');return value}
function boolean(value:unknown,label:string){if(typeof value!=='boolean')fail(label+' must be true or false.')}
function date(value:unknown,label:string){const s=string(value,label,10),parsed=new Date(s+'T12:00:00Z');if(!/^\d{4}-\d{2}-\d{2}$/.test(s)||s<'2020-01-01'||s>'2100-12-31'||!Number.isFinite(parsed.getTime())||parsed.toISOString().slice(0,10)!==s)fail(label+' must be a valid date.');return s}
function days(value:unknown,label:string){if(!Array.isArray(value)||!value.length||value.length>7||new Set(value).size!==value.length)fail(label+' must contain distinct weekdays.');for(const d of value)number(d,label,0,6,true)}
function list(value:unknown,label:string,max:number){if(!Array.isArray(value)||value.length>max)fail(label+' must be a list with at most '+max+' entries.');return value}
function strings(value:unknown,label:string,max:number){for(const v of list(value,label,max))string(v,label,100)}
function safeKeys(value:unknown,depth=0){if(depth>20)fail('data is nested too deeply.');if(!value||typeof value!=='object')return;if(Array.isArray(value)){for(const item of value)safeKeys(item,depth+1);return}for(const [key,item] of Object.entries(value)){if(unsafe.has(key))fail('unsupported property name.');safeKeys(item,depth+1)}}
function uniqueIds(items:unknown[],label:string){const seen=new Set<string>();for(const item of items){const id=string(object(item,label).id,label+' ID',100);if(!id||seen.has(id))fail(label+' IDs must be nonempty and unique.');seen.add(id)}}
function dateRecord(value:unknown,label:string,check:(value:unknown,label:string)=>void){for(const [key,item] of Object.entries(object(value,label))){date(key,label+' date');check(item,label+' '+key)}}

/** Accept the unwrapped JSON exported by the web tracker, preserving all history. */
export function validateTrackerBackup(value:unknown):Tracker{
 safeKeys(value);
 const s=object(value,'Tracker');
 const c=object(s.config,'Settings');
 string(c.name,'Name',80);if(date(c.start,'Start date')>'2100-01-01')fail('Start date must be on or before 1 January 2100.');number(c.target,'Daily target',0.1,1);number(c.sleep,'Sleep goal',1,24);number(c.social,'Social media target',0,1440);
 if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(string(c.wake,'Wake time',5)))fail('Wake time is invalid.');
 const habits=list(s.habits,'Habits',500);uniqueIds(habits,'Habit');
 for(const item of habits){const h=object(item,'Habit');if(!string(h.name,'Habit name',120).trim())fail('Habit names must not be blank.');string(h.category,'Habit category',100);string(h.definition,'Habit definition',10000);boolean(h.active,'Habit status');days(h.days,'Habit schedule');if(h.group!==undefined&&!['morning','focus','evening'].includes(String(h.group)))fail('Habit group is invalid.');if(h.startsOn!==undefined)date(h.startsOn,'Habit start');if(h.scheduleBefore!==undefined){const before=object(h.scheduleBefore,'Previous habit schedule');date(before.date,'Schedule change date');boolean(before.active,'Previous habit status');days(before.days,'Previous habit weekdays')}}
 const tasks=list(s.tasks,'Tasks',500);uniqueIds(tasks,'Task');
 for(const item of tasks){const t=object(item,'Task');if(!string(t.title,'Task title',200).trim())fail('Task titles must not be blank.');string(t.project,'Task project',80);string(t.definition,'Task definition',10000);number(t.week,'Task week',1,13,true);boolean(t.done,'Task completion');if(t.date!==undefined)date(t.date,'Task date');if(t.notes!==undefined)string(t.notes,'Task notes')}
 dateRecord(s.checks,'Checks',(value,label)=>{for(const [id,done] of Object.entries(object(value,label))){string(id,'Check habit ID',100);boolean(done,label)}});
 dateRecord(s.logs,'Check-ins',(value,label)=>{const log=object(value,label);for(const [key,item] of Object.entries(log)){if(key==='sleep')number(item,'Sleep',0,24);else if(['mood','energy','motivation'].includes(key))number(item,key,1,10,true);else if(key==='priority'||key==='journal')string(item,key);else fail('Unrecognised check-in field '+key+'.')}});
 for(const [key,item] of Object.entries(object(s.reviews,'Reviews'))){if(!/^W(0[1-9]|1[0-3])$/.test(key))fail('Review week is invalid.');string(item,'Review')}
 const goals=list(s.goals,'Goals',100);uniqueIds(goals,'Goal');
 for(const item of goals){const g=object(item,'Goal');string(g.name,'Goal name',200);string(g.unit,'Goal unit',100);for(const key of ['baseline','target','current'])if(g[key]!==null)number(g[key],'Goal '+key,0,Number.MAX_VALUE)}
 if(s.contentUpdates!==undefined)strings(s.contentUpdates,'Content updates',100);
 if(s.appliedEditIds!==undefined)strings(s.appliedEditIds,'Saved edit IDs',10000);
 if(s.recitations!==undefined)dateRecord(s.recitations,'Recitations',(value,label)=>number(value,label,0,7,true));
 if(s.activity!==undefined)dateRecord(s.activity,'Activities',(value,label)=>{for(const [key,item] of Object.entries(object(value,label))){if(key!=='cycling'&&key!=='other')fail('Activity kind is invalid.');boolean(item,label)}});
 if(s.textEditRevisions!==undefined)for(const [key,item] of Object.entries(object(s.textEditRevisions,'Text revisions'))){string(key,'Text revision key',250);const revision=object(item,'Text revision');number(revision.time,'Text revision timestamp',0,Number.MAX_SAFE_INTEGER,true);string(revision.id,'Text revision ID',100)}
 const json=JSON.stringify(s);if(new TextEncoder().encode(json).length>MAX_BACKUP_BYTES)fail('file is larger than 2 MB.');
 return JSON.parse(json) as Tracker;
}

export function parseTrackerBackup(text:string):Tracker{
 if(new TextEncoder().encode(text).length>MAX_BACKUP_BYTES)fail('file is larger than 2 MB.');
 let value:unknown;try{value=JSON.parse(text)}catch{fail('file is not valid JSON.')}return validateTrackerBackup(value);
}
export function backupSummary(state:Tracker){return {name:state.config.name,start:state.config.start,habits:state.habits.length,tasks:state.tasks.length,completedHabits:Object.values(state.checks).reduce((n,row)=>n+Object.values(row).filter(Boolean).length,0),checkinDays:Object.values(state.logs).filter(log=>Object.keys(log).length>0).length,completedTasks:state.tasks.filter(task=>task.done).length}}

export type WriteStatus={pendingCount:number;saving:boolean;durable:boolean;error:string};
/** Serialize complete snapshots: a later successful write also saves earlier edits. */
export class OrderedTrackerWriter{
 private revision=0;
 private persisted=0;
 private queued=0;
 private tail:Promise<void>=Promise.resolve();
 private latest:Tracker|null=null;
 private error='';
 private write:(state:Tracker)=>Promise<void>;
 private changed:(status:WriteStatus)=>void;
 constructor(write:(state:Tracker)=>Promise<void>,changed:(status:WriteStatus)=>void=()=>{}){this.write=write;this.changed=changed}
 get pendingCount(){return this.revision-this.persisted}
 hasPending(){return this.pendingCount>0}
 private emit(){this.changed({pendingCount:this.pendingCount,saving:this.queued>0,durable:this.pendingCount===0,error:this.error})}
 save(state:Tracker){this.latest=structuredClone(state);const revision=++this.revision;return this.attempt(this.latest,revision)}
 retry(){return this.latest&&this.hasPending()?this.attempt(this.latest,this.revision):Promise.resolve()}
 private attempt(state:Tracker,revision:number){const snapshot=structuredClone(state);this.queued++;this.emit();const job=this.tail.catch(()=>{}).then(async()=>{try{await this.write(snapshot);this.persisted=Math.max(this.persisted,revision);this.error=''}catch(e){this.error=e instanceof Error?e.message:'Phone storage is unavailable.';throw e}finally{this.queued--;this.emit()}});this.tail=job;return job}
}

export async function exportTrackerBackup(state:Tracker){
 const data=JSON.stringify(validateTrackerBackup(state),null,2),filename='winter-arc-backup-'+new Date().toISOString().replace(/[:.]/g,'-')+'.json';
 const {Capacitor}=await import('@capacitor/core');
 if(Capacitor.isNativePlatform()){
  const [{Filesystem,Directory,Encoding},{Share}]=await Promise.all([import('@capacitor/filesystem'),import('@capacitor/share')]);
  const file=await Filesystem.writeFile({path:filename,data,directory:Directory.Cache,encoding:Encoding.UTF8});
  await Share.share({title:'Winter Arc backup',text:'Keep this JSON file to restore your phone tracker or carry your entries to another device.',url:file.uri,dialogTitle:'Save your Winter Arc backup'});
  return {filename,method:'native-share' as const};
 }
 const blob=new Blob([data],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=filename;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);return {filename,method:'browser-download' as const};
}
