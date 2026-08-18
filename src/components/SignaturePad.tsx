import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Svg, { Path } from "react-native-svg";
import { RotateCcw } from "lucide-react-native";
import { colors } from "@/theme/colors";

export interface SignaturePadHandle {
  // An SVG data URL built from the drawn strokes - avoids pulling in
  // react-native-view-shot (a native module) just to rasterize this one
  // field into a PNG. The backend just stores whatever string it's given
  // (installation_records.signature_data is a plain LONGTEXT), so an
  // image/svg+xml data URL is just as valid as technician-katsana (web)'s
  // PNG one for that purpose.
  getDataUrl: () => string | null;
}

// Self-contained finger-drawn signature (gesture-handler + react-native-svg) -
// avoids pulling in a WebView-backed signature library just for this one
// field.
export const SignaturePad = forwardRef<
  SignaturePadHandle,
  { onChange: (hasSignature: boolean) => void }
>(function SignaturePad({ onChange }, ref) {
  const [paths, setPaths] = useState<string[]>([]);
  const [livePath, setLivePath] = useState("");
  const pathRef = useRef("");
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useImperativeHandle(ref, () => ({
    getDataUrl: () => {
      if (paths.length === 0) return null;
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="160" viewBox="0 0 400 160">${paths
        .map((d) => `<path d="${d}" stroke="#1e293b" stroke-width="2.5" fill="none" />`)
        .join("")}</svg>`;
      return `data:image/svg+xml,${encodeURIComponent(svg)}`;
    },
  }));

  // Commits whatever's been drawn so far into `paths` - shared by a normal
  // finger-lift (onTouchesUp) and the cancellation safety net below.
  const commitStroke = () => {
    if (!pathRef.current) return;
    setPaths((prev) => {
      const next = [...prev, pathRef.current];
      onChangeRef.current(next.length > 0);
      return next;
    });
    pathRef.current = "";
    setLivePath("");
  };

  const addPoint = (x: number, y: number, isStart: boolean) => {
    pathRef.current = isStart
      ? `M${x.toFixed(1)},${y.toFixed(1)}`
      : `${pathRef.current} L${x.toFixed(1)},${y.toFixed(1)}`;
    setLivePath(pathRef.current);
  };

  // This pad lives inside a ScrollView (Screen.tsx). The previous
  // implementation used the core PanResponder API, whose gesture
  // arbitration runs as a JS-thread negotiation with the ScrollView on
  // every touch - under load (e.g. mid-stroke) that negotiation could lose
  // the race and the ScrollView would force-terminate the stroke right as
  // the finger lifted, before it was ever committed to `paths`, so the
  // signature visually vanished. react-native-gesture-handler resolves
  // gesture ownership natively (off the JS thread) instead, which is the
  // reliable fix for a drawing surface nested in scrollable content -
  // onTouchesDown/Move/Up drive the stroke directly, and onTouchesCancelled
  // still commits so nothing drawn is ever silently dropped.
  // Memoized so the gesture (and its underlying native handler) is created
  // once, not re-created on every point added mid-stroke - addPoint/
  // commitStroke only close over refs and stable setState functions, so
  // reusing the render-1 instances forever is safe and avoids any chance of
  // gesture-handler tearing down/reattaching the handler mid-draw.
  const drawGesture = useMemo(
    () =>
      Gesture.Pan()
        .runOnJS(true)
        .minDistance(0)
        .shouldCancelWhenOutside(false)
        .onTouchesDown((e) => {
          const t = e.allTouches[0];
          if (t) addPoint(t.x, t.y, true);
        })
        .onTouchesMove((e) => {
          const t = e.allTouches[0];
          if (t) addPoint(t.x, t.y, false);
        })
        .onTouchesUp(commitStroke)
        .onTouchesCancelled(commitStroke),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const clear = () => {
    setPaths([]);
    setLivePath("");
    onChange(false);
  };

  return (
    <View>
      <GestureDetector gesture={drawGesture}>
        <View style={styles.pad}>
          {paths.length === 0 && !livePath && <Text style={styles.hint}>Sign here</Text>}
          <Svg style={StyleSheet.absoluteFill}>
            {[...paths, livePath].map(
              (d, i) =>
                d.length > 0 && (
                  <Path key={i} d={d} stroke={colors.slate800} strokeWidth={2.5} fill="none" />
                ),
            )}
          </Svg>
        </View>
      </GestureDetector>
      {paths.length > 0 && (
        <Pressable onPress={clear} style={styles.clearBtn}>
          <RotateCcw size={13} color={colors.slate500} />
          <Text style={styles.clearText}>Clear</Text>
        </Pressable>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  pad: {
    height: 160,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.slate300,
    backgroundColor: colors.slate50,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  hint: { color: colors.slate400, fontSize: 13 },
  clearBtn: {
    marginTop: 8,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  clearText: { fontSize: 12, color: colors.slate500, fontWeight: "500" },
});
