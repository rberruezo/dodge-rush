import React, { useRef, useEffect } from 'react';
import { BackHandler, Platform, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { StatusBar } from 'expo-status-bar';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import * as ScreenOrientation from 'expo-screen-orientation';

/**
 * Dodge Rush — Android shell.
 *
 * The whole game is the Phaser web build, shipped offline inside the APK and
 * loaded from `file:///android_asset/web/` (see plugins/withWebAssets.js). This
 * component is only the native chrome: full-screen WebView, portrait lock, screen
 * kept awake, immersive status bar, and a hardware-back → in-game pause bridge.
 */

// The web build is copied into the native assets folder at prebuild time.
const GAME_URI =
  Platform.OS === 'android'
    ? 'file:///android_asset/web/index.html'
    : './web/index.html'; // iOS uses the bundled resources dir (configure later)

// Forward the WebView's JS console + uncaught errors to native logs (logcat as
// "ReactNativeJS"), so issues inside the game are visible without remote debugging.
const CONSOLE_BRIDGE = `(function(){
  if (window.__bridged) return; window.__bridged = true;
  function send(level, args){
    try {
      var msg = Array.prototype.map.call(args, function(a){
        try { return (typeof a === 'object') ? JSON.stringify(a) : String(a); }
        catch (e) { return String(a); }
      }).join(' ');
      window.ReactNativeWebView.postMessage(JSON.stringify({ __log: 1, level: level, msg: msg }));
    } catch (e) {}
  }
  ['log','info','warn','error'].forEach(function(k){
    var orig = console[k] ? console[k].bind(console) : function(){};
    console[k] = function(){ send(k, arguments); orig.apply(console, arguments); };
  });
  window.addEventListener('error', function(e){
    send('error', ['[uncaught] ' + e.message + ' @ ' + (e.filename||'') + ':' + (e.lineno||'')]);
  });
  window.addEventListener('unhandledrejection', function(e){
    send('error', ['[promise] ' + (e.reason && e.reason.message ? e.reason.message : e.reason)]);
  });
})(); true;`;

export default function App() {
  const webRef = useRef<WebView>(null);

  useEffect(() => {
    // Keep the screen on during play and lock to portrait.
    activateKeepAwakeAsync();
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);

    // Hardware back button -> pause the game instead of closing the app.
    // The web game already pauses on the Escape key, so we synthesize one.
    const onBack = () => {
      webRef.current?.injectJavaScript(
        "window.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',keyCode:27,which:27}));true;"
      );
      return true; // we handled it; don't exit the app
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBack);

    return () => {
      sub.remove();
      deactivateKeepAwake();
    };
  }, []);

  return (
    <View style={styles.root}>
      <StatusBar hidden />
      <WebView
        ref={webRef}
        source={{ uri: GAME_URI }}
        style={styles.web}
        injectedJavaScriptBeforeContentLoaded={CONSOLE_BRIDGE}
        onMessage={(e) => {
          try {
            const d = JSON.parse(e.nativeEvent.data);
            if (d.__log) console.log(`[WV:${d.level}] ${d.msg}`);
          } catch {
            /* non-log message */
          }
        }}
        // --- offline file:// loading of the bundled build + its sub-assets ---
        originWhitelist={['*']}
        allowFileAccess
        allowFileAccessFromFileURLs
        allowUniversalAccessFromFileURLs
        allowingReadAccessToURL={GAME_URI}
        // --- game runtime needs ---
        javaScriptEnabled
        domStorageEnabled // localStorage: coins, skins, daily streak, high score
        mediaPlaybackRequiresUserAction={false} // procedural audio unlocks on first tap
        // --- feel: no scroll/zoom/bounce, transparent letterbox ---
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        setBuiltInZoomControls={false}
        setDisplayZoomControls={false}
        textZoom={100}
        androidLayerType="hardware"
        cacheEnabled
        // Keep navigation inside the game; ignore any stray external links.
        onShouldStartLoadWithRequest={(req) =>
          req.url.startsWith('file://') || req.url === GAME_URI
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#1a1030' },
  web: { flex: 1, backgroundColor: '#1a1030' }
});
