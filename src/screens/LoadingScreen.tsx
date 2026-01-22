import { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Easing,
  SafeAreaView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Svg, { Defs, Ellipse, Line, LinearGradient, Rect, Stop } from 'react-native-svg';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useTimeout } from '../hooks/useTimeout';

type Props = NativeStackScreenProps<RootStackParamList, 'Loading'>;

export function LoadingScreen({ navigation }: Props) {
  const { width, height } = useWindowDimensions();
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const dotAnims = useMemo(
    () => [new Animated.Value(0), new Animated.Value(0), new Animated.Value(0)],
    [],
  );

  useTimeout(() => {
    navigation.replace('RouteSent');
  }, 3000);

  useEffect(() => {
    const rotateLoop = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    const scaleLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    );
    const progressTiming = Animated.timing(progressAnim, {
      toValue: 1,
      duration: 3000,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    });

    const dotLoops = dotAnims.map((anim, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 200),
          Animated.timing(anim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
      ),
    );

    rotateLoop.start();
    scaleLoop.start();
    progressTiming.start();
    dotLoops.forEach(loop => loop.start());

    return () => {
      rotateLoop.stop();
      scaleLoop.stop();
      dotLoops.forEach(loop => loop.stop());
    };
  }, [dotAnims, progressAnim, rotateAnim, scaleAnim]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  const scale = scaleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.1],
  });
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <SafeAreaView style={styles.container}>
      <Svg
        width={width}
        height={height}
        style={styles.backgroundGradient}
        pointerEvents="none"
      >
        <Defs>
          <LinearGradient id="loadingBackground" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#0a0f0d" />
            <Stop offset="55%" stopColor="#0d140f" />
            <Stop offset="100%" stopColor="#136F3E" />
          </LinearGradient>
        </Defs>
        <Rect width={width} height={height} fill="url(#loadingBackground)" />
      </Svg>

      <Animated.View
        style={[
          styles.footballWrapper,
          { transform: [{ rotate: rotation }, { scale }] },
        ]}
      >
        <Svg width={120} height={120} viewBox="0 0 120 120" fill="none">
          <Ellipse
            cx={60}
            cy={60}
            rx={35}
            ry={50}
            fill="#8B4513"
            stroke="#654321"
            strokeWidth={2}
          />
          <Line x1={60} y1={30} x2={60} y2={90} stroke="white" strokeWidth={2} />
          <Line x1={52} y1={45} x2={68} y2={45} stroke="white" strokeWidth={2} />
          <Line x1={52} y1={55} x2={68} y2={55} stroke="white" strokeWidth={2} />
          <Line x1={52} y1={65} x2={68} y2={65} stroke="white" strokeWidth={2} />
          <Line x1={52} y1={75} x2={68} y2={75} stroke="white" strokeWidth={2} />
        </Svg>
        <View style={styles.footballGlow} />
      </Animated.View>

      <View style={styles.textWrapper}>
        <Text style={styles.title}>Sending route to JUGS Machine...</Text>
        <View style={styles.dotsRow}>
          {dotAnims.map((dot, index) => {
            const dotScale = dot.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 1.5],
            });
            const dotOpacity = dot.interpolate({
              inputRange: [0, 1],
              outputRange: [0.5, 1],
            });
            return (
              <Animated.View
                key={`dot-${index}`}
                style={[
                  styles.dot,
                  { transform: [{ scale: dotScale }], opacity: dotOpacity },
                ]}
              />
            );
          })}
        </View>
      </View>

      <View style={styles.progressBar}>
        <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0a0f0d',
  },
  backgroundGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  footballWrapper: {
    marginBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footballGlow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,215,0,0.2)',
  },
  textWrapper: {
    alignItems: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    textAlign: 'center',
    marginBottom: 16,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFD700',
  },
  progressBar: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 64,
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFD700',
  },
});
