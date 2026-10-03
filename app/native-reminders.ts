import {Capacitor} from '@capacitor/core';
import {Preferences} from '@capacitor/preferences';
import {LocalNotifications,type LocalNotificationSchema} from '@capacitor/local-notifications';

export type ReminderSettings={enabled:boolean;movement:boolean;water:boolean;start:string;end:string};
export const defaultReminders:ReminderSettings={enabled:false,movement:true,water:true,start:'09:00',end:'18:00'};
const KEY='winter-arc-reminders-v1',CHANNEL='winter-arc-desk-breaks',BASE=42000,TEST=49999;
export const nativeRemindersAvailable=()=>Capacitor.getPlatform()==='android';
function minuteOfDay(value:string){if(!/^\d{2}:\d{2}$/.test(value))throw new Error('Choose a valid start and finish time.');const[h,m]=value.split(':').map(Number);if(h>23||m>59)throw new Error('Choose a valid time.');return h*60+m;}
export function reminderSlots(settings:ReminderSettings){const start=minuteOfDay(settings.start),end=minuteOfDay(settings.end);if(end<=start)throw new Error('Finish time must be later than start time on the same day.');if(!settings.movement&&!settings.water&&settings.enabled)throw new Error('Choose movement, water, or both.');const slots:number[]=[];for(let at=start;at<end;at+=30)slots.push(at);return slots;}
export async function loadReminderSettings():Promise<ReminderSettings>{try{const {value}=await Preferences.get({key:KEY});if(value){const data=JSON.parse(value),next={...defaultReminders,...data};if(typeof next.enabled==='boolean'&&typeof next.movement==='boolean'&&typeof next.water==='boolean'){reminderSlots(next);return next;}}}catch{}return {...defaultReminders};}
async function channel(){await LocalNotifications.createChannel({id:CHANNEL,name:'Desk breaks',description:'Your half-hour movement and water reminders',importance:3,visibility:1,vibration:false});}
export async function reminderPermission(){if(!nativeRemindersAvailable())return false;return(await LocalNotifications.checkPermissions()).display==='granted';}
function message(s:ReminderSettings){return s.movement&&s.water?{title:'A small reset',body:'Stand up and move briefly. Take a few sips of water if you need them.'}:s.movement?{title:'Time to move',body:'Stand up, stretch gently, or take a short walk away from your desk.'}:{title:'Water check-in',body:'Take a few sips if you need them. Keep working toward your daily water goal.'};}
export function notificationPlan(s:ReminderSettings):LocalNotificationSchema[]{if(!s.enabled)return[];return reminderSlots(s).map(at=>({id:BASE+at,...message(s),channelId:CHANNEL,smallIcon:'ic_notification',iconColor:'#d6efb1',isExactNotification:false,schedule:{on:{hour:Math.floor(at/60),minute:at%60,second:0},allowWhileIdle:true},extra:{kind:'desk-break'}}));}
async function cancelReminders(){const{notifications}=await LocalNotifications.getPending();const owned=notifications.filter(n=>n.id>=BASE&&n.id<BASE+1440);if(owned.length)await LocalNotifications.cancel({notifications:owned.map(n=>({id:n.id}))});}
export async function saveReminderSettings(settings:ReminderSettings,requestPermission=false){
 reminderSlots(settings);
 if(!nativeRemindersAvailable())throw new Error('Phone reminders work in the installed Android app.');
 if(settings.enabled){let permission=await LocalNotifications.checkPermissions();if(permission.display!=='granted'&&requestPermission)permission=await LocalNotifications.requestPermissions();if(permission.display!=='granted')throw new Error('Allow notifications for Winter Arc in Android Settings, then enable reminders here.');}
 await channel();await cancelReminders();
 try{
  if(settings.enabled)await LocalNotifications.schedule({notifications:notificationPlan(settings)});
  await Preferences.set({key:KEY,value:JSON.stringify(settings)});
 }catch(error){
  await cancelReminders();
  await Preferences.set({key:KEY,value:JSON.stringify({...settings,enabled:false})});
  throw new Error('Reminders could not be saved and have been paused. Please try enabling them again.');
 }
 return settings;
}
export async function sendTestReminder(){if(!nativeRemindersAvailable())throw new Error('Install the Android app to test a phone reminder.');let p=await LocalNotifications.checkPermissions();if(p.display!=='granted')p=await LocalNotifications.requestPermissions();if(p.display!=='granted')throw new Error('Notifications are not allowed. You can enable them in Android Settings.');await channel();await LocalNotifications.schedule({notifications:[{id:TEST,title:'Your reminders are ready',body:'This is a test notification. Enable reminders in Settings to schedule desk breaks.',channelId:CHANNEL,smallIcon:'ic_notification',isExactNotification:false}]});}
