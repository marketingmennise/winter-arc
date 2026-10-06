package com.rutvik.winterarc;

/** Hardware vibration has a finite deadline even if a service callback is delayed. */
public final class AlarmSafety {
    public static long duration(boolean test) { return test ? 10_000L : 300_000L; }
    public static long[] waveform(long duration) {
        if (duration <= 0 || duration > 300_000L) throw new IllegalArgumentException("Invalid alarm duration");
        java.util.ArrayList<Long> values = new java.util.ArrayList<>();
        values.add(0L);
        long remaining = duration;
        long[] cycle = {600, 400, 600, 1400};
        while (remaining > 0) for (long segment : cycle) {
            if (remaining == 0) break;
            long length = Math.min(segment, remaining);
            values.add(length); remaining -= length;
        }
        long[] result = new long[values.size()];
        for (int i = 0; i < result.length; i++) result[i] = values.get(i);
        return result;
    }
    /** One failed resource must not prevent the remaining resources from stopping. */
    public static void cleanup(Runnable... resources) {
        for (Runnable resource : resources) try { resource.run(); } catch (RuntimeException ignored) {}
    }
}
