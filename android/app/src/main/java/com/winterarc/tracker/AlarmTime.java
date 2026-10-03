package com.winterarc.tracker;

import java.util.Calendar;
import java.util.TimeZone;

public final class AlarmTime {
    private AlarmTime() {}
    public static long onDate(String date,String time,TimeZone zone) {
        if(date==null||!date.matches("[0-9]{4}-[0-9]{2}-[0-9]{2}")||time==null||!time.matches("([01][0-9]|2[0-3]):[0-5][0-9]"))throw new IllegalArgumentException("Choose a valid date and time.");
        java.text.SimpleDateFormat f=new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm",java.util.Locale.ROOT);f.setTimeZone(zone);f.setLenient(false);
        try{return f.parse(date+" "+time).getTime();}catch(java.text.ParseException e){throw new IllegalArgumentException("Choose a valid date and time.");}
    }
    public static long next(String time, int days, long now, TimeZone zone) {
        if (time == null || !time.matches("([01][0-9]|2[0-3]):[0-5][0-9]") || days < 1 || days > 127)
            throw new IllegalArgumentException("Choose a valid time and at least one repeat day.");
        String[] parts = time.split(":");
        for (int offset = 0; offset <= 7; offset++) {
            Calendar c = Calendar.getInstance(zone);
            c.setTimeInMillis(now);
            c.add(Calendar.DATE, offset);
            c.set(Calendar.HOUR_OF_DAY, Integer.parseInt(parts[0]));
            c.set(Calendar.MINUTE, Integer.parseInt(parts[1]));
            c.set(Calendar.SECOND, 0);
            c.set(Calendar.MILLISECOND, 0);
            int mondayIndex = (c.get(Calendar.DAY_OF_WEEK) + 5) % 7;
            if ((days & (1 << mondayIndex)) != 0 && c.getTimeInMillis() > now) return c.getTimeInMillis();
        }
        throw new IllegalArgumentException("Could not find the next alarm.");
    }
}
