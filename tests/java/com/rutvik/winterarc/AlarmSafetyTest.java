package com.rutvik.winterarc;
public final class AlarmSafetyTest {
    public static void main(String[] args) {
        if (AlarmSafety.duration(true)!=10_000 || AlarmSafety.duration(false)!=300_000) throw new AssertionError("Wrong deadlines");
        for(long deadline:new long[]{1,999,10_000,300_000}) {
            long total=0;long[] pattern=AlarmSafety.waveform(deadline);
            if(pattern[0]!=0)throw new AssertionError("Initial delay");
            for(int i=1;i<pattern.length;i++){if(pattern[i]<=0)throw new AssertionError("Empty segment");total+=pattern[i];}
            if(total!=deadline)throw new AssertionError("Unbounded vibration");
        }
        int[] cleaned={0};
        AlarmSafety.cleanup(()->{throw new IllegalStateException("Media failure");},()->cleaned[0]++,()->{throw new SecurityException("Resource failure");},()->cleaned[0]++);
        if(cleaned[0]!=2)throw new AssertionError("Cleanup stopped early");
        for(long bad:new long[]{0,-1,300_001}){boolean rejected=false;try{AlarmSafety.waveform(bad);}catch(IllegalArgumentException e){rejected=true;}if(!rejected)throw new AssertionError("Invalid duration accepted");}
        System.out.println("AlarmSafetyTest passed: finite deadlines and independent cleanup");
    }
}
