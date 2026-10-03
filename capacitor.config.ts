import type {CapacitorConfig} from '@capacitor/cli';
const config:CapacitorConfig={appId:'com.winterarc.tracker',appName:'Winter Arc Generic',webDir:'dist',android:{backgroundColor:'#141b18'},plugins:{SystemBars:{style:'DARK',insetsHandling:'native'},SplashScreen:{launchAutoHide:false,backgroundColor:'#141b18',androidSplashResourceName:'splash',showSpinner:false},StatusBar:{style:'DARK',backgroundColor:'#141b18',overlaysWebView:false},LocalNotifications:{smallIcon:'ic_notification',iconColor:'#d6efb1'}}};
export default config;
