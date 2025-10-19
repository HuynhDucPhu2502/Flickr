// components/PhotoCarousel.tsx
import React, { useMemo, useRef, useState } from "react";
import {
  View,
  Image,
  FlatList,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  ViewToken,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { width: SCREEN_W } = Dimensions.get("window");

export const PhotoCarousel: React.FC<{
  // Mảng URL ảnh cần hiển thị theo thứ tự ưu tiên
  uris: string[];
  // Chiều cao khung ảnh; mặc định 400
  height?: number;
  // Bật/tắt chấm chỉ số
  showIndicators?: boolean;
  // Có hiển thị nút next/prev không
  showArrows?: boolean;
  // Callback khi đổi index
  onIndexChange?: (idx: number) => void;
}> = ({
  uris,
  height = 400,
  showIndicators = true,
  showArrows = true,
  onIndexChange,
}) => {
  // ===== Trạng thái index ảnh đang xem
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList<string>>(null);

  // ===== Cấu hình viewability để bắt sự kiện ảnh đang hiển thị
  const viewabilityConfig = useMemo(
    () => ({ viewAreaCoveragePercentThreshold: 60 }),
    []
  );

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (!viewableItems?.length) return;
      const first = viewableItems[0];
      const i = first.index ?? 0;
      setIndex(i);
      onIndexChange?.(i);
    }
  ).current;

  // ===== Hàm điều hướng ảnh kế trước / kế tiếp
  const go = (dir: "prev" | "next") => {
    if (!uris?.length) return;
    const next =
      dir === "next"
        ? Math.min(index + 1, uris.length - 1)
        : Math.max(index - 1, 0);
    if (next === index) return;
    listRef.current?.scrollToIndex({ index: next, animated: true });
  };

  if (!uris?.length) {
    return (
      <View style={[styles.empty, { height }]}>
        <Ionicons name="image-outline" size={24} color="#aaa" />
      </View>
    );
  }

  return (
    <View style={{ height }}>
      {/* Danh sách ảnh cuộn ngang, paging từng trang */}
      <FlatList
        ref={listRef}
        data={uris}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(u, i) => `${i}-${u}`}
        renderItem={({ item }) => (
          <Image
            source={{ uri: item }}
            style={{ width: SCREEN_W, height, resizeMode: "cover" }}
          />
        )}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />

      {/* Nút prev/next (tuỳ chọn) */}
      {showArrows && uris.length > 1 && (
        <>
          {/* Prev */}
          <TouchableOpacity
            onPress={() => go("prev")}
            style={[styles.arrowBtn, { left: 10 }]}
            activeOpacity={0.8}
          >
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
          {/* Next */}
          <TouchableOpacity
            onPress={() => go("next")}
            style={[styles.arrowBtn, { right: 10 }]}
            activeOpacity={0.8}
          >
            <Ionicons name="chevron-forward" size={22} color="#fff" />
          </TouchableOpacity>
        </>
      )}

      {/* Chấm chỉ số (tuỳ chọn) */}
      {showIndicators && uris.length > 1 && (
        <View style={styles.dotsWrap} pointerEvents="none">
          {uris.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === index && styles.dotActive]}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  dotsWrap: {
    position: "absolute",
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.45)",
  },
  dotActive: {
    backgroundColor: "#fff",
    width: 8,
    height: 8,
  },
  arrowBtn: {
    position: "absolute",
    top: "45%",
    backgroundColor: "rgba(0,0,0,0.35)",
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  empty: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f2f2f2",
  },
});
