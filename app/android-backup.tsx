'use client';

import {useRef,useState} from 'react';
import {Download,Upload,ExternalLink,ShieldCheck} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Checkbox} from '@/components/ui/checkbox';
import {type Tracker,formatDate} from '@/lib/tracker';
import {MAX_BACKUP_BYTES,backupSummary,exportTrackerBackup,parseTrackerBackup} from '@/lib/android-backup';

type Props={state:Tracker;onImport:(value:Tracker)=>Promise<void>};
const WEB_TRACKER='https://rutvik-winter-arc.rutvik.chatgpt.site/';
export default function AndroidBackup({state,onImport}:Props){
 const input=useRef<HTMLInputElement>(null);
 const [staged,setStaged]=useState<Tracker|null>(null),[filename,setFilename]=useState(''),[busy,setBusy]=useState(false),[exported,setExported]=useState(false),[confirmed,setConfirmed]=useState(false),[notice,setNotice]=useState(''),[error,setError]=useState('');
 const exportCurrent=async()=>{setBusy(true);setError('');try{const result=await exportTrackerBackup(state);setExported(true);setNotice(result.method==='native-share'?'The backup share sheet opened. Save the JSON file somewhere you can find it before replacing phone data.':'The backup download started. Keep the JSON file before replacing phone data.')}catch(e){setError(e instanceof Error?e.message:'Could not export your backup.')}finally{setBusy(false)}};
 const choose=async(file:File)=>{setError('');setNotice('');setStaged(null);setExported(false);setConfirmed(false);setBusy(true);try{if(file.size>MAX_BACKUP_BYTES)throw new Error('Choose a Winter Arc JSON backup smaller than 2 MB.');const value=parseTrackerBackup(await file.text());setFilename(file.name);setStaged(value)}catch(e){setError(e instanceof Error?e.message:'Could not read this backup.')}finally{setBusy(false)}};
 const replace=async()=>{if(!staged||!exported||!confirmed)return;setBusy(true);setError('');try{await onImport(staged);setStaged(null);setConfirmed(false);setExported(false);setNotice('Backup imported and saved on this phone. Your web tracker was not changed.')}catch(e){setError(e instanceof Error?e.message:'Could not import your backup. Your existing saved copy has not been replaced.')}finally{setBusy(false)}};
 const summary=staged?backupSummary(staged):null;
 return <section className="panel android-backup" aria-labelledby="android-backup-title">
  <div className="panel-header"><h2 id="android-backup-title">Phone data & backups</h2><ShieldCheck size={20} aria-hidden="true"/></div>
  <p className="muted">Your entries save on this phone and work offline. Phone and web copies are separate; they do not sync automatically. Export a JSON backup before uninstalling the app or changing phones.</p>
  <div style={{display:'flex',flexWrap:'wrap',gap:10,margin:'18px 0'}}>
   <Button variant="outline" disabled={busy} onClick={()=>void exportCurrent()}><Download size={16} aria-hidden="true"/>Export phone backup</Button>
   <Button variant="outline" disabled={busy} onClick={()=>input.current?.click()}><Upload size={16} aria-hidden="true"/>Import web or phone backup</Button>
  </div>
  <input ref={input} type="file" accept=".json,application/json" aria-label="Choose Winter Arc backup file" style={{display:'none'}} onChange={event=>{const file=event.currentTarget.files?.[0];event.currentTarget.value='';if(file)void choose(file)}}/>
  {summary&&<div style={{padding:18,border:'1px solid var(--border)',borderRadius:8,margin:'18px 0'}}>
   <h3 style={{fontSize:18}}>Review this backup</h3><p className="muted" style={{overflowWrap:'anywhere',marginTop:8}}>{filename}</p>
   <dl style={{display:'grid',gridTemplateColumns:'minmax(0,1fr) minmax(0,1fr)',gap:'9px 16px',margin:'16px 0',fontSize:14}}>
    <dt>Name</dt><dd style={{overflowWrap:'anywhere'}}>{summary.name}</dd><dt>Arc starts</dt><dd>{formatDate(summary.start,{day:'numeric',month:'short',year:'numeric'})}</dd><dt>Habits / tasks</dt><dd>{summary.habits} / {summary.tasks}</dd><dt>Habit completions</dt><dd>{summary.completedHabits}</dd><dt>Check-in days</dt><dd>{summary.checkinDays}</dd><dt>Completed tasks</dt><dd>{summary.completedTasks}</dd>
   </dl>
   <p className="muted">This replaces the entire phone copy, including its existing entries. It does not merge copies or update the web tracker.</p>
   {!exported&&<Button variant="outline" disabled={busy} onClick={()=>void exportCurrent()} style={{marginTop:16}}><Download size={16} aria-hidden="true"/>First, export current phone data</Button>}
   {exported&&<label style={{display:'flex',alignItems:'center',gap:12,minHeight:44,margin:'16px 0',fontSize:14,cursor:'pointer'}}><Checkbox checked={confirmed} disabled={busy} onCheckedChange={value=>setConfirmed(value===true)} aria-label="I saved my current phone backup" style={{width:44,height:44,flexShrink:0}}/><span>I saved my current phone backup and want to replace this phone’s data.</span></label>}
   <div style={{display:'flex',flexWrap:'wrap',gap:10,marginTop:16}}><Button className="primary-button" disabled={busy||!exported||!confirmed} onClick={()=>void replace()}>{busy?'Working…':'Replace phone data'}</Button><Button variant="outline" disabled={busy} onClick={()=>{setStaged(null);setConfirmed(false);setNotice('')}}>Cancel import</Button></div>
  </div>}
  {notice&&<p role="status" style={{fontSize:14,lineHeight:1.7,color:'var(--mint)',margin:'14px 0'}}>{notice}</p>}
  {error&&<p role="alert" className="field-error" style={{margin:'14px 0',overflowWrap:'anywhere'}}>{error}</p>}
  <a href={WEB_TRACKER} target="_blank" rel="noopener noreferrer" className="text-link" style={{display:'inline-flex',alignItems:'center',gap:8,minHeight:44,marginTop:10}}><ExternalLink size={16} aria-hidden="true"/>Open web tracker</a>
  <p className="muted" style={{fontSize:13,marginTop:8}}>To carry over web entries, export the backup from web Settings and choose that JSON file here. The web tracker opens in your browser and may require sign-in.</p>
 </section>;
}
