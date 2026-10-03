package com.rutvik.winterarc;

import android.app.*;
import android.content.*;
import android.content.pm.ServiceInfo;
import android.media.*;
import android.net.Uri;
import android.os.*;
import androidx.core.app.NotificationCompat;
import org.json.JSONObject;

public class ArcAlarmService extends Service {
    static volatile int activeId=-1;
    static final int NOTIFICATION=81001;
    MediaPlayer player; Vibrator vibrator; PowerManager.WakeLock wake;
    final java.util.LinkedHashSet<Integer> waiting=new java.util.LinkedHashSet<>();
    final Handler handler=new Handler(Looper.getMainLooper());
    @Override public IBinder onBind(Intent i){return null;}
    static PendingIntent action(Context c,String action,int id){return PendingIntent.getService(c,id,new Intent(c,ArcAlarmService.class).setAction(action).putExtra("id",id),PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);}
    @Override public int onStartCommand(Intent i,int flags,int startId){
        if(i==null){stopSelf();return START_NOT_STICKY;}
        int id=i.getIntExtra("id",-1);
        if(ArcAlarmStore.DISMISS.equals(i.getAction())||ArcAlarmStore.SNOOZE.equals(i.getAction())){
            // An old notification must never dismiss a newer ringing alarm.
            if(id==activeId){
                if(ArcAlarmStore.SNOOZE.equals(i.getAction())&&!ArcAlarmStore.snooze(this,id))missed(this,id,"Alarm dismissed","Snooze unavailable. Check Alarms & reminders access.");
                nextOrStop();
            }else {waiting.remove(id);if(activeId<0)stopSelf();}
            return START_NOT_STICKY;
        }
        JSONObject alarm=id==ArcAlarmStore.TEST_ID?ArcAlarmStore.test():ArcAlarmStore.find(this,id);
        if(alarm==null||!alarm.optBoolean("enabled")||!ArcAlarmStore.notifications(this)||(id!=ArcAlarmStore.TEST_ID&&!ArcAlarmStore.due(this,alarm))){if(activeId<0)stopSelf();return START_NOT_STICKY;}
        if(activeId>=0){if(activeId!=id)waiting.add(id);return START_NOT_STICKY;}
        release(); activeId=id;
        String label=ArcAlarmStore.label(this,alarm);
        ArcAlarmStore.channel(this);
        Intent screen=new Intent(this,ArcAlarmActivity.class).putExtra("id",id).putExtra("label",label).putExtra("detail",ArcAlarmStore.detail(this,alarm)).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK|Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent open=PendingIntent.getActivity(this,id,screen,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
        NotificationCompat.Builder n=new NotificationCompat.Builder(this,ArcAlarmStore.CHANNEL)
            .setSmallIcon(com.rutvik.winterarc.R.drawable.ic_notification).setContentTitle(label)
            .setContentText("Ringing · tap to open, snooze or dismiss")
            .setCategory(NotificationCompat.CATEGORY_ALARM).setPriority(NotificationCompat.PRIORITY_MAX)
            .setOngoing(true).setVisibility(NotificationCompat.VISIBILITY_PRIVATE).setContentIntent(open)
            .setFullScreenIntent(open,true).addAction(0,"Dismiss",action(this,ArcAlarmStore.DISMISS,id));
        if(id!=ArcAlarmStore.TEST_ID)n.addAction(0,"Snooze 5 min",action(this,ArcAlarmStore.SNOOZE,id));
        if(Build.VERSION.SDK_INT>=29)startForeground(NOTIFICATION,n.build(),ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);else startForeground(NOTIFICATION,n.build());
        wake=((PowerManager)getSystemService(POWER_SERVICE)).newWakeLock(PowerManager.PARTIAL_WAKE_LOCK,"WinterArc:alarm");wake.acquire(6*60*1000L);
        AudioAttributes audio=new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_ALARM).setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION).build();
        try{
            Uri uri=RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
            if(uri==null)uri=RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
            player=new MediaPlayer();player.setAudioAttributes(audio);player.setDataSource(this,uri);player.setLooping(true);player.prepare();player.start();
        }catch(Exception e){missed(this,id,label,"Alarm sound unavailable. Vibration is still active; check your alarm sound in Android Settings.");}
        vibrator=(Vibrator)getSystemService(VIBRATOR_SERVICE);
        if(vibrator!=null&&vibrator.hasVibrator()){
            long[] pattern={0,600,400,600,1400};
            if(Build.VERSION.SDK_INT>=26)vibrator.vibrate(VibrationEffect.createWaveform(pattern,0),audio);else vibrator.vibrate(pattern,0,audio);
        }
        handler.postDelayed(()->{missed(this,id,label,"Missed alarm · silenced after 5 minutes");nextOrStop();},5*60*1000L);
        return START_NOT_STICKY;
    }
    static void cancel(Context c,int id){if(activeId>=0)c.startService(new Intent(c,ArcAlarmService.class).setAction(ArcAlarmStore.DISMISS).putExtra("id",id));}
    void nextOrStop(){
        int previous=activeId;release();activeId=-1;sendBroadcast(new Intent(ArcAlarmStore.CLOSED).setPackage(getPackageName()).putExtra("id",previous));
        while(!waiting.isEmpty()){
            int next=waiting.iterator().next();waiting.remove(next);JSONObject a=next==ArcAlarmStore.TEST_ID?ArcAlarmStore.test():ArcAlarmStore.find(this,next);
            if(a!=null&&a.optBoolean("enabled")&&ArcAlarmStore.due(this,a)){onStartCommand(new Intent(this,ArcAlarmService.class).putExtra("id",next),0,0);return;}
        }
        stopSelf();
    }
    static void missed(Context c,int id,String label,String message){
        ArcAlarmStore.channel(c);
        PendingIntent open=PendingIntent.getActivity(c,0,new Intent(c,MainActivity.class),PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
        try{((NotificationManager)c.getSystemService(NOTIFICATION_SERVICE)).notify(82000+id,new NotificationCompat.Builder(c,ArcAlarmStore.CHANNEL).setSmallIcon(R.drawable.ic_notification).setContentTitle(label).setContentText(message).setAutoCancel(true).setContentIntent(open).build());}catch(SecurityException ignored){}
    }
    void release(){handler.removeCallbacksAndMessages(null);if(player!=null){try{player.stop();}catch(Exception ignored){}player.release();player=null;}if(vibrator!=null)vibrator.cancel();if(wake!=null&&wake.isHeld())wake.release();}
    @Override public void onDestroy(){int id=activeId;waiting.clear();release();activeId=-1;stopForeground(STOP_FOREGROUND_REMOVE);sendBroadcast(new Intent(ArcAlarmStore.CLOSED).setPackage(getPackageName()).putExtra("id",id));super.onDestroy();}
}
