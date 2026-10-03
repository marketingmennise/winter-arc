'use client';

import {useId,useState} from 'react';
import {Minus,Plus} from 'lucide-react';
import {Input} from '@/components/ui/input';
import type {Log} from '@/lib/tracker';

type HealthKey='sleep'|'mood'|'energy'|'motivation';
type Props={log:Log;goal:number;disabled:boolean;onCommit:(key:HealthKey,value:number|null)=>void};

export default function HealthCheckin({log,goal,disabled,onCommit}:Props){
 const [draft,setDraft]=useState(log.sleep===undefined?'':String(log.sleep));
 const [error,setError]=useState('');
 const id=useId();
 const valid=(value:string)=>value!==''&&Number.isFinite(Number(value))&&Number(value)>=0&&Number(value)<=24&&Number(value)*2===Math.round(Number(value)*2);
 const save=(value:number|null)=>{if(value!==null&&!valid(String(value))){setError('Enter 0–24 hours in half-hour steps.');return}setDraft(value===null?'':String(value));setError('');if(value!==(log.sleep??null))onCommit('sleep',value)};
 const commit=()=>{if(draft===''){save(null);return}if(!valid(draft)){setError('Enter 0–24 hours in half-hour steps.');return}save(Number(draft))};
 return <fieldset disabled={disabled} className="quick-health">
  <legend className="sr-only">Sleep and mindset</legend>
  <div className="sleep-control">
   <div className="health-label"><label htmlFor={id}>Sleep <span>· hours</span></label>{draft!==''&&<button type="button" className="clear-value" onClick={()=>save(null)} aria-label="Clear sleep">Clear</button>}</div>
   <div className="sleep-stepper">
    <button type="button" aria-label="Decrease sleep by half an hour" disabled={!valid(draft)||Number(draft)<=0} onClick={()=>save(Math.max(0,Number(draft)-0.5))}><Minus size={18}/></button>
    <Input id={id} type="number" inputMode="decimal" min={0} max={24} step={0.5} value={draft} placeholder="—" aria-invalid={!!error} aria-describedby={id+'-hint'} onChange={e=>{setDraft(e.target.value);setError('')}} onKeyDown={e=>{if(e.key==='Enter')e.currentTarget.blur()}} onBlur={e=>{if(e.currentTarget.validity.badInput){setError('Enter a valid number.');return}commit()}}/>
    <button type="button" aria-label="Increase sleep by half an hour" disabled={!valid(draft)||Number(draft)>=24} onClick={()=>save(Math.min(24,Number(draft)+0.5))}><Plus size={18}/></button>
   </div>
   <div className="sleep-hint" id={id+'-hint'}>{error?<span className="field-error">{error}</span>:<span>Goal: {goal} hours</span>}{draft===''&&valid(String(goal))&&<button type="button" onClick={()=>save(goal)}>Log {goal} h</button>}</div>
  </div>
  {(['mood','energy','motivation'] as const).map(key=><div className="rating-control" key={key}>
   <div className="health-label"><span id={id+'-'+key}>{key.charAt(0).toUpperCase()+key.slice(1)}</span>{log[key]!==undefined&&<button type="button" className="clear-value" aria-label={'Clear '+key} onClick={()=>onCommit(key,null)}>Clear</button>}</div>
   <div className="rating-options" role="group" aria-labelledby={id+'-'+key} aria-describedby={id+'-scale'}>{Array.from({length:10},(_,i)=><button type="button" key={i} aria-label={`${key} ${i+1} out of 10`} aria-pressed={log[key]===i+1} onClick={()=>onCommit(key,i+1)}>{i+1}</button>)}</div>
  </div>)}
  <p className="field-hint" id={id+'-scale'}>{disabled?'Check-ins open on this date.':'1 = low · 10 = high. Leave unknown values blank.'}</p>
 </fieldset>;
}
