import {
  View,
  Text,
  Pressable,
  Modal,
  StyleSheet,
} from "react-native";
import { Feather } from "@expo/vector-icons";

const QUICK_EMOJI = ["😀", "👍", "✅", "❤️", "👀", "🎉"];

interface MessageActionSheetProps {
  visible: boolean;
  onClose: () => void;
  onReaction: (emoji: string) => void;
  onReply: () => void;
  onForward: () => void;
  onCopyLink: () => void;
  messageDate: number;
}

export function MessageActionSheet({
  visible,
  onClose,
  onReaction,
  onReply,
  onForward,
  onCopyLink,
  messageDate,
}: MessageActionSheetProps) {
  const formattedDate = new Date(messageDate).toLocaleString([], {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.sheet} onStartShouldSetResponder={() => true}>
          {/* Quick emoji row */}
          <View style={styles.emojiRow}>
            {QUICK_EMOJI.map((emoji) => (
              <Pressable
                key={emoji}
                style={styles.emojiBtn}
                onPress={() => {
                  onReaction(emoji);
                  onClose();
                }}
              >
                <Text style={styles.emojiText}>{emoji}</Text>
              </Pressable>
            ))}
          </View>

          {/* Action buttons row */}
          <View style={styles.actionsRow}>
            <Pressable
              style={styles.actionBtn}
              onPress={() => {
                onReply();
                onClose();
              }}
            >
              <View style={styles.actionIconWrap}>
                <Feather name="message-circle" size={20} color="#fff" />
              </View>
              <Text style={styles.actionLabel}>Reply</Text>
            </Pressable>

            <Pressable
              style={styles.actionBtn}
              onPress={() => {
                onForward();
                onClose();
              }}
            >
              <View style={styles.actionIconWrap}>
                <Feather name="corner-up-right" size={20} color="#fff" />
              </View>
              <Text style={styles.actionLabel}>Forward</Text>
            </Pressable>

            <Pressable
              style={styles.actionBtn}
              onPress={() => {
                onCopyLink();
                onClose();
              }}
            >
              <View style={styles.actionIconWrap}>
                <Feather name="link" size={20} color="#fff" />
              </View>
              <Text style={styles.actionLabel}>Copy Link</Text>
            </Pressable>
          </View>

          {/* List actions */}
          <View style={styles.listActions}>
            <View style={styles.listItem}>
              <Feather name="info" size={18} color="#999" />
              <Text style={styles.listLabel}>Sent {formattedDate}</Text>
            </View>
          </View>

          {/* Cancel */}
          <Pressable style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#1c1c1e",
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    paddingTop: 12,
    paddingBottom: 34,
  },
  emojiRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#333",
  },
  emojiBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#2c2c2e",
    alignItems: "center",
    justifyContent: "center",
  },
  emojiText: {
    fontSize: 22,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#333",
  },
  actionBtn: {
    alignItems: "center",
    gap: 6,
    minWidth: 70,
  },
  actionIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#2c2c2e",
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: {
    fontSize: 12,
    color: "#999",
  },
  listActions: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#333",
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
  },
  listLabel: {
    fontSize: 15,
    color: "#ccc",
  },
  cancelBtn: {
    alignItems: "center",
    paddingVertical: 14,
  },
  cancelText: {
    fontSize: 16,
    color: "#0a7ea4",
    fontWeight: "600",
  },
});
