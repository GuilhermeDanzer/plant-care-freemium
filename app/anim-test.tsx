/**
 * Animation Test Screen — /anim-test
 *
 * Navigate here via: router.push('/anim-test')
 * Or add a button on any screen temporarily.
 *
 * Tests:
 *  1. Splash ripple (watering button)
 *  2. Scale bounce (button press)
 *  3. Fade + slide-in (HealthResultCard style)
 *  4. Scroll parallax hero
 *  5. PlantCard edit mode scale/opacity
 */
import { useRouter } from 'expo-router'
import { useRef, useState } from 'react'
import {
  Animated as RNAnimated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Reanimated, {
  cancelAnimation,
  interpolate,
  type SharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated'

// ─── Reanimated: Dripping Droplets ──────────────────────────────────────────
function DropletsTest() {
  const wateringScale = useSharedValue(1)
  const dropletAnim1 = useSharedValue(0)
  const dropletAnim2 = useSharedValue(0)
  const dropletAnim3 = useSharedValue(0)
  const [fired, setFired] = useState(false)

  const buttonAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: wateringScale.value }],
  }))

  const createDropletStyle = (animValue: SharedValue<number>, delayOffset: number) => {
    return useAnimatedStyle(() => {
      // Start transparent, fade in quickly, fade out at bottom
      const opacity = interpolate(animValue.value, [0, 0.1, 0.8, 1], [0, 1, 1, 0])
      // Drop downwards
      const translateY = interpolate(animValue.value, [0, 1], [0, 60])
      // Stretch as it falls
      const scaleY = interpolate(animValue.value, [0, 0.5, 1], [0.8, 1.5, 2])
      // Slim out as it drops
      const scaleX = interpolate(animValue.value, [0, 0.5, 1], [1, 0.8, 0.4])
      
      return {
        opacity,
        transform: [{ translateY }, { scaleX }, { scaleY }],
      }
    })
  }

  const droplet1Style = createDropletStyle(dropletAnim1, 0)
  const droplet2Style = createDropletStyle(dropletAnim2, 1)
  const droplet3Style = createDropletStyle(dropletAnim3, 2)

  const trigger = () => {
    setFired(false)
    wateringScale.value = withSequence(
      withTiming(0.92, { duration: 100 }),
      withSpring(1, { damping: 8, stiffness: 120 }),
    )
    
    cancelAnimation(dropletAnim1)
    cancelAnimation(dropletAnim2)
    cancelAnimation(dropletAnim3)
    dropletAnim1.value = 0
    dropletAnim2.value = 0
    dropletAnim3.value = 0
    
    dropletAnim1.value = withTiming(1, { duration: 600 })
    setTimeout(() => { dropletAnim2.value = withTiming(1, { duration: 600 }) }, 150)
    setTimeout(() => { dropletAnim3.value = withTiming(1, { duration: 600 }, (finished) => {
      if (finished) {
        // use runOnJS here if needed
      }
    }) }, 300)
    setFired(true)
  }

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>1. Dripping Droplets (Reanimated)</Text>
      <Text style={styles.cardSubtitle}>Should see 3 droplets falling when tapped</Text>
      <View style={{ alignItems: 'center', marginTop: 16 }}>
        <Reanimated.View style={buttonAnimStyle}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={trigger}
            style={styles.waterButton}>
            {/* Droplets layer */}
            <View style={styles.dropletOverlay} pointerEvents="none">
              <Reanimated.View style={[styles.droplet, droplet1Style, { left: '30%' }]} />
              <Reanimated.View style={[styles.droplet, droplet2Style, { left: '50%' }]} />
              <Reanimated.View style={[styles.droplet, droplet3Style, { left: '70%' }]} />
            </View>
            {/* Label */}
            <View style={styles.waterBtnContent} pointerEvents="none">
              <Text style={styles.waterBtnText}>💧 Tap to Water</Text>
            </View>
          </TouchableOpacity>
        </Reanimated.View>
        <Text style={[styles.statusText, { marginTop: 8 }]}>
          {fired ? '✅ Animation fired' : 'Waiting for tap…'}
        </Text>
      </View>
    </View>
  )
}

// ─── Reanimated: Fade + SlideIn ────────────────────────────────────────────
function FadeSlideTest() {
  const opacity = useSharedValue(0)
  const translateY = useSharedValue(20)
  const [visible, setVisible] = useState(false)

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }))

  const show = () => {
    opacity.value = 0
    translateY.value = 20
    setVisible(true)
    opacity.value = withTiming(1, { duration: 400 })
    translateY.value = withTiming(0, { duration: 400 })
  }

  const hide = () => {
    opacity.value = withTiming(0, { duration: 300 })
    translateY.value = withTiming(20, { duration: 300 }, () => {
      // note: can't call setVisible here safely without runOnJS
    })
  }

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>2. Fade + Slide (Reanimated)</Text>
      <Text style={styles.cardSubtitle}>Card should fade in from below</Text>
      <View style={styles.row}>
        <Pressable onPress={show} style={[styles.smallBtn, { backgroundColor: '#059669' }]}>
          <Text style={styles.smallBtnText}>Show</Text>
        </Pressable>
        <Pressable onPress={hide} style={[styles.smallBtn, { backgroundColor: '#475569' }]}>
          <Text style={styles.smallBtnText}>Hide</Text>
        </Pressable>
      </View>
      {visible && (
        <Reanimated.View style={[styles.floatingCard, animStyle]}>
          <Text style={{ color: '#0f172a', fontWeight: 'bold' }}>🌿 I appeared!</Text>
        </Reanimated.View>
      )}
    </View>
  )
}

