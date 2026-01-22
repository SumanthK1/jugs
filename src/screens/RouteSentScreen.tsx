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
import { CheckCircle } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { PrimaryButton } from '../components/PrimaryButton';

type Props = NativeStackScreenProps<RootStackParamList, 'RouteSent'>;

export function RouteSentScreen({ navigation }: Props) {
  const { width, height } = useWindowDimensions();
  const entryAnim = useRef(new Animated.Value(0)).current;
  const ringAnim = useRef(new Animated.Value(0)).current;
  const footballAnim = useRef(new Animated.Value(0)).current;
  const particleAnims = useMemo(
    () => Array.from({ length: 6 }, () => new Animated.Value(0)),
    [],
  );
  const particleOffsets = useMemo(
    () =>
      Array.from({ length: 6 }, () => ({
        x: (Math.random() - 0.5) * 200,
        y: (Math.random() - 0.5) * 200,
      })),
    [],
  );

  useEffect(() => {
    Animated.spring(entryAnim, {
      toValue: 1,
      useNativeDriver: true,
      damping: 15,
      stiffness: 200,
      mass: 1,
      delay: 200,
    }).start();

    const ringLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(ringAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(ringAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );

    const footballLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(footballAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.delay(500),
        Animated.timing(footballAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );

    const particleAnimations = particleAnims.map(anim =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 1500,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    );

    ringLoop.start();
    footballLoop.start();
    Animated.stagger(120, particleAnimations).start();

    return () => {
      ringLoop.stop();
      footballLoop.stop();
    };
  }, [entryAnim, footballAnim, particleAnims, ringAnim]);

  const entryScale = entryAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  const entryRotate = entryAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-180deg', '0deg'],
  });
  const ringScale = ringAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.3],
  });
  const ringOpacity = ringAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 0],
  });
  const footballTranslateX = footballAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  });
  const footballTranslateY = footballAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [50, -50],
  });
  const footballRotate = footballAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-45deg', '315deg'],
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
          <LinearGradient id="sentBackground" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#0a0f0d" />
            <Stop offset="55%" stopColor="#0d140f" />
            <Stop offset="100%" stopColor="#136F3E" />
          </LinearGradient>
        </Defs>
        <Rect width={width} height={height} fill="url(#sentBackground)" />
      </Svg>

      <View style={styles.content}>
        <View style={styles.centerSection}>
          <Animated.View
            style={[
              styles.successWrapper,
              { transform: [{ scale: entryScale }, { rotate: entryRotate }] },
            ]}
          >
            <View style={styles.successCircle}>
              <CheckCircle size={80} color="#0a0f0d" strokeWidth={2.5} />
            </View>
            <Animated.View
              style={[
                styles.successRing,
                {
                  opacity: ringOpacity,
                  transform: [{ scale: ringScale }],
                },
              ]}
            />
          </Animated.View>

          <Animated.View
            style={[
              styles.footballWrapper,
              {
                transform: [
                  { translateX: footballTranslateX },
                  { translateY: footballTranslateY },
                  { rotate: footballRotate },
                ],
              },
            ]}
          >
            <Svg width={60} height={60} viewBox="0 0 60 60" fill="none">
              <Ellipse
                cx={30}
                cy={30}
                rx={17}
                ry={25}
                fill="#8B4513"
                stroke="#654321"
                strokeWidth={1.5}
              />
              <Line x1={30} y1={15} x2={30} y2={45} stroke="white" strokeWidth={1.5} />
              <Line x1={24} y1={22} x2={36} y2={22} stroke="white" strokeWidth={1.5} />
              <Line x1={24} y1={28} x2={36} y2={28} stroke="white" strokeWidth={1.5} />
              <Line x1={24} y1={34} x2={36} y2={34} stroke="white" strokeWidth={1.5} />
              <Line x1={24} y1={40} x2={36} y2={40} stroke="white" strokeWidth={1.5} />
            </Svg>
          </Animated.View>

          <View style={styles.textBlock}>
            <Text style={styles.title}>Route Sent!</Text>
            <Text style={styles.subtitle}>
              The JUGS machine is positioning and will begin launch.
            </Text>
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>Ready</Text>
                <Text style={styles.statLabel}>Status</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>Active</Text>
                <Text style={styles.statLabel}>Mode</Text>
              </View>
            </View>
          </View>

          {particleAnims.map((anim, index) => {
            const { x, y } = particleOffsets[index];
            const particleScale = anim.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 0],
            });
            const particleOpacity = anim.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 0],
            });
            return (
              <Animated.View
                key={`particle-${index}`}
                style={[
                  styles.particle,
                  {
                    opacity: particleOpacity,
                    transform: [
                      { translateX: x },
                      { translateY: y },
                      { scale: particleScale },
                    ],
                  },
                ]}
              />
            );
          })}
        </View>

        <View style={styles.buttonWrapper}>
          <PrimaryButton
            onPress={() =>
              navigation.reset({
                index: 1,
                routes: [{ name: 'Home' }, { name: 'DrawRoute' }],
              })
            }
          >
            Draw another route
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
    justifyContent: 'space-between',
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  successCircle: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: '#FFD700',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFD700',
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  successRing: {
    position: 'absolute',
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 4,
    borderColor: '#FFD700',
  },
  footballWrapper: {
    height: 120,
    justifyContent: 'center',
  },
  textBlock: {
    alignItems: 'center',
    marginTop: 16,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '700',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 22,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
  statValue: {
    color: '#FFD700',
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    color: 'rgba(255,255,255,0.6)',
    marginTop: 6,
  },
  particle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFD700',
    left: '50%',
    top: '30%',
  },
  buttonWrapper: {
    paddingBottom: 8,
  },
});
