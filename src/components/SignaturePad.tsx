import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { View, Text, Pressable, StyleSheet, PanResponder } from "react-native";
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

// Self-contained finger-drawn signature (PanResponder + react-native-svg) -
// avoids pulling in a WebView-backed signature library just for this one
// field.
export const SignaturePad = forwardRef<
  SignaturePadHandle,
  { onChange: (hasSignature: boolean) => void }
>(function SignaturePad({ onChange }, ref) {
  const [paths, setPaths] = useState<string[]>([]);
  const [livePath, setLivePath] = useState("");
  const pathRef = useRef("");

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
  // finger-lift (onPanResponderRelease) and the termination safety net below.
  const commitStroke = () => {
    if (!pathRef.current) return;
    setPaths((prev) => {
      const next = [...prev, pathRef.current];
      onChange(next.length > 0);
      return next;
    });
    pathRef.current = "";
    setLivePath("");
  };

  const panResponder = useRef(
    PanResponder.create({
      // This pad lives inside a ScrollView (Screen.tsx) - claiming only at
      // the bubble phase (onStartShouldSetPanResponder/onMoveShould...)
      // means the ScrollView gets first look and can steal a
      // slightly-vertical signing stroke as a scroll gesture mid-draw,
      // which is exactly what made the signature vanish right as the
      // finger lifted (the stroke was terminated, never released, so it
      // was never committed to `paths` or saved). Claiming at the capture
      // phase and refusing to give the responder back once granted fixes
      // this outright.
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (e) => {
        const { locationX, locationY } = e.nativeEvent;
        pathRef.current = `M${locationX.toFixed(1)},${locationY.toFixed(1)}`;
        setLivePath(pathRef.current);
      },
      onPanResponderMove: (e) => {
        const { locationX, locationY } = e.nativeEvent;
        pathRef.current += ` L${locationX.toFixed(1)},${locationY.toFixed(1)}`;
        setLivePath(pathRef.current);
      },
      onPanResponderRelease: commitStroke,
      // Safety net in case something still forces termination (e.g. an
      // incoming call, an OS-level gesture) - commit rather than silently
      // drop whatever was drawn so far.
      onPanResponderTerminate: commitStroke,
    }),
  ).current;

  const clear = () => {
    setPaths([]);
    setLivePath("");
    onChange(false);
  };

  return (
    <View>
      <View style={styles.pad} {...panResponder.panHandlers}>
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
