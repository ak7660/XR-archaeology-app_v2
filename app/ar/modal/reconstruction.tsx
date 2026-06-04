import { Button, Text } from "react-native-paper";
import { RemoteARInfo, resolveImageSource } from "../fixed-things/ar";
import { Image, StyleSheet, View } from "react-native";
import { useAppTheme } from "@/providers/style_provider";
import { router } from "expo-router";
import { Routes } from "@/app/composable/routes";

export function ReconstructionModalBody(props: { ar_info: RemoteARInfo; close: () => void }) {
  const { theme } = useAppTheme();
  const style = useStyle();
  const { ar_info, close } = props;
  const handleClose = () => {
    close();
  };
  const gotoReconstructionGuide = () => {
    close();
    if (ar_info) {
      router.replace({ pathname: Routes.ArGuide, params: { id: ar_info._id } });
    }
  };

  const imageSource = ar_info?.images?.[0] != null ? resolveImageSource(ar_info.images[0]) : undefined;

  return (
    <View style={style.modalContainer}>
      <Text style={style.modalTitle}>{`You are approaching\n${ar_info?.name}`}</Text>
      {imageSource && <Image source={imageSource} style={style.modalImage} />}
      <Text style={style.modalText}>Would you like to explore the AR reconstruction?</Text>
      <View style={style.buttonContainer}>
        <Button
          style={style.modalButton}
          mode="contained"
          buttonColor={theme.colors.primary}
          labelStyle={{ marginHorizontal: theme.spacing.lg, marginVertical: theme.spacing.sm }}
          onPress={gotoReconstructionGuide}
        >
          <Text style={style.modalButtonText}>Let's see!</Text>
        </Button>
        <Button
          style={style.modalButton}
          mode="contained"
          buttonColor={theme.colors.error}
          labelStyle={{ marginHorizontal: theme.spacing.lg, marginVertical: theme.spacing.sm }}
          onPress={handleClose}
        >
          <Text style={style.modalButtonText}>Not interested.</Text>
        </Button>
      </View>
    </View>
  );
}

const useStyle = () =>
  StyleSheet.create({
    modalContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
      backgroundColor: "white",
    },
    modalTitle: {
      textAlign: "center",
      marginBottom: 24,
      fontWeight: "bold",
      fontSize: 20,
    },
    modalText: {
      paddingTop: 15,
      textAlign: "center",
      marginBottom: 20,
      fontSize: 16,
    },
    modalImage: {
      resizeMode: "cover",
      width: "100%",
      height: 200,
    },
    modalButton: {
      marginTop: 20,
    },
    modalButtonText: {
      color: "white",
      textAlign: "center",
    },
    buttonContainer: {
      width: "100%",
      flexDirection: "row",
      display: "flex",
      justifyContent: "space-around",
      marginVertical: 30,
    },
  });
