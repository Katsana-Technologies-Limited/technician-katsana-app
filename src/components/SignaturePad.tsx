import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import SignatureCanvas, { type SignatureViewRef } from "react-native-signature-canvas";
import { RotateCcw } from "lucide-react-native";
import { colors } from "@/theme/colors";

export interface SignaturePadHandle {
  getDataUrl: () => string | null;
}

// The pad lives inside a ScrollView (Screen.tsx). Two from-scratch attempts
// at a finger-drawn pad (RN core PanResponder, then
// react-native-gesture-handler's raw touch events) both still lost strokes
// on release - RN's JS-thread gesture arbitration with the parent
// ScrollView is fundamentally unreliable for this. A WebView-backed pad
// (signature_pad under the hood) sidesteps that class of bug entirely: the
// canvas captures its own touches natively inside the WebView, never
// negotiating with the outer ScrollView's responder chain. It also handles
// a single tap-without-drag as a dot correctly (e.g. dotting an "i"), which
// the hand-rolled SVG-path version could not.
export const SignaturePad = forwardRef<
  SignaturePadHandle,
  { onChange: (hasSignature: boolean) => void }
>(function SignaturePad({ onChange }, ref) {
  const canvasRef = useRef<SignatureViewRef>(null);
  const dataUrlRef = useRef<string | null>(null);
  const [hasSignature, setHasSignature] = useState(false);

  useImperativeHandle(ref, () => ({
    getDataUrl: () => dataUrlRef.current,
  }));

  const clear = () => {
    canvasRef.current?.clearSignature();
    dataUrlRef.current = null;
    setHasSignature(false);
    onChange(false);
  };

  return (
    <View>
      <View style={styles.pad}>
        <SignatureCanvas
          ref={canvasRef}
          autoClear={false}
          descriptionText=""
          backgroundColor={colors.slate50}
          penColor={colors.slate800}
          webStyle={webStyle}
          // Read back the data URL after every stroke, not just before
          // submit, so `getDataUrl()` (called synchronously from
          // InstallationFormScreen's handleComplete) is always current.
          onEnd={() => canvasRef.current?.readSignature()}
          onOK={(sig) => {
            dataUrlRef.current = sig;
            setHasSignature(true);
            onChange(true);
          }}
          onEmpty={() => {
            dataUrlRef.current = null;
            setHasSignature(false);
            onChange(false);
          }}
        />
        {!hasSignature && (
          <Text style={styles.hint} pointerEvents="none">
            Sign here
          </Text>
        )}
      </View>
      {hasSignature && (
        <Pressable onPress={clear} style={styles.clearBtn}>
          <RotateCcw size={13} color={colors.slate500} />
          <Text style={styles.clearText}>Clear</Text>
        </Pressable>
      )}
    </View>
  );
});

// Hides the library's built-in Clear/Confirm footer and description row -
// this component provides its own Clear button and auto-reads the
// signature after every stroke instead.
const webStyle = `
  .m-signature-pad--footer { display: none; margin: 0; }
  .m-signature-pad--body { border: none; }
  .m-signature-pad { box-shadow: none; border: none; }
  body, html { background-color: transparent; }
`;

const styles = StyleSheet.create({
  pad: {
    height: 160,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.slate300,
    backgroundColor: colors.slate50,
    overflow: "hidden",
  },
  hint: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    color: colors.slate400,
    fontSize: 13,
    textAlign: "center",
    textAlignVertical: "center",
  },
  clearBtn: {
    marginTop: 8,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  clearText: { fontSize: 12, color: colors.slate500, fontWeight: "500" },
});
