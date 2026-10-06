package com.rutvik.winterarc;

import android.Manifest;
import android.app.*;
import android.content.*;
import android.content.pm.PackageManager;
import android.media.AudioManager;
import android.os.Build;
import androidx.core.app.NotificationManagerCompat;
import org.json.*;
import java.util.TimeZone;

public final class ArcAlarmStore {
    static final String CHANNEL = "winter-arc-ringing-alarms-v1";
    static final String FIRE = "com.rutvik.winterarc.ALARM_FIRE";
    static final String DISMISS = "com.rutvik.winterarc.ALARM_DISMISS";
    static final String STOP_ALL = "com.rutvik.winterarc.ALARM_STOP_ALL";
    static final String SNOOZE = "com.rutvik.winterarc.ALARM_SNOOZE";
    static final String CLOSED = "com.rutvik.winterarc.ALARM_CLOSED";
    static final int TEST_ID = 99999, SNOOZE_OFFSET = 100000;
    static android.content.SharedPreferences prefs(Context c) { return c.getSharedPreferences("winter_arc_alarms", Context.MODE_PRIVATE); }
    static AlarmManager manager(Context c) { return (AlarmManager)c.getSystemService(Context.ALARM_SERVICE); }
    static boolean exact(Context c) { return Build.VERSION.SDK_INT < 31 || manager(c).canScheduleExactAlarms(); }
    static void channel(Context c) {
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationChannel channel = new NotificationChannel(CHANNEL, "Ringing alarms", NotificationManager.IMPORTANCE_HIGH);
            channel.setDescription("Scheduled alarms with a ringing screen, snooze and dismiss. Alarm volume controls the sound.");
            channel.setSound(null, null); channel.enableVibration(false);
            ((NotificationManager)c.getSystemService(Context.NOTIFICATION_SERVICE)).createNotificationChannel(channel);
        }
    }
    static boolean notifications(Context c) {
        channel(c);
        if (!NotificationManagerCompat.from(c).areNotificationsEnabled()) return false;
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationChannel ch = ((NotificationManager)c.getSystemService(Context.NOTIFICATION_SERVICE)).getNotificationChannel(CHANNEL);
            if (ch != null && ch.getImportance() < NotificationManager.IMPORTANCE_HIGH) return false;
        }
        return Build.VERSION.SDK_INT < 33 || c.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED;
    }
    static boolean fullscreen(Context c) { return Build.VERSION.SDK_INT < 34 || ((NotificationManager)c.getSystemService(Context.NOTIFICATION_SERVICE)).canUseFullScreenIntent(); }
    static JSONArray all(Context c) { try { return new JSONArray(prefs(c).getString("alarms", "[]")); } catch (JSONException e) { return new JSONArray(); } }
    static JSONObject find(Context c, int id) { JSONArray list=all(c); for(int i=0;i<list.length();i++){JSONObject a=list.optJSONObject(i);if(a!=null&&a.optInt("id")==id)return a;}return null; }
    static JSONObject context(Context c) { try{return new JSONObject(prefs(c).getString("context","{}"));}catch(Exception e){return new JSONObject();} }
    static JSONObject source(Context c,JSONObject a) {return context(c).optJSONObject(a.optString("source"));}
    static String label(Context c,JSONObject a) {JSONObject src=source(c,a);return src==null?a.optString("label","Winter Arc alarm"):src.optString("label",a.optString("label"));}
    static String detail(Context c,JSONObject a) {JSONObject src=source(c,a);return src==null?"Time for a small promise to yourself.":src.optString("detail","Open your tracker to complete this task.");}
    static long nextAt(Context c,JSONObject a) {
        if(a.optString("source").isEmpty())return AlarmTime.next(a.optString("time"),a.optInt("days"),System.currentTimeMillis(),TimeZone.getDefault());
        JSONObject src=source(c,a);if(src==null)return 0;
        JSONArray dates=src.optJSONArray("dates");if(dates==null)return 0;long next=Long.MAX_VALUE;
        for(int i=0;i<dates.length();i++){String date=dates.optString(i);if(!a.optString("date").isEmpty()&&!a.optString("date").equals(date))continue;
            long at=AlarmTime.onDate(date,a.optString("time"),TimeZone.getTimeZone("Asia/Kolkata"));if(at>System.currentTimeMillis())next=Math.min(next,at);}
        return next==Long.MAX_VALUE?0:next;
    }
    static boolean due(Context c,JSONObject a) {
        if(a.optString("source").isEmpty())return true;
        JSONObject src=source(c,a);if(src==null)return false;
        java.text.SimpleDateFormat format=new java.text.SimpleDateFormat("yyyy-MM-dd",java.util.Locale.ROOT);format.setTimeZone(TimeZone.getTimeZone("Asia/Kolkata"));String today=format.format(new java.util.Date());
        if(!a.optString("date").isEmpty()&&!today.equals(a.optString("date")))return false;
        JSONArray dates=src.optJSONArray("dates");if(dates!=null)for(int n=0;n<dates.length();n++)if(today.equals(dates.optString(n)))return true;return false;
    }
    static JSONObject test() { JSONObject a=new JSONObject();try{a.put("id",TEST_ID).put("label","Test alarm").put("enabled",true);}catch(JSONException ignored){}return a; }
    static PendingIntent pending(Context c, int id) {
        Intent intent=new Intent(c,ArcAlarmReceiver.class).setAction(FIRE).putExtra("id",id);
        return PendingIntent.getBroadcast(c,id,intent,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
    }
    static void scheduleAt(Context c,int id,long at) {
        if(!exact(c))throw new IllegalStateException("Allow Alarms & reminders in Android Settings first.");
        PendingIntent show=PendingIntent.getActivity(c,0,new Intent(c,MainActivity.class),PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
        manager(c).setAlarmClock(new AlarmManager.AlarmClockInfo(at,show),pending(c,id));
    }
    static void schedule(Context c,JSONObject a) {
        if(a.optBoolean("enabled")){long at=nextAt(c,a);if(at>0)scheduleAt(c,a.optInt("id"),at);else manager(c).cancel(pending(c,a.optInt("id")));}
    }
    static void cancel(Context c,int id) { manager(c).cancel(pending(c,id)); manager(c).cancel(pending(c,id+SNOOZE_OFFSET));prefs(c).edit().remove("snooze_"+id).apply(); }
    static synchronized void replace(Context c,JSONArray next) throws JSONException {
        boolean active=false;
        for(int i=0;i<next.length();i++){JSONObject a=next.getJSONObject(i);AlarmTime.next(a.getString("time"),a.getInt("days"),System.currentTimeMillis(),TimeZone.getDefault());active|=a.optBoolean("enabled");}
        if(active&&(!exact(c)||!notifications(c))) {
            for(int i=0;i<next.length();i++){JSONObject a=next.getJSONObject(i),before=find(c,a.optInt("id"));if(a.optBoolean("enabled")&&(before==null||!before.toString().equals(a.toString())))throw new IllegalStateException("Allow notifications and Alarms & reminders before enabling an alarm.");}
        }
        JSONArray old=all(c);
        if(!prefs(c).edit().putString("alarms",next.toString()).commit())throw new IllegalStateException("Could not save alarms. Please try again.");
        // Only changed/removed alarms lose their pending snooze. Unrelated edits leave it alone.
        for(int i=0;i<old.length();i++){
            JSONObject before=old.getJSONObject(i),after=find(c,before.getInt("id"));
            if(after==null||!before.toString().equals(after.toString())){
                cancel(c,before.getInt("id"));
                ArcAlarmService.cancel(c,before.getInt("id"));
            }
        }
        try{if(exact(c)&&notifications(c))for(int i=0;i<next.length();i++)schedule(c,next.getJSONObject(i));}
        catch(RuntimeException e){
            for(int i=0;i<next.length();i++)cancel(c,next.getJSONObject(i).getInt("id"));
            prefs(c).edit().putString("alarms",old.toString()).commit();
            restore(c);throw e;
        }
    }
    static synchronized void restore(Context c) {
        if(!exact(c)||!notifications(c))return;
        JSONArray list=all(c);
        for(int i=0;i<list.length();i++)try{
            JSONObject a=list.getJSONObject(i);schedule(c,a);int id=a.getInt("id");
            long snoozed=prefs(c).getLong("snooze_"+id,0);
            if(a.optBoolean("enabled")&&snoozed>System.currentTimeMillis())scheduleAt(c,id+SNOOZE_OFFSET,snoozed);
            else prefs(c).edit().remove("snooze_"+id).apply();
        }catch(Exception ignored){}
    }
    static synchronized boolean snooze(Context c,int id) {
        if(id==TEST_ID||!exact(c))return false;
        JSONObject a=find(c,id);if(a==null||!a.optBoolean("enabled"))return false;
        long at=System.currentTimeMillis()+5*60*1000L;
        try{scheduleAt(c,id+SNOOZE_OFFSET,at);prefs(c).edit().putLong("snooze_"+id,at).apply();return true;}catch(RuntimeException e){return false;}
    }
}
