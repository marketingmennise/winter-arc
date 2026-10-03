import React from 'react';
import ReactDOM from 'react-dom/client';
import TrackerApp from '../app/tracker-app';
import '../app/globals.css';
import '../app/android-settings.css';
import {Capacitor} from '@capacitor/core';
import {SplashScreen} from '@capacitor/splash-screen';
import {App} from '@capacitor/app';
if(Capacitor.isNativePlatform())document.documentElement.classList.add('native-android');
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><TrackerApp/></React.StrictMode>);
if(Capacitor.isNativePlatform())requestAnimationFrame(()=>{void SplashScreen.hide().catch(()=>{});});
if(Capacitor.getPlatform()==='android'){
 void App.addListener('backButton',()=>{
  if(document.querySelector('[role="dialog"][data-state="open"],[role="alertdialog"][data-state="open"],[role="listbox"][data-state="open"],[data-slot="popover-content"][data-state="open"]')){document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',code:'Escape',bubbles:true,cancelable:true}));return;}
  const detail={handled:false};window.dispatchEvent(new CustomEvent('winter-arc-native-back',{detail}));
  if(!detail.handled)void App.exitApp();
 });
 void App.addListener('appStateChange',({isActive})=>{if(isActive)window.dispatchEvent(new Event('focus'));});
}
