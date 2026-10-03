package com.rutvik.winterarc;

import android.content.*;
import androidx.core.content.ContextCompat;
import org.json.JSONObject;

public class ArcAlarmReceiver extends BroadcastReceiver {
    @Override public void onReceive(Context c,Intent intent) {
        String action=intent.getAction();
        if(!ArcAlarmStore.FIRE.equals(action)){ArcAlarmStore.restore(c);return;}
        int raw=intent.getIntExtra("id",-1),id=raw>=ArcAlarmStore.SNOOZE_OFFSET?raw-ArcAlarmStore.SNOOZE_OFFSET:raw;
        JSONObject a=ArcAlarmStore.find(c,id);
        if(a==null||!a.optBoolean("enabled"))return;
        ArcAlarmStore.prefs(c).edit().remove("snooze_"+id).apply();
        try{ArcAlarmStore.schedule(c,a);}catch(RuntimeException ignored){}
        if(!ArcAlarmStore.notifications(c)||!ArcAlarmStore.due(c,a))return;
        try { ContextCompat.startForegroundService(c,new Intent(c,ArcAlarmService.class).putExtra("id",id)); }
        catch(RuntimeException e){ArcAlarmService.missed(c,id,a.optString("label"),"Could not ring. Open the app and check alarm permissions.");}
    }
}
