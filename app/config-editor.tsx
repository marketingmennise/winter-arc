import {useId,useRef,useState} from 'react';
import {type Config,addDays,formatDate} from '../lib/tracker';
import {configErrors,type ConfigErrors} from '../lib/config-validation';
import {Button} from '../components/ui/button';
import {Input} from '../components/ui/input';
const fields=[
 {key:'name',label:'Your name',type:'text',maxLength:80},
 {key:'start',label:'Start date',type:'date',min:'2020-01-01',max:'2100-01-01'},
 {key:'target',label:'Daily consistency target · %',type:'number',min:10,max:100,step:1},
 {key:'wake',label:'Wake-up time',type:'time'},
 {key:'sleep',label:'Sleep goal · hours',type:'number',min:1,max:24,step:.5},
 {key:'social',label:'Recreational scrolling · min/day',type:'number',min:0,max:1440,step:1},
] as const;
const asDraft=(c:Config)=>({...c,target:String(Math.round(c.target*100)),sleep:String(c.sleep),social:String(c.social)});
export default function ConfigEditor({config,onSave}:{config:Config;onSave:(c:Config)=>Promise<void>}){
 const [draft,setDraft]=useState(()=>asDraft(config)),[changed,setChanged]=useState(false),[errors,setErrors]=useState<ConfigErrors>({}),[busy,setBusy]=useState(false),[status,setStatus]=useState(''),[saveError,setSaveError]=useState('');
 const form=useRef<HTMLFormElement>(null),prefix=useId();
 const save=async()=>{
  const value:Config={...draft,target:draft.target.trim()?Number(draft.target)/100:NaN,sleep:draft.sleep.trim()?Number(draft.sleep):NaN,social:draft.social.trim()?Number(draft.social):NaN};
  const invalid=configErrors(value);setErrors(invalid);setStatus('');setSaveError('');
  if(Object.keys(invalid).length){form.current?.querySelector<HTMLInputElement>(`[name="${Object.keys(invalid)[0]}"]`)?.focus();return;}
  setBusy(true);
  try{await onSave(value);setDraft(asDraft({...value,name:value.name.trim()||'Rutvik'}));setChanged(false);setStatus('Settings saved.');}
  catch(e){setStatus('');setSaveError(e instanceof Error?e.message:'Could not save. Your edits are still here; try again.');}
  finally{setBusy(false);}
 };
 return <form className="panel" ref={form} noValidate onSubmit={e=>{e.preventDefault();void save();}}><h2>Arc settings</h2><div className="config-fields">{fields.map(({key,label,...input})=><label className={'field '+(errors[key]?'field-invalid':'')} key={key}><span>{label}</span><Input {...input} name={key} value={draft[key]} disabled={busy} aria-invalid={!!errors[key]} aria-describedby={errors[key]?`${prefix}-${key}`:undefined} onChange={e=>{setDraft({...draft,[key]:e.target.value});setChanged(true);setErrors({...errors,[key]:undefined});setStatus('');setSaveError('');}}/>{errors[key]&&<small id={`${prefix}-${key}`} className="field-error" role="alert">{errors[key]}</small>}</label>)}</div><p className="muted">Your arc ends {!configErrors({...config,start:draft.start}).start?formatDate(addDays(draft.start,89)):'after 90 days'}. Moving the start date changes the visible window; existing entries keep their original dates.</p><Button type="submit" className="primary-button" disabled={!changed||busy}>{busy?'Saving…':'Save settings'}</Button>{saveError&&<p role="alert" className="field-error">{saveError}</p>}{status&&<p role="status" className="settings-feedback">{status}</p>}</form>;
}