// ─── RN Animated: PlantCard scale/opacity ──────────────────────────────────
function RNAnimatedTest() {
  const scale = useRef(new RNAnimated.Value(1)).current
  const opacity = useRef(new RNAnimated.Value(1)).current
  const [editing, setEditing] = useState(false)

  const toggle = () => {
    const toEditing = !editing
    setEditing(toEditing)
    RNAnimated.parallel([
      RNAnimated.timing(scale, {
        toValue: toEditing ? 0.97 : 1,
        duration: 180,
        useNativeDriver: true,
      }),
      RNAnimated.timing(opacity, {
        toValue: toEditing ? 0.85 : 1,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start()
  }

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>3. RN Animated Scale + Opacity</Text>
      <Text style={styles.cardSubtitle}>Plant card edit mode effect</Text>
      <View style={{ alignItems: 'center', marginTop: 16 }}>
        <RNAnimated.View
          style={[
            styles.plantCardPreview,
            { transform: [{ scale }], opacity },
          ]}>
          <Text style={{ fontSize: 32 }}>🌵</Text>
          <Text style={{ fontWeight: 'bold', color: '#0f172a', marginTop: 8 }}>Cactus</Text>
          <Text style={{ fontSize: 12, color: '#64748b' }}>Cactaceae</Text>
        </RNAnimated.View>
        <Pressable onPress={toggle} style={[styles.smallBtn, { backgroundColor: '#0f172a', marginTop: 12 }]}>
          <Text style={styles.smallBtnText}>{editing ? '✅ Done Editing' : '✏️ Edit Mode'}</Text>
        </Pressable>
      </View>
    </View>
  )
}

// ─── Reanimated: Scroll Parallax ───────────────────────────────────────────
function ParallaxTest() {
  const scrollY = useSharedValue(0)

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y
    },
  })

  const heroStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(scrollY.value, [-100, 0, 100], [1.2, 1, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        }),
      },
      {
        translateY: interpolate(scrollY.value, [-100, 0, 100], [-50, 0, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        }),
      },
    ],
  }))

  return (
    <View style={[styles.card, { height: 250 }]}>
      <Text style={styles.cardTitle}>4. Scroll Parallax (Reanimated)</Text>
      <Text style={styles.cardSubtitle}>Scroll inside the box — hero should scale</Text>
      <Reanimated.ScrollView
        style={{ flex: 1, marginTop: 8, borderRadius: 12, overflow: 'hidden' }}
        onScroll={scrollHandler}
        scrollEventThrottle={16}>
        <Reanimated.View
          style={[
            {
              height: 100,
              borderRadius: 12,
              backgroundColor: '#059669',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 8,
            },
            heroStyle,
          ]}>
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>🌿 Hero Card</Text>
        </Reanimated.View>
        {Array.from({ length: 6 }).map((_, i) => (
          <View key={i} style={{ height: 48, backgroundColor: '#f1f5f9', borderRadius: 8, marginBottom: 8, justifyContent: 'center', paddingHorizontal: 12 }}>
            <Text style={{ color: '#64748b' }}>Row {i + 1}</Text>
          </View>
        ))}
      </Reanimated.ScrollView>
    </View>
  )
}

// ─── Main Screen ───────────────────────────────────────────────────────────
export default function AnimTestScreen() {
  const router = useRouter()

  if (!__DEV__) return null

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={{ fontSize: 16 }}>← Back</Text>
          </Pressable>
          <Text style={styles.screenTitle}>Animation Debugger</Text>
          <View style={{ width: 60 }} />
        </View>

        <View style={styles.banner}>
          <Text style={styles.bannerText}>
            🧪 If animations are NOT working, check:
          </Text>
          <Text style={styles.bannerItem}>• babel.config.js has react-native-worklets/plugin</Text>
          <Text style={styles.bannerItem}>• Project rebuilt after babel change (not just reloaded)</Text>
          <Text style={styles.bannerItem}>• useSharedValue inside the component body</Text>
        </View>

        <DropletsTest />
        <FadeSlideTest />
        <RNAnimatedTest />
        <ParallaxTest />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  backBtn: {
    width: 60,
    padding: 8,
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  banner: {
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#fde68a',
    gap: 4,
  },
  bannerText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 4,
  },
  bannerItem: {
    fontSize: 12,
    color: '#78350f',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#64748b',
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  smallBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  smallBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  statusText: {
    fontSize: 13,
    color: '#64748b',
  },
  floatingCard: {
    marginTop: 12,
    backgroundColor: '#ecfdf5',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#a7f3d0',
    alignItems: 'center',
    width: '100%',
  },
  // Splash ripple test
  waterButton: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 16,
    padding: 20,
    backgroundColor: '#059669',
    width: 220,
  },
  splashOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 0,
  },
  splashCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#6ee7b7',
  },
  dropletOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  droplet: {
    position: 'absolute',
    top: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#a7f3d0',
  },
  waterBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  waterBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  // Plant card preview
  plantCardPreview: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    width: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
})
