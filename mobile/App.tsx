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
