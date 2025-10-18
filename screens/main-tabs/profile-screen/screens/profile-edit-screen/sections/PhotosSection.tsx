import React from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { Section } from "../components/Section";
import { PhotoItem } from "../components/PhotoItem";
import { TEXT_MUTE } from "../components/theme";
import type { PhotoDoc } from "../components/types";

export const PhotosSection: React.FC<{
  loading: boolean;
  photos: PhotoDoc[];
  mainPhoto?: PhotoDoc;
  onAddPhoto: () => void;
  onDeletePhoto: (p: PhotoDoc) => void;
  onMakeMainPhoto: (p: PhotoDoc) => void;
}> = ({
  loading,
  photos,
  mainPhoto,
  onAddPhoto,
  onDeletePhoto,
  onMakeMainPhoto,
}) => {
  return (
    <Section>
      <Text style={styles.title}>Photos</Text>
      <Text style={styles.subText}>
        The main photo is how you appear to others on the swipe view.
      </Text>

      {loading ? (
        <View style={{ paddingVertical: 24, alignItems: "center" }}>
          <ActivityIndicator />
        </View>
      ) : (
        <View style={styles.photoGrid}>
          <PhotoItem
            uri={mainPhoto?.url}
            big
            label={mainPhoto ? "Main" : undefined}
            onAdd={onAddPhoto}
            onDelete={mainPhoto ? () => onDeletePhoto(mainPhoto) : undefined}
          />
          {Array.from({ length: 3 }).map((_, i) => {
            const p = photos.filter((x) => !x.isMain)[i];
            return (
              <PhotoItem
                key={i}
                uri={p?.url}
                onAdd={onAddPhoto}
                onDelete={p ? () => onDeletePhoto(p) : undefined}
                onMakeMain={p ? () => onMakeMainPhoto(p) : undefined}
              />
            );
          })}
        </View>
      )}
    </Section>
  );
};

const styles = StyleSheet.create({
  title: { fontWeight: "800", fontSize: 16, color: "#2B2B3D" },
  subText: { color: TEXT_MUTE, marginTop: 6 },
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: 12,
    rowGap: 12,
    marginTop: 12,
  },
});
