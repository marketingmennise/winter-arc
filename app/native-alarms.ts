import {Capacitor,registerPlugin} from '@capacitor/core';
import {LocalNotifications} from '@capacitor/local-notifications';
import type {AlarmSource} from '../lib/alarm-context';
export type ArcAlarm={id:number;label:string;time:string;days:number;enabled:boolean;source?:string;date?:string};
export type AlarmState={alarms:ArcAlarm[];exact:boolean;notifications:boolean;fullscreen:boolean;volume:number;next:number};
export const emptyAlarmState:AlarmState={alarms:[],exact:false,notifications:false,fullscreen:false,volume:0,next:0};
export const ArcAlarms=registerPlugin<{
 getState():Promise<AlarmState>;
 openAccess(o:{type:'exact'|'notifications'|'fullscreen'|'sound'}):Promise<void>;
 save(o:{alarm:ArcAlarm}):Promise<AlarmState>;
 remove(o:{id:number}):Promise<AlarmState>;
 syncContext(o:{context:Record<string,AlarmSource>}):Promise<void>;
 setDesk(o:{slots:number[];label:string}):Promise<void>;
 test():Promise<void>;
 stopRinging():Promise<void>;
}>('ArcAlarms');
export const hasNativeAlarms=()=>Capacitor.getPlatform()==='android';
export async function alarmNotifications(){let p=await LocalNotifications.checkPermissions();if(p.display!=='granted')p=await LocalNotifications.requestPermissions();if(p.display!=='granted')throw new Error('Allow notifications in Android Settings before enabling alarms.');}
export async function setDeskAlarms(slots:number[],label='Desk reset'){if(hasNativeAlarms())await ArcAlarms.setDesk({slots,label});}
let syncQueue=Promise.resolve();
export function syncAlarmContext(context:Record<string,AlarmSource>){if(!hasNativeAlarms())return Promise.resolve();const job=syncQueue.catch(()=>{}).then(()=>ArcAlarms.syncContext({context}));syncQueue=job;return job;}
