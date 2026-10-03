'use client';

import {useState, type ReactNode} from 'react';
import {Check, ListChecks, SlidersHorizontal} from 'lucide-react';

type Props = {habits:ReactNode;checkin:ReactNode;done:number;total:number;logged:number};

export default function JournalWorkspace({habits,checkin,done,total,logged}:Props){
 const [view,setView]=useState<'habits'|'checkin'>('habits');
 return <div className="journal-space" data-view={view}>
  <div className="journal-view-switch" role="group" aria-label="Daily view">
   <button type="button" aria-pressed={view==='habits'} aria-controls="journal-habits" onClick={()=>setView('habits')}><ListChecks size={18} aria-hidden="true"/><span>Habits</span></button>
   <button type="button" aria-pressed={view==='checkin'} aria-controls="journal-checkin" onClick={()=>setView('checkin')}><SlidersHorizontal size={18} aria-hidden="true"/><span>Check-in</span><small aria-label={`${logged} of 4 health values logged`}>{logged===4?<Check size={14} aria-hidden="true"/>:`${logged}/4`}</small></button>
  </div>
  <div className="journal-workspace">
   <div className="journal-habits" id="journal-habits">{habits}</div>
   <div className="journal-checkin" id="journal-checkin">{checkin}</div>
  </div>
 </div>;
}
