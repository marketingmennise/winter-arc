package com.rutvik.winterarc;

import android.app.Activity;
import android.content.*;
import android.graphics.Color;
import android.graphics.Typeface;
import android.os.*;
import android.view.*;
import android.widget.*;
import androidx.core.content.ContextCompat;
import androidx.core.view.*;

public class ArcAlarmActivity extends Activity {
    int id=-1; boolean registered=false;
    final BroadcastReceiver close=new BroadcastReceiver(){@Override public void onReceive(Context c,Intent i){if(i.getIntExtra("id",-2)==id)finish();}};
    @Override public void onCreate(Bundle b){super.onCreate(b);
        if(Build.VERSION.SDK_INT>=27){setShowWhenLocked(true);setTurnScreenOn(true);}else getWindow().addFlags(WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED|WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        ContextCompat.registerReceiver(this,close,new IntentFilter(ArcAlarmStore.CLOSED),ContextCompat.RECEIVER_NOT_EXPORTED);registered=true;
        render();
    }
    @Override protected void onNewIntent(Intent i){super.onNewIntent(i);setIntent(i);render();}
    @Override protected void onResume(){super.onResume();if(ArcAlarmService.activeId!=getIntent().getIntExtra("id",-1))finish();}
    int dp(int n){return Math.round(n*getResources().getDisplayMetrics().density);}
    TextView text(String s,int size,int color){TextView v=new TextView(this);v.setText(s);v.setTextSize(size);v.setTextColor(color);v.setGravity(Gravity.CENTER);v.setPadding(0,dp(12),0,dp(12));return v;}
    void render(){
        id=getIntent().getIntExtra("id",-1);
        int bg=Color.rgb(27,32,27),fg=Color.rgb(242,246,236),lime=Color.rgb(196,230,109);
        ScrollView scroll=new ScrollView(this);scroll.setFillViewport(true);scroll.setBackgroundColor(bg);
        LinearLayout box=new LinearLayout(this);box.setOrientation(LinearLayout.VERTICAL);box.setGravity(Gravity.CENTER);box.setPadding(dp(28),dp(32),dp(28),dp(32));
        scroll.addView(box,new ScrollView.LayoutParams(-1,-1));setContentView(scroll);
        ViewCompat.setOnApplyWindowInsetsListener(scroll,(view,insets)->{androidx.core.graphics.Insets bars=insets.getInsets(WindowInsetsCompat.Type.systemBars()|WindowInsetsCompat.Type.displayCutout());view.setPadding(bars.left,bars.top,bars.right,bars.bottom);return insets;});
        box.addView(text("WINTER ARC",16,lime));
        String now=android.text.format.DateFormat.getTimeFormat(this).format(new java.util.Date());
        TextView time=text(now,48,fg);time.setTypeface(null,Typeface.BOLD);box.addView(time);
        TextView label=text(getIntent().getStringExtra("label"),26,fg);label.setTypeface(null,Typeface.BOLD);box.addView(label);
        box.addView(text(getIntent().getStringExtra("detail"),16,fg));
        Button dismiss=new Button(this);dismiss.setText("Dismiss alarm");dismiss.setTextSize(18);dismiss.setTextColor(bg);dismiss.setBackgroundTintList(android.content.res.ColorStateList.valueOf(lime));dismiss.setMinHeight(dp(64));
        LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(-1,-2);p.topMargin=dp(28);box.addView(dismiss,p);dismiss.setOnClickListener(v->stop(false));
        if(id!=ArcAlarmStore.TEST_ID){Button snooze=new Button(this);snooze.setText("Snooze · 5 minutes");snooze.setTextSize(18);snooze.setMinHeight(dp(64));box.addView(snooze,new LinearLayout.LayoutParams(-1,-2));snooze.setOnClickListener(v->stop(true));}
        box.addView(text("Sound and vibration stop automatically after 5 minutes.",14,fg));
    }
    void stop(boolean snooze){startService(new Intent(this,ArcAlarmService.class).setAction(snooze?ArcAlarmStore.SNOOZE:ArcAlarmStore.DISMISS).putExtra("id",id));finish();}
    @Override protected void onDestroy(){if(registered)unregisterReceiver(close);super.onDestroy();}
}
