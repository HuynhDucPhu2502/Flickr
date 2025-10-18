import { StyleSheet, Text, View } from "react-native";
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import SwipeFeedScreen from "./swipe-feed-screen";
import CandidateDetailsScreen from "./candidate-details-screen";

export type HomeStackParamList = {
  SwipeFeed: undefined;
  CandidateDetails: { uid: string };
};

const Stack = createNativeStackNavigator<HomeStackParamList>();

const HomeScreen = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SwipeFeed" component={SwipeFeedScreen} />
      <Stack.Screen
        name="CandidateDetails"
        component={CandidateDetailsScreen}
      />
    </Stack.Navigator>
  );
};

export default HomeScreen;
