import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('splash branding stays in launch-window attributes, never general widget backgrounds',()=>{
 const theme=readFileSync(new URL('../android/app/src/main/res/values/styles.xml',import.meta.url),'utf8');
 assert.doesNotMatch(theme,/<item\s+name="android:background"[^>]*>\s*@drawable\/(?:splash|ic_arc_mark)/);
 assert.match(theme,/<item name="windowSplashScreenAnimatedIcon">@drawable\/ic_arc_mark<\/item>/);
 assert.match(theme,/<item name="postSplashScreenTheme">@style\/AppTheme.NoActionBar<\/item>/);
 assert.match(theme,/<item name="android:windowBackground">@color\/arc_charcoal<\/item>/);
});
