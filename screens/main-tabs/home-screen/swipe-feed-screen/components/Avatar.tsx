import React from "react";
import { Image } from "react-native";

export const Avatar: React.FC<{ uri?: string | null; size?: number }> = ({
  uri,
  size = 72,
}) => (
  <Image
    source={{ uri: uri || "https://i.pravatar.cc/150" }}
    style={{ width: size, height: size, borderRadius: 16 }}
  />
);
