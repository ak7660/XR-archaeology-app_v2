import { Button, Text } from "react-native-paper";
import { RemoteTrenchInfo, resolveImageSource } from "../fixed-things/ar";
import { StyleSheet, View } from "react-native";
import { AppTheme, useAppTheme } from "@/providers/style_provider";
import { useMemo, useState } from "react";
import { Image } from "react-native";
import { Tts } from "@/components/common/tts";

export function TrenchModalBody(props: { trench_info: RemoteTrenchInfo; close: () => void }) {
  const { trench_info, close } = props;
  const { theme } = useAppTheme();
  const style = useStyle(theme);
  const [page, setPage] = useState(0);
  const min_page = 0;

  // Support both backend pages[] format and legacy text[]/image[] format
  const pages = trench_info.pages;
  const max_page = pages.length - 1;

  const [agree, setAgree] = useState(false);
  const image_source = useMemo(() => {
    const p = pages[page];
    if (!p) return undefined;
    const imgId = trench_info.images?.[p.imageIndex];
    return resolveImageSource(imgId);
  }, [page, pages, trench_info.images]);
  const text = useMemo(() => {
    return pages[page]?.text ?? '';
  }, [page, pages]);

  return (
    <View style={style.modalContainer}>
      <Text style={style.modalText}>{!agree ? `You've reached ${'\n'} ${trench_info.name}` : trench_info.name}</Text>
      {image_source && <Image source={image_source} style={style.modalImage} />}

      {agree ? (
        <>
          <Tts style={style.descText} text={text} padding={0}></Tts>
          <View style={style.pagination}>
            {page !== min_page && (
              <Button
                style={style.modalButton}
                mode="contained"
                buttonColor={theme.colors.primary}
                labelStyle={{ marginHorizontal: theme.spacing.lg, marginVertical: theme.spacing.sm }}
                onPress={() => setPage(page - 1)}
              >
                <Text style={style.modalButtonText}>Previous</Text>
              </Button>
            )}
            <Button
              style={style.modalButton}
              mode="contained"
              buttonColor={theme.colors.primary}
              labelStyle={{ marginHorizontal: theme.spacing.lg, marginVertical: theme.spacing.sm }}
              onPress={() => {
                if (page === max_page) {
                  close();
                } else {
                  setPage(page + 1);
                }
              }}
            >
              <Text style={style.modalButtonText}>{page === max_page ? "Back" : "Next Page"}</Text>
            </Button>
          </View>
        </>
      ) : (
        <>
          <Text style={style.descText}>Do you want to view the introduction?</Text>
          <View style={style.pagination}>
            <Button
              style={style.modalButton}
              mode="contained"
              buttonColor={theme.colors.primary}
              labelStyle={{ marginHorizontal: theme.spacing.lg, marginVertical: theme.spacing.sm }}
              onPress={() => setAgree(true)}
            >
              <Text style={style.modalButtonText}>Yes, learn more</Text>
            </Button>
            <Button
              style={style.modalButton}
              mode="contained"
              buttonColor={theme.colors.error}
              labelStyle={{ marginHorizontal: theme.spacing.lg, marginVertical: theme.spacing.sm }}
              onPress={() => {
                close();
              }}
            >
              <Text style={style.modalButtonText}>No, not now</Text>
            </Button>
          </View>
        </>
      )}
    </View>
  );
}

const useStyle = (theme: AppTheme) =>
  StyleSheet.create({
    modalContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      margin: theme.spacing.md,
      backgroundColor: "white",
    },
    modalText: {
      textAlign: "center",
      marginBottom: 24,
      fontWeight: "bold",
      fontSize: 26,
    },
    descText: {
      textAlign: "left",
      lineHeight: 20,
      fontSize: 14,
    },
    modalImage: {
      resizeMode: "cover",
      width: "100%",
      marginVertical: 20,
      height: 200,
    },
    modalButton: {
      marginTop: 20,
    },
    modalButtonText: {
      color: "white",
      textAlign: "center",
    },
    pagination: {
      width: "100%",
      flexDirection: "row",
      display: "flex",
      justifyContent: "space-around",
      marginVertical: 30,
    },
  });
