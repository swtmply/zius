import { ExpenseCreationToast } from "@/components/layout/expense-creation-toast";
import { groupReceiptLines, parseReceiptLines } from "@/utils/scan-utils";
import { Check, ChevronLeft, ImageIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { recognizeText, type OcrResult } from "expo-ocr-kit";
import { useFocusEffect, useRouter } from "expo-router";
import { Button, PressableFeedback, Skeleton, Typography, useToast } from "heroui-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ScanState = { status: "camera" } | { status: "preview" | "processing"; uri: string };

export async function selectImage() {
  const photo = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    quality: 1,
  });
  if (!photo.canceled) return photo.assets[0];
}

export default function Scan() {
  const cameraRef = useRef<CameraView>(null);
  const requestedPermission = useRef(false);
  const busy = useRef(false);
  const active = useRef(false);
  const [isFocused, setIsFocused] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraReady, setCameraReady] = useState(false);
  const [acquiring, setAcquiring] = useState(false);
  const [imageSize, setImageSize] = useState<{ width: number; height: number }>();
  const [previewSize, setPreviewSize] = useState({ width: 0, height: 0 });
  const [ocrResult, setOcrResult] = useState<OcrResult>();
  const [selectedBlock, setSelectedBlock] = useState<number>();
  const [state, setState] = useState<ScanState>({ status: "camera" });
  const insets = useSafeAreaInsets();

  useFocusEffect(
    useCallback(() => {
      active.current = true;
      setIsFocused(true);
      return () => {
        active.current = false;
        setIsFocused(false);
        setCameraReady(false);
      };
    }, []),
  );

  useEffect(() => {
    if (
      permission &&
      !permission.granted &&
      permission.canAskAgain &&
      !requestedPermission.current
    ) {
      requestedPermission.current = true;
      void requestPermission();
    }
  }, [permission, requestPermission]);

  const showError = (title: string, description: string) => {
    toast.show({
      component: (props) => (
        <ExpenseCreationToast {...props} variant="danger" title={title} description={description} />
      ),
    });
  };

  const acquireImage = async (source: "camera" | "gallery") => {
    if (busy.current || (source === "camera" && !cameraReady)) return;
    busy.current = true;
    setAcquiring(true);
    try {
      const photo =
        source === "gallery"
          ? await selectImage()
          : await cameraRef.current?.takePictureAsync({ quality: 1 });
      if (photo && active.current) {
        const { uri, width, height } = photo;
        setCameraReady(false);
        // Keep the original dimensions: the image loader may report a downsampled bitmap.
        setImageSize({ width, height });
        setOcrResult(undefined);
        setSelectedBlock(undefined);
        setState({ status: "processing", uri });
        await processImage(uri);
      }
    } catch {
      if (active.current)
        showError(
          "Unable to open image",
          "Please take another picture or choose an image from your gallery.",
        );
    } finally {
      busy.current = false;
      setAcquiring(false);
    }
  };

  const processImage = async (uri: string) => {
    try {
      const result = await recognizeText(uri);
      if (!result) throw new Error("No OCR result");
      setOcrResult(result);
      setSelectedBlock(undefined);
    } catch {
      if (active.current)
        showError(
          "Unable to process receipt",
          "Try processing again or retake the picture with the receipt in focus.",
        );
    } finally {
      setState({ status: "preview", uri });
    }
  };

  const retryProcessing = async () => {
    if (state.status !== "preview" || busy.current) return;
    busy.current = true;
    setState({ status: "processing", uri: state.uri });
    try {
      await processImage(state.uri);
    } finally {
      busy.current = false;
    }
  };

  const submit = () => {
    if (state.status !== "preview" || busy.current || !ocrResult) return;
    const receipt = parseReceiptLines(groupReceiptLines(ocrResult.blocks));
    router.push({
      pathname: "/expenses/create",
      params: { receipt: JSON.stringify(receipt) },
    });
  };

  const retake = () => {
    if (busy.current) return;

    setCameraReady(false);
    setImageSize(undefined);
    setOcrResult(undefined);
    setSelectedBlock(undefined);
    setState({ status: "camera" });
  };

  if (state.status !== "camera") {
    const processing = state.status === "processing";
    const scale = imageSize
      ? Math.min(previewSize.width / imageSize.width, previewSize.height / imageSize.height)
      : 0;
    const offsetX = imageSize ? (previewSize.width - imageSize.width * scale) / 2 : 0;
    const offsetY = imageSize ? (previewSize.height - imageSize.height * scale) / 2 : 0;

    return (
      <View className="flex-1 bg-page" style={{ paddingTop: insets.top }}>
        <View className="flex-row items-center justify-between px-4 py-4">
          <Button
            isIconOnly
            variant="ghost"
            accessibilityLabel="Retake receipt"
            isDisabled={processing}
            onPress={retake}
          >
            <HugeiconsIcon icon={ChevronLeft} size={24} color="#000000" />
          </Button>
          <Typography className="text-2xl font-semibold text-ink">Preview</Typography>
          <Button
            isIconOnly
            variant="ghost"
            accessibilityLabel="Submit receipt"
            isDisabled={processing || !ocrResult}
            accessibilityState={{ busy: processing }}
            onPress={() => void submit()}
          >
            <HugeiconsIcon icon={Check} size={24} color="#000000" />
          </Button>
        </View>

        <ScrollView
          className="flex-1"
          contentInsetAdjustmentBehavior="never"
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            paddingHorizontal: 28,
            paddingBottom: Math.max(insets.bottom, 24) + 12,
          }}
        >
          <View className="rounded-2xl bg-panel p-4">
            <View className="relative overflow-hidden rounded-2xl">
              <Image
                source={{ uri: state.uri }}
                contentFit="contain"
                contentPosition="center"
                onLayout={({ nativeEvent: { layout } }) => {
                  setPreviewSize({ width: layout.width, height: layout.height });
                }}
                style={{
                  width: "100%",
                  aspectRatio: imageSize ? imageSize.width / imageSize.height : 3 / 4,
                }}
                accessibilityLabel="Selected receipt"
              />
              {imageSize &&
                scale > 0 &&
                ocrResult?.blocks.map((block, index) => {
                  const { x, y, width, height } = block.boundingBox;
                  if (![x, y, width, height].every(Number.isFinite) || width <= 0 || height <= 0)
                    return null;
                  const selected = selectedBlock === index;

                  return (
                    <Pressable
                      key={index}
                      accessibilityRole="button"
                      accessibilityLabel={block.text}
                      accessibilityHint="Highlights this item on the receipt"
                      accessibilityState={{ selected }}
                      onPress={() => setSelectedBlock(selected ? undefined : index)}
                      style={{
                        position: "absolute",
                        // Match contentFit="contain", including any centered empty space.
                        left: offsetX + x * scale,
                        top: offsetY + y * scale,
                        width: width * scale,
                        height: height * scale,
                        borderWidth: selected ? 3 : 2,
                        borderColor: selected ? "#C2410C" : "#2563EB",
                        backgroundColor: "transparent",
                        zIndex: selected ? 1 : 0,
                      }}
                    />
                  );
                })}
              {processing && (
                <View
                  className="absolute inset-0 items-center justify-center bg-black/10"
                  accessibilityLabel="Processing receipt"
                  accessibilityState={{ busy: true }}
                >
                  <View className="rounded-full bg-panel px-4 py-2">
                    <Typography
                      className="text-xs font-semibold text-ink"
                      accessibilityLiveRegion="polite"
                    >
                      Processing receipt…
                    </Typography>
                  </View>
                </View>
              )}
            </View>
          </View>
          {!processing && (
            <View className="gap-2 pt-4">
              <Typography className="text-xs text-muted" accessibilityLiveRegion="polite">
                {!ocrResult
                  ? "Could not read the receipt. Try again or retake the picture."
                  : ocrResult.blocks.length === 0
                    ? "No text found. Retake the picture with the receipt in focus."
                    : selectedBlock !== undefined
                      ? ocrResult.blocks[selectedBlock]?.text
                      : "Tap an outlined item to highlight it."}
              </Typography>
              {!ocrResult && (
                <Button variant="secondary" onPress={() => void retryProcessing()}>
                  <Button.Label>Try again</Button.Label>
                </Button>
              )}
            </View>
          )}
        </ScrollView>
      </View>
    );
  }

  if (!permission) {
    return (
      <View className="flex-1 bg-page pt-safe px-4 pb-8 gap-4">
        <Skeleton className="flex-1 rounded-xl" />
        <Skeleton className="h-12 rounded-xl" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 bg-page items-center justify-center gap-4 px-6 pt-safe">
        <Typography className="text-sm text-center">
          Camera access is required to take receipt photos. You can also choose an image from your
          gallery.
        </Typography>
        {permission.canAskAgain && (
          <Button onPress={requestPermission}>
            <Button.Label>Allow camera</Button.Label>
          </Button>
        )}
        <Button variant="secondary" isDisabled={acquiring} onPress={() => acquireImage("gallery")}>
          <Button.Label>Choose from gallery</Button.Label>
        </Button>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      {isFocused && (
        <CameraView
          ref={cameraRef}
          style={{ flex: 1 }}
          facing="back"
          onCameraReady={() => setCameraReady(true)}
          onMountError={() => {
            setCameraReady(false);
            showError(
              "Unable to start camera",
              "Try reopening Scan or choose an image from your gallery.",
            );
          }}
        />
      )}
      <View className="absolute inset-x-0 bottom-0 h-40 bg-black/35" pointerEvents="none" />
      <View
        className="absolute inset-x-0 flex-row items-center justify-around px-8"
        style={{ bottom: Math.max(insets.bottom + 8, 36) }}
      >
        <PressableFeedback
          accessibilityLabel="Choose from gallery"
          isDisabled={acquiring}
          className="h-15 w-15 items-center justify-center rounded-full bg-black/35"
          onPress={() => acquireImage("gallery")}
        >
          <HugeiconsIcon icon={ImageIcon} color="white" size={24} />
        </PressableFeedback>
        <PressableFeedback
          accessibilityLabel="Take picture"
          isDisabled={!cameraReady || acquiring}
          onPress={() => acquireImage("camera")}
          className="h-20 w-20 items-center justify-center rounded-full border-4 border-white"
        >
          <View className="h-16 w-16 rounded-full bg-white" />
        </PressableFeedback>
        <View className="h-12 w-12" />
      </View>
    </View>
  );
}
