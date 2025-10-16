import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { Text, View } from "react-native";
import { TabParamList } from "../../../types/navigation";

type Props = BottomTabScreenProps<TabParamList, "Home">;

export const HomeScreen = ({}: Props) => {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text>Home</Text>
    </View>
  );
};
