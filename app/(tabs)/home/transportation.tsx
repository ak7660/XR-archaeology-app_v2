import { AppBar, MainBody, NAVBAR_HEIGHT, IconBtn } from "@/components";
import { SimpleTable } from "@/components/common/table";
import { AppTheme, useAppTheme } from "@/providers/style_provider";
import { useTranslation } from "@/hooks/useTranslation";
import { ScrollView, StyleSheet } from "react-native";
import { Text, DataTable } from "react-native-paper";
export default function Page() {
  const { theme } = useAppTheme();
  const { t } = useTranslation();
  const style = useStyle({ theme });

  const stops_data = [
    { location: "39.9207157, 44.8178250", description: "First Stop in Urtsadzor" },
    { location: "39.9166300, 44.8185781", description: "Second Stop" },
    { location: "39.9186985, 44.8236505", description: "Longest Stop" },
    { location: "39.9212477, 44.7497449", description: "Dashtakar Stop" },
    { location: "39.9142266, 44.7232688", description: "Vedi Stop" },
  ];


  return (
    <MainBody padding={{ top: 0 }}>
      <AppBar title={t("home.transportation")} showBack />
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: NAVBAR_HEIGHT + theme.spacing.md }}>
        <Text style={style.text}>Bus schedule from Urtsadzor to Yerevan: </Text>
        <SimpleTable heading={['From Urtsadzor', 'From Yerevan']} data={[
          ['7:30', '10:30'], ['12:30', '15:40'], ['17:00', '19:00']
        ]}></SimpleTable>

        <Text style={style.text}> {"\n\n"} Bus Stops: </Text>
        <DataTable>
          <DataTable.Header>
            <DataTable.Title>Description</DataTable.Title>
            <DataTable.Title numeric>Location</DataTable.Title>
          </DataTable.Header>
          {stops_data.map((schedule, index) => (
            <DataTable.Row key={index}>
              <DataTable.Cell>{schedule.description}</DataTable.Cell>
              <DataTable.Cell numeric>
                {" "}
                <IconBtn icon="location" iconProps={{ fill: theme.colors.text }} onPress={() => {}} />
              </DataTable.Cell>
            </DataTable.Row>
          ))}
        </DataTable>
      </ScrollView>
    </MainBody>
  );
}

const useStyle = ({ theme }: { theme: AppTheme }) =>
  StyleSheet.create({
    container: {
      flexDirection: "column",
      display: "flex",
      alignItems: "center",
      bottom: 20,
      width: "100%",
      position: "absolute",
    },
    image: {
      resizeMode: "contain",
      width: "100%",
      height: 200,
    },
    text: {
      lineHeight: 20,
      paddingHorizontal: theme.spacing.md,
    },
  });
