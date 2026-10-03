'use client';

import {useCallback,useEffect,useRef,useState} from 'react';
import {Capacitor} from '@capacitor/core';
import {Preferences} from '@capacitor/preferences';
import {createGenericTracker} from '@/lib/generic-start';
import {applyAction,type Action,type Tracker} from '@/lib/tracker';
import {OrderedTrackerWriter,PHONE_STORAGE_KEY,exportTrackerBackup,parseTrackerBackup,validateTrackerBackup} from '@/lib/android-backup';

function freshTracker(){return createGenericTracker();}
async function readPhone(){return Capacitor.isNativePlatform()?(await Preferences.get({key:PHONE_STORAGE_KEY})).value:localStorage.getItem(PHONE_STORAGE_KEY)}
async function writePhone(state:Tracker){const value=JSON.stringify(state);if(Capacitor.isNativePlatform())await Preferences.set({key:PHONE_STORAGE_KEY,value});else localStorage.setItem(PHONE_STORAGE_KEY,value)}

export default function useTrackerSync(){
 const [state,setState]=useState<Tracker|null>(null),[loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[error,setError]=useState(''),[pendingCount,setPendingCount]=useState(0),[durable,setDurable]=useState(true);
 const ref=useRef<Tracker|null>(null),mounted=useRef(true),opening=useRef<Promise<void>|null>(null),blockedStorage=useRef(false),importing=useRef(false);
 const writer=useRef<OrderedTrackerWriter|null>(null);
 if(!writer.current)writer.current=new OrderedTrackerWriter(writePhone,status=>{if(mounted.current){setPendingCount(status.pendingCount);setSaving(status.saving);setDurable(status.durable);setError(status.error?'Could not save on this phone. Your changes remain on screen. Retry or export a backup before closing. '+status.error:'')}});
 const load=useCallback(()=>{
  if(opening.current)return opening.current;
  if(ref.current&&!blockedStorage.current)return writer.current!.retry().catch(()=>{});
  const job=(async()=>{
   if(mounted.current)setLoading(true);
   try{
    const saved=await readPhone();
    const original=saved===null?null:parseTrackerBackup(saved),next=original??freshTracker();
    blockedStorage.current=false;ref.current=next;
    if(mounted.current){setState(next);setDurable(true);setError('')}
    if(original===null||next!==original)await writer.current!.save(next);
   }catch(e){
    // A failed read must never silently replace a possibly valid existing phone copy.
    if(!ref.current){blockedStorage.current=true;const fallback=freshTracker();ref.current=fallback;if(mounted.current)setState(fallback)}
    if(mounted.current){setDurable(false);setError(blockedStorage.current?'The saved phone copy could not be opened. It has not been changed. Retry storage or import a valid backup in Settings. '+(e instanceof Error?e.message:''): 'Could not save on this phone. Keep the app open and retry, or export a backup.')}
   }finally{if(mounted.current)setLoading(false);opening.current=null}
  })();opening.current=job;return job;
 },[]);
 const act=useCallback(async(action:Action)=>{
  if(!ref.current)throw new Error('Tracker is still loading');
  if(blockedStorage.current)throw new Error('Phone storage needs review. Retry or explicitly import a backup before making changes.');
  if(importing.current)throw new Error('Finish importing your backup before making another change.');
  const next=applyAction(ref.current,action);ref.current=next;if(mounted.current)setState(next);
  await writer.current!.save(next);
 },[]);
 const retry=useCallback(()=>{void load()},[load]);
 const importBackup=useCallback(async(value:Tracker)=>{
  if(importing.current)throw new Error('A backup is already being imported.');
  const next=validateTrackerBackup(value);
  importing.current=true;
  // The replacement is explicit. Keep the same candidate on screen and in the retry
  // queue if storage fails, so retry cannot secretly switch to a different copy.
  blockedStorage.current=false;ref.current=next;if(mounted.current)setState(next);
  try{await writer.current!.save(next);if(mounted.current){setDurable(true);setError('')}}catch{throw new Error('The imported copy is on screen but has not been confirmed saved. Retry phone saving before closing.')}finally{importing.current=false}
 },[]);
 const downloadPending=useCallback(()=>{if(ref.current)void exportTrackerBackup(ref.current).catch(e=>{if(mounted.current)setError(e instanceof Error?e.message:'Could not export your phone backup.')})},[]);
 const hasPending=useCallback(()=>writer.current!.hasPending(),[]);
 useEffect(()=>{
  mounted.current=true;void load();
  const hidden=()=>{if(document.visibilityState==='hidden'&&!blockedStorage.current)void writer.current!.retry().catch(()=>{})};
  const leaving=(event:BeforeUnloadEvent)=>{if(writer.current!.hasPending()){event.preventDefault();event.returnValue=''}};
  document.addEventListener('visibilitychange',hidden);window.addEventListener('beforeunload',leaving);
  return()=>{mounted.current=false;document.removeEventListener('visibilitychange',hidden);window.removeEventListener('beforeunload',leaving)};
 },[load]);
 const saveLabel=blockedStorage.current?'Storage needs review':saving?'Saving on phone…':pendingCount||!durable?'Not saved on phone':'Saved on phone';
 return {state,ref,loading,saving,error,setError,pendingCount,durable,saveLabel,act,load,retry,downloadPending,hasPending,importBackup};
}
