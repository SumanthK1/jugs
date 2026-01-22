import { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  SafeAreaView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Svg, { Defs, Line, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { PrimaryButton } from '../components/PrimaryButton';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  const { width, height } = useWindowDimensions();
  const pingAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pingLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pingAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pingAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1600,
          useNativeDriver: true,
        }),
      ]),
    );

    pingLoop.start();
    pulseLoop.start();

    return () => {
      pingLoop.stop();
      pulseLoop.stop();
    };
  }, [pingAnim, pulseAnim]);

  const gridLines = useMemo(() => {
    const lines = [];
    const spacing = 35;
    for (let x = 0; x <= width; x += spacing) {
      lines.push(
        <Line
          key={`v-${x}`}
          x1={x}
          y1={0}
          x2={x}
          y2={height}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={1}
        />,
      );
    }
    for (let y = 0; y <= height; y += spacing) {
      lines.push(
        <Line
          key={`h-${y}`}
          x1={0}
          y1={y}
          x2={width}
          y2={y}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={1}
        />,
      );
    }
    return lines;
  }, [height, width]);

  const pingScale = pingAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.6],
  });
  const pingOpacity = pingAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.2, 0],
  });
  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.1],
  });
  const pulseOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.15],
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
          <LinearGradient id="homeBackground" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#0a0f0d" />
            <Stop offset="55%" stopColor="#0d140f" />
            <Stop offset="100%" stopColor="#136F3E" />
          </LinearGradient>
        </Defs>
        <Rect width={width} height={height} fill="url(#homeBackground)" />
      </Svg>

      <Svg
        width={width}
        height={height}
        style={styles.gridOverlay}
        pointerEvents="none"
      >
        {gridLines}
      </Svg>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.titleLine}>Automated</Text>
          <Text style={styles.titleAccent}>JUGS Machine</Text>
          <Text style={styles.subtitle}>
            Draw custom routes and train with precision. Your AI-powered passing
            partner.
          </Text>
        </View>

        <View style={styles.centerGraphic}>
          <View style={styles.iconWrapper}>
            <Animated.View
              style={[
                styles.pingRing,
                { transform: [{ scale: pingScale }], opacity: pingOpacity },
              ]}
            />
            <Animated.View
              style={[
                styles.pulseRing,
                { transform: [{ scale: pulseScale }], opacity: pulseOpacity },
              ]}
            />
            <View style={styles.iconCard}>
              <Svg width={64} height={64} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
                  stroke="#FFD700"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </View>
          </View>
        </View>

        <View style={styles.buttonWrapper}>
          <PrimaryButton onPress={() => navigation.navigate('DrawRoute')}>
            Start Training
          </PrimaryButton>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0f0d',
  },
  backgroundGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.08,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: 16,
  },
  titleLine: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  titleAccent: {
    color: '#FFD700',
    fontSize: 42,
    fontWeight: '800',
    marginTop: 6,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 22,
  },
  centerGraphic: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    width: 240,
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pingRing: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 2,
    borderColor: '#136F3E',
  },
  pulseRing: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  iconCard: {
    width: 128,
    height: 128,
    borderRadius: 24,
    backgroundColor: '#0a4d2a',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  buttonWrapper: {
    paddingBottom: 8,
  },
});
