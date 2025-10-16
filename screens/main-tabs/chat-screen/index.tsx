import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { Text, View } from "react-native";
import { TabParamList } from "../../../types/navigation";

type Props = BottomTabScreenProps<TabParamList, "Chat">;

export const ChatScreen = ({}: Props) => {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text>Chat</Text>
    </View>
  );
};
