package com.rutvik.winterarc;
import java.time.Instant;
import java.util.TimeZone;
public class AlarmTimeTest {
 static long at(String iso){return Instant.parse(iso).toEpochMilli();}
 static void equal(long a,long b){if(a!=b)throw new AssertionError(a+" != "+b);}
 static void invalid(Runnable f){try{f.run();}catch(IllegalArgumentException expected){return;}throw new AssertionError("Expected validation error");}
 public static void main(String[] args){
  TimeZone india=TimeZone.getTimeZone("Asia/Kolkata");
  equal(AlarmTime.next("18:00",127,at("2026-10-03T11:00:00Z"),india),at("2026-10-03T12:30:00Z"));
  equal(AlarmTime.next("18:00",127,at("2026-10-03T12:30:00Z"),india),at("2026-10-04T12:30:00Z"));
  equal(AlarmTime.next("06:00",63,at("2026-10-03T12:30:00Z"),india),at("2026-10-05T00:30:00Z"));
  equal(AlarmTime.next("00:00",127,at("2026-10-03T18:29:59Z"),india),at("2026-10-03T18:30:00Z"));
  equal(AlarmTime.next("07:00",1,at("2026-10-05T02:00:00Z"),india),at("2026-10-12T01:30:00Z"));
  equal(AlarmTime.onDate("2026-12-29","21:00",india),at("2026-12-29T15:30:00Z"));
  equal(AlarmTime.next("07:00",127,at("2026-10-24T22:00:00Z"),TimeZone.getTimeZone("Europe/London")),at("2026-10-25T07:00:00Z"));
  invalid(()->AlarmTime.next("24:00",127,0,india));invalid(()->AlarmTime.next("07:00",0,0,india));invalid(()->AlarmTime.next("07:00",128,0,india));invalid(()->AlarmTime.onDate("2026-02-30","07:00",india));
  System.out.println("11 alarm scheduling checks passed");
 }
}
