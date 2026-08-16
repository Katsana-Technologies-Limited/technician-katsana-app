import { useRef, useState } from "react";
import { View, Text, Pressable, StyleSheet, PanResponder } from "react-native";
import Svg, { Path } from "react-native-svg";
import { RotateCcw } from "lucide-react-native";
import { colors } from "@/theme/colors";

// Self-contained finger-drawn signature (PanResponder + react-native-svg) -
// avoids pulling in a WebView-backed signature library just for this one
// field.
export function SignaturePad({ onChange }: { onChange: (hasSignature: boolean) => void }) {
  const [paths, setPaths] = useState<string[]>([]);
  const [livePath, setLivePath] = useState("");
  const pathRef = useRef("");

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
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
      onPanResponderRelease: () => {
        setPaths((prev) => {
          const next = [...prev, pathRef.current];
          onChange(next.length > 0);
          return next;
        });
        pathRef.current = "";
        setLivePath("");
      },
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
}

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
