import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

const AnimatedView = Animated.createAnimatedComponent(View);

interface Props {
  size?: number;
}

export default function FahmIQLogoAnimated({ size = 80 }: Props) {
  const outerRotation = useSharedValue(0);
  const innerRotation = useSharedValue(0);

  useEffect(() => {
    outerRotation.value = withRepeat(
      withTiming(360, { duration: 12000, easing: Easing.linear }),
      -1, false
    );
    innerRotation.value = withRepeat(
      withTiming(-360, { duration: 8000, easing: Easing.linear }),
      -1, false
    );
  }, []);

  const outerStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${outerRotation.value}deg` }],
  }));

  const innerStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${innerRotation.value}deg` }],
  }));

  const r = size / 2;
  const strokeW = size * 0.04;

  return (
    <View style={[styles.container, { width: size, height: size }]} testID="fahmiq-logo">
      <AnimatedView style={[StyleSheet.absoluteFill, outerStyle]}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Circle cx={r} cy={r} r={r - strokeW} stroke="#E53E3E" strokeWidth={strokeW} fill="none" strokeDasharray={`${(r - strokeW) * 2} ${(r - strokeW) * 1.5}`} />
        </Svg>
      </AnimatedView>
      <View style={StyleSheet.absoluteFill}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Circle cx={r} cy={r} r={r * 0.7} stroke="#5B6EF5" strokeWidth={strokeW} fill="none" strokeDasharray={`${r * 0.7 * 2.5} ${r * 0.7 * 1}`} />
        </Svg>
      </View>
      <AnimatedView style={[StyleSheet.absoluteFill, innerStyle]}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Circle cx={r} cy={r} r={r * 0.45} stroke="#34D399" strokeWidth={strokeW} fill="none" strokeDasharray={`${r * 0.45 * 3} ${r * 0.45 * 0.8}`} />
        </Svg>
      </AnimatedView>
      <View style={[styles.centerDot, { width: size * 0.18, height: size * 0.18, borderRadius: size * 0.09 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  centerDot: { backgroundColor: '#0C0C10', position: 'absolute' },
});
