import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { RNInput } from "./RNInput";
import { PrimaryButton } from "./PrimaryButton";

type DetailSheetProps = {
  visible: boolean;
  title: string;
  onClose: () => void;
  onSave: (form: Record<string, any>) => Promise<void> | void;
  initial?: Record<string, any>;
  fields?: Array<{ key: string; label: string; placeholder?: string }>;
  renderBody?: (
    state: Record<string, any>,
    setState: React.Dispatch<any>
  ) => React.ReactNode;
  saveLabel?: string;
  disableBackdropClose?: boolean;
};

export const DetailSheet: React.FC<DetailSheetProps> = ({
  visible,
  title,
  onClose,
  onSave,
  initial = {},
  fields,
  renderBody,
  saveLabel = "Save",
  disableBackdropClose = false,
}) => {
  const [state, setState] = useState<Record<string, any>>(initial);
  const [saving, setSaving] = useState(false);

  // Reset form mỗi khi mở lại hoặc initial thay đổi
  useEffect(() => {
    if (visible) setState(initial);
  }, [visible]);

  const handleSave = async () => {
    if (saving) return;
    try {
      setSaving(true);
      await onSave(state);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <Pressable
        style={styles.sheetBackdrop}
        onPress={!disableBackdropClose ? onClose : undefined}
      />

      {/* Sheet */}
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: "padding", android: undefined })}
        style={styles.sheet}
      >
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>{title}</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={22} color="#333" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.sheetScroll}
          contentContainerStyle={styles.sheetBody}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {renderBody
            ? renderBody(state, setState)
            : fields?.map((f) => (
                <RNInput
                  key={f.key}
                  placeholder={f.placeholder || f.label}
                  value={(state[f.key] as string) ?? ""}
                  onChangeText={(t) => setState((s) => ({ ...s, [f.key]: t }))}
                />
              ))}

          <View style={{ height: 12 }} />

          <PrimaryButton
            title={saving ? "Saving..." : saveLabel}
            onPress={handleSave}
            style={{ opacity: saving ? 0.7 : 1 }}
          />
          {saving ? (
            <View style={{ marginTop: 10, alignItems: "center" }}>
              <ActivityIndicator />
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  sheetBackdrop: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    maxHeight: "80%",
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#eee",
  },
  sheetTitle: { fontSize: 16, fontWeight: "700" },
  sheetScroll: { flex: 1 },
  sheetBody: { paddingHorizontal: 14, paddingBottom: 14, paddingTop: 10 },
});

export default DetailSheet;
