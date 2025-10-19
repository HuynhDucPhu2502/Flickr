import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ChatsListScreen from "./ChatsListScreen";
import ConversationScreen from "./ConversationScreen";


export type ChatStackParamList = {
  ChatsList: undefined;
  Conversation: {
    chatId: string;
    peer: { uid: string; name?: string; photoURL?: string };
  };
};

const Stack = createNativeStackNavigator<ChatStackParamList>();

const ChatScreen = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ChatsList" component={ChatsListScreen} />
      <Stack.Screen name="Conversation" component={ConversationScreen} />
    </Stack.Navigator>
  );
};

export default ChatScreen;
