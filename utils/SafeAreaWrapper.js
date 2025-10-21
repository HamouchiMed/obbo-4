import React from 'react';
import { Platform, SafeAreaView, View, StatusBar } from 'react-native';

// SafeAreaWrapper
// Props:
// - children: content
// - style: style object/array passed to the container
// - disableAndroidStatusBarPadding: when true, do NOT add extra paddingTop on Android
export default function SafeAreaWrapper({ children, style, disableAndroidStatusBarPadding = false }) {
  if (Platform.OS === 'android') {
    const paddingTop = disableAndroidStatusBarPadding ? 0 : (StatusBar.currentHeight || 0);
    return (
      <View style={[{ flex: 1, paddingTop }, style]}>
        {children}
      </View>
    );
  }

  return (
    <SafeAreaView style={[{ flex: 1 }, style]}>
      {children}
    </SafeAreaView>
  );
}
