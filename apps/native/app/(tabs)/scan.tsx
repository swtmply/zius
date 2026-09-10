import { ExpenseCreationToast } from "@/components/expense-creation-toast";
import { groupReceiptLines, parseReceiptLines } from "@/utils/scan";
import { ImageIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { recognizeText } from "expo-ocr-kit";
import { useFocusEffect, useRouter } from "expo-router";
import { Button, PressableFeedback, Skeleton, Typography, useToast } from "heroui-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { ScrollView, View } from "react-native";

type ScanState = { status: "camera" } | { status: "preview" | "processing"; uri: string };

export async function selectImage() {
  const photo = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    quality: 1,
  });
  if (!photo.canceled) return photo.assets[0]?.uri;
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
  const [state, setState] = useState<ScanState>({ status: "camera" });

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
      const uri =
        source === "gallery"
          ? await selectImage()
          : (await cameraRef.current?.takePictureAsync({ quality: 1 }))?.uri;
      if (uri && active.current) {
        setCameraReady(false);
        setState({ status: "preview", uri });
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

  const submit = async () => {
    if (state.status !== "preview" || busy.current) return;
    const uri = state.uri;
    busy.current = true;
    setState({ status: "processing", uri });
    try {
      const result = await recognizeText(uri);
      if (!result) throw new Error("No OCR result");
      const receipt = parseReceiptLines(groupReceiptLines(result.blocks));
      if (active.current) {
        router.push({
          pathname: "/(forms)/create-expense",
          params: { receipt: JSON.stringify(receipt) },
        });
      }
    } catch {
      if (active.current)
        showError(
          "Unable to process receipt",
          "Try submitting again or retake the picture with the receipt in focus.",
        );
    } finally {
      setState({ status: "preview", uri });
      busy.current = false;
    }
  };

  if (state.status !== "camera") {
    const processing = state.status === "processing";
    return (
      <ScrollView
        className="flex-1 bg-background"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="pt-safe px-4 pb-8 gap-4"
      >
        <Typography className="text-2xl font-semibold">Review receipt</Typography>
        <View className="overflow-hidden rounded-xl border border-border bg-surface">
          <Image
            source={{ uri: state.uri }}
            contentFit="contain"
            style={{ width: "100%", aspectRatio: 3 / 4 }}
            accessibilityLabel="Selected receipt"
          />
        </View>
        <Typography className="text-xs text-muted" accessibilityLiveRegion="polite">
          {processing
            ? "Processing your receipt…"
            : "Check that the receipt is clear and all items are visible."}
        </Typography>
        {processing && (
          <View
            className="gap-2"
            accessibilityLabel="Processing receipt"
            accessibilityState={{ busy: true }}
          >
            {[0, 1, 2].map((row) => (
              <View key={row} className="flex-row items-center gap-4 py-2">
                <Skeleton className="h-4 w-8 rounded-md" />
                <Skeleton className="h-4 flex-1 rounded-md" />
                <Skeleton className="h-4 w-20 rounded-md" />
              </View>
            ))}
          </View>
        )}
        <View className="flex-row items-center gap-4">
          <Button
            className="flex-1"
            variant="secondary"
            isDisabled={processing}
            onPress={() => {
              setCameraReady(false);
              setState({ status: "camera" });
            }}
          >
            <Button.Label>Retake</Button.Label>
          </Button>
          <Button
            className="flex-1"
            isDisabled={processing}
            onPress={submit}
            accessibilityState={{ busy: processing }}
          >
            <Button.Label>{processing ? "Processing…" : "Submit"}</Button.Label>
          </Button>
        </View>
      </ScrollView>
    );
  }

  if (!permission) {
    return (
      <View className="flex-1 bg-background pt-safe px-4 pb-8 gap-4">
        <Skeleton className="flex-1 rounded-xl" />
        <Skeleton className="h-12 rounded-xl" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 bg-background items-center justify-center gap-4 px-6 pt-safe">
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
    <View className="flex-1 bg-background">
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
      <View className="absolute inset-x-0 bottom-10 flex-row items-center justify-around px-8">
        <PressableFeedback
          accessibilityLabel="Choose from gallery"
          isDisabled={acquiring}
          className="h-12 w-12 items-center justify-center rounded-full bg-white/20"
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
