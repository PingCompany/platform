import { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { AttachmentPreview } from "./AttachmentPreview";
import { Feather } from "@expo/vector-icons";

interface Attachment {
  storageId: string;
  filename: string;
  mimeType: string;
  size: number;
}

interface CollapsibleAttachmentsProps {
  attachments: Attachment[];
}

const VISIBLE_LIMIT = 3;

export function CollapsibleAttachments({
  attachments,
}: CollapsibleAttachmentsProps) {
  const [expanded, setExpanded] = useState(false);

  if (!attachments || attachments.length === 0) return null;

  const isCollapsible = attachments.length > VISIBLE_LIMIT;
  const visible = expanded ? attachments : attachments.slice(0, VISIBLE_LIMIT);
  const hiddenCount = attachments.length - VISIBLE_LIMIT;

  return (
    <View style={styles.container}>
      {visible.map((att, idx) => (
        <AttachmentPreview
          key={att.storageId || idx}
          storageId={att.storageId}
          filename={att.filename}
          mimeType={att.mimeType}
          size={att.size}
        />
      ))}
      {isCollapsible && (
        <Pressable
          style={styles.toggleBtn}
          onPress={() => setExpanded(!expanded)}
        >
          <Feather
            name={expanded ? "chevron-up" : "chevron-down"}
            size={14}
            color="#0a7ea4"
          />
          <Text style={styles.toggleText}>
            {expanded ? "Show less" : `Show ${hiddenCount} more`}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    gap: 4,
  },
  toggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
  },
  toggleText: {
    fontSize: 13,
    color: "#0a7ea4",
  },
});
