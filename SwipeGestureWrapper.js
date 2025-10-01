import React from 'react';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { Dimensions } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

export default function SwipeGestureWrapper({ children, onSwipeRight, enabled = true }) {
  const handleGestureEvent = (event) => {
    if (!enabled || !onSwipeRight) return;

    const { translationX, velocityX, state } = event.nativeEvent;
    
    // Check if it's a right swipe (left to right)
    if (state === State.END && translationX > 50 && velocityX > 0) {
      onSwipeRight();
    }
  };

  return (
    <PanGestureHandler
      onHandlerStateChange={handleGestureEvent}
      minDist={20}
      activeOffsetX={[-10, 10]}
      failOffsetY={[-20, 20]}
    >
      {children}
    </PanGestureHandler>
  );
}
