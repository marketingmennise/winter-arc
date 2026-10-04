import type {Config} from './tracker';
export type ConfigErrors=Partial<Record<keyof Config,string>>;
export function configErrors(value:Config):ConfigErrors{
 const errors:ConfigErrors={};
 if(typeof value.name!=='string'||value.name.length>80)errors.name='Use a name of at most 80 characters.';
 const parsed=new Date(value.start+'T12:00:00Z');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(value.start)||!Number.isFinite(parsed.getTime())||parsed.toISOString().slice(0,10)!==value.start||value.start<'2020-01-01'||value.start>'2100-01-01')errors.start='Choose a valid start date from 2020 to 1 January 2100.';
 if(!Number.isFinite(value.target)||value.target<.1||value.target>1)errors.target='Enter a daily target from 10 to 100%.';
 if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(value.wake))errors.wake='Choose a valid wake-up time.';
 if(!Number.isFinite(value.sleep)||value.sleep<1||value.sleep>24||!Number.isInteger(value.sleep*2))errors.sleep='Enter 1 to 24 hours in half-hour steps.';
 if(!Number.isInteger(value.social)||value.social<0||value.social>1440)errors.social='Enter a whole number from 0 to 1440 minutes.';
 return errors;
}
