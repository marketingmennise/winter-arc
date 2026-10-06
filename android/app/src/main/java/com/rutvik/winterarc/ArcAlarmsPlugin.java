package com.rutvik.winterarc;

import android.content.*;
import android.media.AudioManager;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import androidx.core.content.ContextCompat;
import com.getcapacitor.*;
import com.getcapacitor.annotation.CapacitorPlugin;
import org.json.*;
import java.util.TimeZone;

@CapacitorPlugin(name="ArcAlarms")
public class ArcAlarmsPlugin extends Plugin {
    @PluginMethod public void getState(PluginCall call){
        ArcAlarmStore.restore(getContext());
        JSObject out=new JSObject();JSArray custom=new JSArray();long next=Long.MAX_VALUE;
        JSONArray all=ArcAlarmStore.all(getContext());
        for(int i=0;i<all.length();i++){JSONObject a=all.optJSONObject(i);if(a==null)continue;if(a.optInt("id")<5000)custom.put(a);if(a.optBoolean("enabled"))try{long at=ArcAlarmStore.nextAt(getContext(),a);if(at>0)next=Math.min(next,at);}catch(Exception ignored){}}
        out.put("alarms",custom);out.put("exact",ArcAlarmStore.exact(getContext()));out.put("notifications",ArcAlarmStore.notifications(getContext()));out.put("fullscreen",ArcAlarmStore.fullscreen(getContext()));
        out.put("volume",((AudioManager)getContext().getSystemService(Context.AUDIO_SERVICE)).getStreamVolume(AudioManager.STREAM_ALARM));out.put("next",next==Long.MAX_VALUE?0:next);call.resolve(out);
    }
    @PluginMethod public void syncContext(PluginCall call){
        JSObject context=call.getObject("context");if(context==null){call.reject("Missing routine.");return;}
        if(!ArcAlarmStore.prefs(getContext()).edit().putString("context",context.toString()).commit()){call.reject("Could not update task alarms. Reopen the app to retry.");return;}
        JSONArray list=ArcAlarmStore.all(getContext());
        for(int i=0;i<list.length();i++){JSONObject a=list.optJSONObject(i);if(a!=null&&!a.optString("source").isEmpty()&&!ArcAlarmStore.due(getContext(),a)){
            int id=a.optInt("id");ArcAlarmStore.cancel(getContext(),id);ArcAlarmService.cancel(getContext(),id);
        }}
        ArcAlarmStore.restore(getContext());call.resolve();
    }
    @PluginMethod public void openAccess(PluginCall call){
        String type=call.getString("type","");Intent i;
        if(type.equals("exact")&&Build.VERSION.SDK_INT>=31)i=new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM,Uri.parse("package:"+getContext().getPackageName()));
        else if(type.equals("fullscreen")&&Build.VERSION.SDK_INT>=34)i=new Intent(Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT,Uri.parse("package:"+getContext().getPackageName()));
        else if(type.equals("sound"))i=new Intent(Settings.ACTION_SOUND_SETTINGS);
        else i=new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).putExtra(Settings.EXTRA_APP_PACKAGE,getContext().getPackageName());
        try{getActivity().startActivity(i);call.resolve();}catch(Exception e){call.reject("Open Android Settings manually to allow alarm access.");}
    }
    @PluginMethod public void save(PluginCall call){try{
        JSObject input=call.getObject("alarm");if(input==null)throw new Exception("Choose an alarm time.");
        String label=input.optString("label","").trim();if(label.isEmpty()||label.length()>60)throw new Exception("Name the alarm using 1â€“60 characters.");
        int id=input.optInt("id",0);JSONArray old=ArcAlarmStore.all(getContext()),next=new JSONArray();
        if(id==0){id=1000;for(int n=0;n<old.length();n++){int existing=old.getJSONObject(n).getInt("id");if(existing<5000)id=Math.max(id,existing+1);}if(id>=5000)throw new Exception("Too many alarms.");}
        else if(id<1000||id>=5000||ArcAlarmStore.find(getContext(),id)==null)throw new Exception("Alarm no longer exists. Refresh and try again.");
        int count=0;for(int n=0;n<old.length();n++){JSONObject a=old.getJSONObject(n);if(a.getInt("id")<5000)count++;if(a.getInt("id")!=id)next.put(a);}
        if(input.optInt("id",0)==0&&count>=30)throw new Exception("Keep up to 30 personal alarms. Delete one to add another.");
        JSONObject a=new JSONObject().put("id",id).put("label",label).put("time",input.optString("time")).put("days",input.optInt("days",127)).put("enabled",input.optBoolean("enabled",true));String source=input.optString("source","");String date=input.optString("date","");
        if(!source.isEmpty()&&ArcAlarmStore.context(getContext()).optJSONObject(source)==null)throw new Exception("This habit or task is unavailable. Choose another.");
        if(!date.isEmpty())AlarmTime.onDate(date,input.optString("time"),TimeZone.getTimeZone("Asia/Kolkata"));
        a.put("source",source).put("date",date);if(a.optBoolean("enabled")&&ArcAlarmStore.nextAt(getContext(),a)==0)throw new Exception("No unfinished occurrence remains at that time. Choose a future task date or a different habit.");next.put(a);
        ArcAlarmStore.replace(getContext(),next);getState(call);
    }catch(Exception e){call.reject(e.getMessage());}}
    @PluginMethod public void remove(PluginCall call){try{
        int id=call.getInt("id",0);if(id<1000||id>=5000)throw new Exception("Invalid alarm.");
        JSONArray old=ArcAlarmStore.all(getContext()),next=new JSONArray();for(int n=0;n<old.length();n++)if(old.getJSONObject(n).getInt("id")!=id)next.put(old.getJSONObject(n));
        ArcAlarmStore.replace(getContext(),next);getState(call);
    }catch(Exception e){call.reject(e.getMessage());}}
    @PluginMethod public void setDesk(PluginCall call){try{
        JSONArray old=ArcAlarmStore.all(getContext()),next=new JSONArray();for(int n=0;n<old.length();n++)if(old.getJSONObject(n).getInt("id")<5000)next.put(old.getJSONObject(n));
        JSArray slots=call.getArray("slots",new JSArray());String label=call.getString("label","Desk reset");
        if(slots.length()>48||label.length()>60)throw new Exception("Invalid desk alarm settings.");
        for(int n=0;n<slots.length();n++){int m=slots.getInt(n);if(m<0||m>=1440)throw new Exception("Invalid alarm time.");next.put(new JSONObject().put("id",5000+m).put("label",label).put("time",String.format(java.util.Locale.ROOT,"%02d:%02d",m/60,m%60)).put("days",127).put("enabled",true));}
        ArcAlarmStore.replace(getContext(),next);call.resolve();
    }catch(Exception e){call.reject(e.getMessage());}}
    @PluginMethod public void stopRinging(PluginCall call){
        // Cancels hardware vibration directly as well as stopping the service.
        // Does not delete alarms, snoozes, or tracker records.
        getActivity().runOnUiThread(()->{
            try{
                android.os.Vibrator vibrator=(android.os.Vibrator)getContext().getSystemService(Context.VIBRATOR_SERVICE);
                if(vibrator!=null)vibrator.cancel();
                getContext().startService(new Intent(getContext(),ArcAlarmService.class).setAction(ArcAlarmStore.STOP_ALL));
                call.resolve();
            }catch(Exception e){call.reject("Could not stop ringing. Force stop Winter Arc in Android app settings.");}
        });
    }
    @PluginMethod public void test(PluginCall call){
        if(!ArcAlarmStore.notifications(getContext())){call.reject("Allow notifications before testing an alarm.");return;}
        try{ContextCompat.startForegroundService(getContext(),new Intent(getContext(),ArcAlarmService.class).putExtra("id",ArcAlarmStore.TEST_ID));call.resolve();}catch(Exception e){call.reject("Could not start the test alarm. Check Android Settings.");}
    }
}
