import { useEffect, useMemo, useRef, useState } from 'react';
import {
  LayoutChangeEvent,
  Modal,
  PanResponder,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { ChevronLeft } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { pathCrossesItself, pointsToSvgPath, Point } from '../utils/routeValidation';

type Props = NativeStackScreenProps<RootStackParamList, 'DrawRoute'>;

export function DrawRouteScreen({ navigation }: Props) {
  // 30Hz sampling balances smoothness with overhead on mobile.
  const samplingHz = 30;
  const samplingIntervalMs = 1000 / samplingHz;
  const fieldWidthYards = 53.3;
  const fieldLengthYards = 60;

  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<Point[]>([]);
  const [allPaths, setAllPaths] = useState<Point[][]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showInvalidMessage, setShowInvalidMessage] = useState(false);
  const [fieldSize, setFieldSize] = useState({ width: 0, height: 0 });

  const currentPathRef = useRef<Point[]>([]);
  const localRouteRef = useRef<Point[]>([]);
  const originRef = useRef<Point | null>(null);
  const lastSampleTimeRef = useRef<number>(0);
  const allPathsRef = useRef<Point[][]>([]);
  const isDrawingRef = useRef(false);

  useEffect(() => {
    currentPathRef.current = currentPath;
  }, [currentPath]);

  useEffect(() => {
    allPathsRef.current = allPaths;
  }, [allPaths]);

  useEffect(() => {
    isDrawingRef.current = isDrawing;
  }, [isDrawing]);

  useEffect(() => {
    if (fieldSize.width > 0 && fieldSize.height > 0) {
      // Fixed origin: center of field on x-axis, bottom of field on y-axis.
      originRef.current = {
        x: fieldSize.width / 2,
        y: fieldSize.height,
      };
    }
  }, [fieldSize.height, fieldSize.width]);

  useEffect(() => {
    if (showInvalidMessage) {
      const timer = setTimeout(() => {
        setShowInvalidMessage(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showInvalidMessage]);

  const updateCurrentPath = (path: Point[]) => {
    currentPathRef.current = path;
    setCurrentPath(path);
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: evt => {
          if (allPathsRef.current.length > 0) return;
          const { locationX, locationY } = evt.nativeEvent;
          const now =
            typeof evt.nativeEvent.timestamp === 'number'
              ? evt.nativeEvent.timestamp
              : Date.now();
          // Route can start anywhere; origin is fixed at field center/bottom.
          const origin = originRef.current;
          localRouteRef.current = origin
            ? [{ x: locationX - origin.x, y: origin.y - locationY }]
            : [];
          lastSampleTimeRef.current = now;
          setIsDrawing(true);
          updateCurrentPath([{ x: locationX, y: locationY }]);
        },
        onPanResponderMove: evt => {
          if (!isDrawingRef.current) return;
          const { locationX, locationY } = evt.nativeEvent;
          const now =
            typeof evt.nativeEvent.timestamp === 'number'
              ? evt.nativeEvent.timestamp
              : Date.now();
          const origin = originRef.current;
          if (!origin) return;
          const newPath = [
            ...currentPathRef.current,
            { x: locationX, y: locationY },
          ];

          if (pathCrossesItself(newPath)) {
            setIsDrawing(false);
            updateCurrentPath([]);
            localRouteRef.current = [];
            setShowInvalidMessage(true);
            return;
          }

          if (now - lastSampleTimeRef.current >= samplingIntervalMs) {
            localRouteRef.current = [
              ...localRouteRef.current,
              { x: locationX - origin.x, y: origin.y - locationY },
            ];
            lastSampleTimeRef.current = now;
          }
          updateCurrentPath(newPath);
        },
        onPanResponderRelease: () => {
          if (!isDrawingRef.current) return;
          setIsDrawing(false);

          if (currentPathRef.current.length < 10) {
            updateCurrentPath([]);
            localRouteRef.current = [];
            setShowInvalidMessage(true);
          } else {
            const origin = originRef.current;
            if (origin) {
              const lastPoint = currentPathRef.current[currentPathRef.current.length - 1];
              localRouteRef.current = [
                ...localRouteRef.current,
                { x: lastPoint.x - origin.x, y: origin.y - lastPoint.y },
              ];
            }
            setShowConfirmDialog(true);
          }
        },
        onPanResponderTerminate: () => {
          if (!isDrawingRef.current) return;
          setIsDrawing(false);
          if (currentPathRef.current.length < 10) {
            updateCurrentPath([]);
            localRouteRef.current = [];
            setShowInvalidMessage(true);
          } else {
            const origin = originRef.current;
            if (origin) {
              const lastPoint = currentPathRef.current[currentPathRef.current.length - 1];
              localRouteRef.current = [
                ...localRouteRef.current,
                { x: lastPoint.x - origin.x, y: origin.y - lastPoint.y },
              ];
            }
            setShowConfirmDialog(true);
          }
        },
      }),
    [],
  );

  const handleConfirmYes = () => {
    const roundedRoute = localRouteRef.current
      .map(pixelsToYards)
      .filter((point): point is Point => point !== null)
      .map(point => ({
        x: round3(point.x),
        y: round3(point.y),
      }));
    const finalPoint = roundedRoute[roundedRoute.length - 1] ?? null;

    const pointsPreview = roundedRoute.map(formatPoint).join(', ');
    const output = [
      'Route (local yards, origin at JUGS center x=0, y=0):',
      `Points (${roundedRoute.length}): [${pointsPreview}]`,
      `Final: ${finalPoint ? formatPoint(finalPoint) : 'N/A'}`,
    ].join('\n');
    console.log(output);

    setAllPaths([...allPathsRef.current, currentPathRef.current]);
    updateCurrentPath([]);
    localRouteRef.current = [];
    setShowConfirmDialog(false);
    navigation.navigate('Loading');
  };

  const handleConfirmNo = () => {
    updateCurrentPath([]);
    localRouteRef.current = [];
    setShowConfirmDialog(false);
  };


  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setFieldSize({ width, height });
  };

  const currentPathSvg = useMemo(
    () => pointsToSvgPath(currentPath),
    [currentPath],
  );

  const confirmedPaths = useMemo(
    () => allPaths.map(path => pointsToSvgPath(path)),
    [allPaths],
  );

  const segmentCount = Math.max(1, Math.round(fieldLengthYards / 10));
  const yardLineSpacing = fieldSize.height / segmentCount;
  const xScale = fieldSize.width / fieldWidthYards;
  const yScale = yardLineSpacing === 0 ? 0 : yardLineSpacing / 10;

  const pixelsToYards = (pixelPoint: Point) => {
    if (xScale === 0 || yScale === 0) return null;
    return {
      x: pixelPoint.x / xScale,
      y: pixelPoint.y / yScale,
    };
  };

  const round3 = (value: number) => Number(value.toFixed(3));

  const formatPoint = (point: Point) =>
    `(${point.x.toFixed(3)}, ${point.y.toFixed(3)})`;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ChevronLeft size={20} color="#FFFFFF" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Draw Your Route</Text>
        <View style={styles.headerSpacer} />
      </View>

      {showInvalidMessage && (
        <View style={styles.invalidBanner}>
          <Text style={styles.invalidText}>Invalid route</Text>
        </View>
      )}

      <View style={styles.canvasWrapper} onLayout={handleLayout}>
        {fieldSize.width > 0 && (
          <View
            style={StyleSheet.absoluteFillObject}
            {...panResponder.panHandlers}
          >
            <Svg width={fieldSize.width} height={fieldSize.height}>
              <Rect
                x={0}
                y={0}
                width={fieldSize.width}
                height={fieldSize.height}
                fill="#136F3E"
              />

              {Array.from({ length: Math.ceil(fieldSize.width / 80) }).map(
                (_, index) => (
                  <Rect
                    key={`stripe-${index}`}
                    x={index * 80}
                    y={0}
                    width={40}
                    height={fieldSize.height}
                    fill="rgba(10, 79, 42, 0.3)"
                  />
                ),
              )}

              {Array.from({ length: segmentCount + 1 }).map((_, index) => {
                const y = index * yardLineSpacing;
                return (
                  <Line
                    key={`yard-${index}`}
                    x1={0}
                    y1={y}
                    x2={fieldSize.width}
                    y2={y}
                    stroke="rgba(255,255,255,0.4)"
                    strokeWidth={2}
                  />
                );
              })}

              {Array.from({ length: Math.max(0, segmentCount - 1) }).map(
                (_, rowIndex) => {
                const y = (rowIndex + 1) * yardLineSpacing;
                return Array.from({ length: 9 }).map((__, colIndex) => {
                  const x = (fieldSize.width * (colIndex + 1)) / 10;
                  return (
                    <Line
                      key={`hash-${rowIndex}-${colIndex}`}
                      x1={x}
                      y1={y - 5}
                      x2={x}
                      y2={y + 5}
                      stroke="rgba(255,255,255,0.3)"
                      strokeWidth={1}
                    />
                  );
                });
              })}

              {Array.from({ length: segmentCount }).map((_, index) => {
                const yardNumber = (index + 1) * 10;
                const y = fieldSize.height - yardNumber / 10 * yardLineSpacing;
                return (
                  <SvgText
                    key={`yard-text-${index}`}
                    x={fieldSize.width / 4}
                    y={y - 10}
                    fill="rgba(255,255,255,0.3)"
                    fontSize={16}
                    textAnchor="middle"
                  >
                    {yardNumber}
                  </SvgText>
                );
              })}

              <Rect
                x={0}
                y={0}
                width={fieldSize.width}
                height={yardLineSpacing}
                fill="rgba(0, 0, 0, 0.2)"
              />
              <Rect
                x={0}
                y={fieldSize.height - yardLineSpacing}
                width={fieldSize.width}
                height={yardLineSpacing}
                fill="rgba(0, 0, 0, 0.2)"
              />

              {/* JUGS machine marker at (0,0) => bottom-center */}
              <Circle
                cx={fieldSize.width / 2}
                cy={fieldSize.height - 8}
                r={6}
                fill="#FFD700"
                stroke="#0a0f0d"
                strokeWidth={2}
              />
              <SvgText
                x={fieldSize.width / 2}
                y={fieldSize.height - 20}
                fill="rgba(255,255,255,0.7)"
                fontSize={12}
                textAnchor="middle"
              >
                JUGS
              </SvgText>

              {confirmedPaths.map((path, index) => (
                <Path
                  key={`path-${index}`}
                  d={path}
                  stroke="#FFD700"
                  strokeWidth={6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              ))}

              {currentPath.length > 1 && (
                <>
                  <Path
                    d={currentPathSvg}
                    stroke="rgba(255,215,0,0.5)"
                    strokeWidth={12}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                  <Path
                    d={currentPathSvg}
                    stroke="#FFD700"
                    strokeWidth={6}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </>
              )}

              {currentPath.length > 0 && (
                <>
                  <Circle
                    cx={currentPath[0].x}
                    cy={currentPath[0].y}
                    r={8}
                    fill="#FF4444"
                  />
                  <Circle
                    cx={currentPath[currentPath.length - 1].x}
                    cy={currentPath[currentPath.length - 1].y}
                    r={8}
                    fill="#44FF44"
                  />
                </>
              )}
            </Svg>
          </View>
        )}

        {allPaths.length === 0 && currentPath.length === 0 && (
          <View style={styles.instructionsOverlay} pointerEvents="none">
            <View style={styles.instructionsCard}>
              <Text style={styles.instructionsTitle}>Draw your route on the field</Text>
              <Text style={styles.instructionsSubtitle}>Tap and drag to create a path</Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.footerSpacer} />

      <Modal
        visible={showConfirmDialog}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirmDialog(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Route?</Text>
            <Text style={styles.modalDescription}>Send this route to the JUGS machine?</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalButtonSecondary} onPress={handleConfirmNo}>
                <Text style={styles.modalButtonTextSecondary}>No</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButtonPrimary} onPress={handleConfirmYes}>
                <Text style={styles.modalButtonTextPrimary}>Yes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0f0d',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backText: {
    color: '#FFFFFF',
    opacity: 0.8,
    fontSize: 14,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  headerSpacer: {
    width: 60,
  },
  invalidBanner: {
    backgroundColor: 'rgba(239,68,68,0.2)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(239,68,68,0.3)',
    paddingVertical: 10,
  },
  invalidText: {
    color: '#F87171',
    textAlign: 'center',
    fontSize: 14,
  },
  canvasWrapper: {
    flex: 1,
  },
  instructionsOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructionsCard: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  instructionsTitle: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 16,
  },
  instructionsSubtitle: {
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginTop: 6,
    fontSize: 13,
  },
  footerSpacer: {
    height: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#0d140f',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    borderWidth: 1,
    borderColor: '#136F3E',
  },
  modalTitle: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalDescription: {
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButtonSecondary: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalButtonTextSecondary: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  modalButtonPrimary: {
    flex: 1,
    backgroundColor: '#FFD700',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalButtonTextPrimary: {
    color: '#0a0f0d',
    fontWeight: '700',
  },
});
