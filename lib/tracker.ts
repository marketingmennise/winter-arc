export type Habit = {id:string;name:string;category:string;active:boolean;days:number[];definition:string;group?:'morning'|'focus'|'evening';startsOn?:string;scheduleBefore?:{date:string;active:boolean;days:number[]}};
export type Task = {id:string;title:string;project:string;week:number;date?:string;definition:string;done:boolean;notes?:string};
export type Log = {sleep?:number;mood?:number;energy?:number;motivation?:number;priority?:string;journal?:string};
export type Config = {name:string;start:string;target:number;wake:string;sleep:number;social:number};
export type Goal = {id:string;name:string;unit:string;baseline:number|null;target:number|null;current:number|null};
export type Tracker = {config:Config;habits:Habit[];tasks:Task[];checks:Record<string,Record<string,boolean>>;logs:Record<string,Log>;reviews:Record<string,string>;goals:Goal[];contentUpdates?:string[];recitations?:Record<string,number>;activity?:Record<string,{cycling?:boolean;other?:boolean}>;appliedEditIds?:string[];textEditRevisions?:Record<string,{time:number;id:string}>};
export function habitGroup(habit:Habit):'morning'|'focus'|'evening' {
 if(habit.group)return habit.group;
 if(['H01','H02','H03','H04','H06'].includes(habit.id))return 'morning';
 if(['H11','H13','H14','H15','H16'].includes(habit.id))return 'evening';
 return 'focus';
}
export const DAY=86400000;
export function addDays(date:string,n:number){return new Date(new Date(date+'T12:00:00Z').getTime()+n*DAY).toISOString().slice(0,10)}
export function dayNumber(start:string,date:string){return Math.round((Date.parse(date+'T12:00:00Z')-Date.parse(start+'T12:00:00Z'))/DAY)+1}
export function today(now=new Date()){const parts=new Intl.DateTimeFormat('en-GB',{year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);return ['year','month','day'].map(k=>parts.find(p=>p.type===k)?.value).join('-')}
export function weekday(date:string){return (new Date(date+'T12:00:00Z').getUTCDay()+6)%7}
export function dates(s:Tracker){return Array.from({length:90},(_,i)=>addDays(s.config.start,i))}
export function scheduled(h:Habit,d:string){const schedule=h.scheduleBefore&&d<h.scheduleBefore.date?h.scheduleBefore:h;return schedule.active&&(!h.startsOn||d>=h.startsOn)&&schedule.days.includes(weekday(d))}
export const ACTIVITY_START='2020-01-01';
export type ActivityKind='cycling'|'other';
export function activityDates(s:Tracker,week:number,kind:ActivityKind,cutoff=today()){return dates(s).slice((week-1)*7,week*7).filter(d=>d>=ACTIVITY_START&&d<=cutoff&&s.activity?.[d]?.[kind])}
export function score(s:Tracker,d:string){const habits=s.habits.filter(h=>scheduled(h,d));const done=habits.filter(h=>s.checks[d]?.[h.id]).length;return {total:habits.length,done,rate:habits.length?done/habits.length:0}}
export function aggregate(s:Tracker,ds:string[],cutoff=today()){const v=ds.filter(d=>d<=cutoff).map(d=>score(s,d));const total=v.reduce((a,x)=>a+x.total,0),done=v.reduce((a,x)=>a+x.done,0);return{total,done,rate:total?done/total:0}}
export function streak(s:Tracker,h:Habit,cutoff=today()){let count=0;for(const d of dates(s).filter(d=>d<=cutoff).reverse()){if(!scheduled(h,d))continue;if(s.checks[d]?.[h.id])count++;else if(d!==cutoff)break;}return count}
export function arcStreak(s:Tracker,cutoff=today()){let n=0;for(const d of dates(s).filter(d=>d<=cutoff).reverse()){const v=score(s,d);if(!v.total)continue;if(v.rate>=s.config.target)n++;else if(d!==cutoff)break;}return n}
export function average(s:Tracker,key:'sleep'|'mood'|'energy'|'motivation',cutoff=today()){const nums=dates(s).filter(d=>d<=cutoff).map(d=>s.logs[d]?.[key]).filter((n):n is number=>typeof n==='number');return nums.length?nums.reduce((a,b)=>a+b,0)/nums.length:null}
export function formatDate(d:string,opts:Intl.DateTimeFormatOptions={day:'numeric',month:'short'}){return new Intl.DateTimeFormat('en-GB',{...opts,timeZone:'UTC'}).format(new Date(d+'T12:00:00Z'))}
export const pct=(x:number)=>Math.round(x*100)+'%';
export type Action={type:string;[key:string]:unknown};
export function applyAction(state:Tracker,a:Action):Tracker {
 const editId=a.mutationId;if(editId!==undefined&&(typeof editId!=='string'||!/^[-a-zA-Z0-9]{1,100}$/.test(editId)))throw new Error('Invalid edit identifier');
 const editTime=a.mutationTime;if(editTime!==undefined&&(typeof editId!=='string'||typeof editTime!=='number'||!Number.isSafeInteger(editTime)||editTime<0))throw new Error('Invalid edit timestamp');
 if(typeof editId==='string'&&state.appliedEditIds?.includes(editId))return state;
 let s=structuredClone(state);
 const str=(x:unknown,max=5000)=>{if(typeof x!=='string'||x.length>max)throw new Error('Invalid text');return x};
 const id=str(a.id??'',100);const date=typeof a.date==='string'?a.date:'';
 const validDate=()=>{if(!dates(s).includes(date))throw new Error('Choose a date within your 90-day arc')};
 if(a.type==='check'){validDate();const h=s.habits.find(h=>h.id===id);if(!h||!scheduled(h,date)||date>today()||typeof a.done!=='boolean')throw new Error('This habit is not available on that date');s.checks[date]={...s.checks[date],[id]:a.done};}
 else if(a.type==='activity'){validDate();if(date<ACTIVITY_START||date>today()||(a.kind!=='cycling'&&a.kind!=='other')||typeof a.done!=='boolean')throw new Error('Choose an available activity day');s.activity={...s.activity,[date]:{...s.activity?.[date],[a.kind]:a.done}};}
 else if(a.type==='log'){validDate();if(date>today())throw new Error('Future days are not open for check-ins');const key=str(a.key,20);if(!['sleep','mood','energy','motivation','priority','journal'].includes(key))throw new Error('Invalid field');const log={...s.logs[date]};if(a.value===null)delete log[key as keyof Log];else if(key==='priority'||key==='journal')(log as Record<string,unknown>)[key]=str(a.value);else{if(typeof a.value!=='number'||!Number.isFinite(a.value)||a.value<0||a.value>(key==='sleep'?24:10)||(key!=='sleep'&&(!Number.isInteger(a.value)||a.value<1)))throw new Error('Enter a valid score');(log as Record<string,unknown>)[key]=a.value}s.logs[date]=log;}
 else if(a.type==='task'){const task=s.tasks.find(t=>t.id===id);if(!task||typeof a.done!=='boolean')throw new Error('Task not found');task.done=a.done;}
 else if(a.type==='addTask'){const title=str(a.title,200).trim();const project=str(a.project,80).trim();const week=a.week;if(!title||!project||typeof week!=='number'||!Number.isInteger(week)||week<1||week>13||!id)throw new Error('Add a task title and week');if(!s.tasks.some(t=>t.id===id)){if(s.tasks.length>=500)throw new Error('Task limit reached');s.tasks.push({id,title,project,week,definition:str(a.definition??'',2000),done:false})}}
 else if(a.type==='taskNote'){const task=s.tasks.find(t=>t.id===id);if(!task)throw new Error('Task not found');task.notes=str(a.value);}
 else if(a.type==='review'){if(!/^W(0[1-9]|1[0-3])$/.test(id))throw new Error('Invalid week');s.reviews[id]=str(a.value);}
 else if(a.type==='addHabit'){
  const value=a.value as Habit;
  if(!value||!id||s.habits.some(h=>h.id===id)||s.habits.length>=100)throw new Error('Choose a new habit. Up to 100 habits are supported.');
  const name=str(value.name,120).trim();if(!name||!['morning','focus','evening'].includes(value.group??'')||!Array.isArray(value.days)||!value.days.length||!value.days.every(n=>Number.isInteger(n)&&n>=0&&n<=6))throw new Error('Name your habit and choose its scheduled days.');
  s.habits.push({id,name,category:'Personal',group:value.group,active:true,days:[...new Set(value.days)],definition:str(value.definition??'',2000)});
 }
 else if(a.type==='addGoal'){
  const name=str(a.name,120).trim(),unit=str(a.unit??'',40).trim();if(!name||!id||s.goals.some(g=>g.id===id)||s.goals.length>=100)throw new Error('Add a goal name.');
  s.goals.push({id,name,unit,baseline:null,target:null,current:null});
 }
 else if(a.type==='removeGoal'){s.goals=s.goals.filter(g=>g.id!==id);}
 else if(a.type==='habit'){const h=s.habits.find(h=>h.id===id);if(!h)throw new Error('Habit not found');const value=a.value as Partial<Habit>;if(typeof value!=='object'||!value)throw new Error('Invalid habit');if(value.name!==undefined){const n=str(value.name,120).trim();if(!n)throw new Error('Habit needs a name');h.name=n}if(value.group!==undefined){if(!['morning','focus','evening'].includes(value.group))throw new Error('Choose morning, focus or evening.');h.group=value.group}if(value.definition!==undefined)h.definition=str(value.definition,2000);if(value.active!==undefined){if(typeof value.active!=='boolean')throw new Error('Invalid status');h.active=value.active}if(value.days!==undefined){if(!Array.isArray(value.days)||!value.days.every(n=>Number.isInteger(n)&&n>=0&&n<=6)||!value.days.length)throw new Error('Choose at least one weekday');h.days=[...new Set(value.days)]}}
 else if(a.type==='config'){const value=a.value as Config;if(!value||!/^\d{4}-\d{2}-\d{2}$/.test(value.start)||addDays(value.start,0)!==value.start||value.start<'2020-01-01'||value.start>'2100-01-01'||!/^([01]\d|2[0-3]):[0-5]\d$/.test(value.wake)||![value.target,value.sleep,value.social].every(Number.isFinite)||value.target<0.1||value.target>1||value.sleep<1||value.sleep>24||value.social<0||value.social>1440)throw new Error('Check your settings');s.config={...value,name:str(value.name,80).trim()||'Your name'};}
 else if(a.type==='goal'){const goal=s.goals.find(g=>g.id===id);if(!goal)throw new Error('Goal not found');const key=str(a.key,20);if(!['baseline','target','current'].includes(key)||!(a.value===null||(typeof a.value==='number'&&Number.isFinite(a.value)&&a.value>=0)))throw new Error('Enter a valid goal value');(goal as unknown as Record<string,unknown>)[key]=a.value;}
 else throw new Error('Unknown action');
 // Keep authored text order even when requests from separate tabs arrive out of order.
 const textKey=a.type==='taskNote'?`task:${id}`:a.type==='review'?`review:${id}`:a.type==='log'&&(a.key==='priority'||a.key==='journal')?`log:${date}:${a.key}`:null;
 if(textKey&&typeof editTime==='number'&&typeof editId==='string'){
  const previous=state.textEditRevisions?.[textKey];
  if(previous&&(editTime<previous.time||(editTime===previous.time&&editId<=previous.id)))s=structuredClone(state);
  else s.textEditRevisions={...s.textEditRevisions,[textKey]:{time:editTime,id:editId}};
 }
 if(typeof editId==='string')s.appliedEditIds=[...(s.appliedEditIds??[]),editId].slice(-10000);return s;
}
