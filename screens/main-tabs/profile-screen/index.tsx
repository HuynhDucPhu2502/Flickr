import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ProfileStackParamList, TabParamList } from "../../../types/navigation";
import ProfileHomeScreen from "./screens/profile-home-screen";
import { ProfileEditScreen } from "./screens/profile-edit-screen";
import { SubscriptionScreen } from "./screens/subscription-screen";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";

type Props = BottomTabScreenProps<TabParamList, "Profile">;

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export const ProfileScreen = () => {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName="ProfileHome"
    >
      <Stack.Screen name="ProfileHome" component={ProfileHomeScreen} />
      <Stack.Screen name="ProfileEdit" component={ProfileEditScreen} />
      <Stack.Screen name="Subscription" component={SubscriptionScreen} />
    </Stack.Navigator>
  );
};
