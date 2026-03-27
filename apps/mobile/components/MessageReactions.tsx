import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  ScrollView,
  StyleSheet,
} from "react-native";
import type { ReactionGroup } from "@/hooks/useReactions";

const EMOJI_CATEGORIES: { label: string; emoji: string[] }[] = [
  {
    label: "Popular",
    emoji: [
      "👍", "👎", "😂", "❤️", "🎉", "🙌", "👀", "🔥",
      "💯", "✅", "❌", "🤔", "😍", "🚀", "👏", "💪",
      "😢", "😮", "🙏", "💡", "⭐", "🫡", "👋", "➕",
    ],
  },
  {
    label: "Smileys",
    emoji: [
      "😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂",
      "🙂", "😊", "😇", "🥰", "😍", "🤩", "😘", "😗",
      "😚", "😙", "🥲", "😋", "😛", "😜", "🤪", "😝",
      "🤑", "🤗", "🤭", "🫢", "🫣", "🤫", "🤨", "😐",
      "😑", "😶", "🫥", "😏", "😒", "🙄", "😬", "🤥",
      "😌", "😔", "😪", "🤤", "😴", "😷", "🤒", "🤕",
      "🤢", "🤮", "🥵", "🥶", "🥴", "😵", "🤯", "🤠",
      "🥳", "🥸", "😎", "🤓", "🧐", "😕", "🫤", "😟",
      "🙁", "☹️", "😮", "😯", "😲", "😳", "🥺", "🥹",
      "😦", "😧", "😨", "😰", "😥", "😢", "😭", "😱",
      "😖", "😣", "😞", "😓", "😩", "😫", "🥱", "😤",
      "😡", "😠", "🤬", "😈", "👿", "💀", "☠️", "💩",
    ],
  },
  {
    label: "Gestures",
    emoji: [
      "👋", "🤚", "🖐️", "✋", "🖖", "🫱", "🫲", "🫳",
      "🫴", "👌", "🤌", "🤏", "✌️", "🤞", "🫰", "🤟",
      "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️",
      "🫵", "👍", "👎", "✊", "👊", "🤛", "🤜", "👏",
      "🙌", "🫶", "👐", "🤲", "🤝", "🙏", "💪", "🦾",
    ],
  },
  {
    label: "Hearts",
    emoji: [
      "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍",
      "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖",
      "💘", "💝", "❤️‍🔥", "❤️‍🩹", "💟", "♥️",
    ],
  },
  {
    label: "Objects",
    emoji: [
      "🔥", "⭐", "🌟", "✨", "⚡", "💥", "🎉", "🎊",
      "🏆", "🥇", "🥈", "🥉", "🎯", "🎪", "🎨", "🎬",
      "🎵", "🎶", "🔔", "📣", "💬", "💭", "🗯️", "💤",
      "💡", "🔑", "🗝️", "🔒", "🔓", "📌", "📎", "🔗",
      "📝", "✏️", "📊", "📈", "📉", "🗓️", "⏰", "⏳",
    ],
  },
  {
    label: "Symbols",
    emoji: [
      "✅", "❌", "❓", "❗", "‼️", "⁉️", "💯", "🔴",
      "🟠", "🟡", "🟢", "🔵", "🟣", "⚫", "⚪", "🟤",
      "➕", "➖", "✖️", "➗", "♻️", "🔄", "🔃", "▶️",
      "⏸️", "⏹️", "⏺️", "⏭️", "⏮️", "🔀", "🔁", "🔂",
    ],
  },
];

interface MessageReactionsProps {
  reactions: ReactionGroup[];
  onToggle: (emoji: string) => void;
  currentUserId?: string;
}

export function MessageReactions({
  reactions,
  onToggle,
  currentUserId,
}: MessageReactionsProps) {
  const [pickerVisible, setPickerVisible] = useState(false);

  if (reactions.length === 0) return null;

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pillRow}
      >
        {reactions.map((r) => {
          const isActive = currentUserId
            ? r.userIds.includes(currentUserId)
            : false;
          return (
            <Pressable
              key={r.emoji}
              style={[styles.pill, isActive && styles.pillActive]}
              onPress={() => onToggle(r.emoji)}
            >
              <Text style={styles.pillEmoji}>{r.emoji}</Text>
              <Text style={[styles.pillCount, isActive && styles.pillCountActive]}>
                {r.count}
              </Text>
            </Pressable>
          );
        })}
        <Pressable
          style={styles.addButton}
          onPress={() => setPickerVisible(true)}
        >
          <Text style={styles.addButtonText}>+</Text>
        </Pressable>
      </ScrollView>

      <EmojiPickerModal
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onSelect={(emoji) => {
          onToggle(emoji);
          setPickerVisible(false);
        }}
      />
    </View>
  );
}

export function EmojiPickerModal({
  visible,
  onClose,
  onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (emoji: string) => void;
}) {
  const [activeCategory, setActiveCategory] = useState(0);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <View style={styles.pickerContainer} onStartShouldSetResponder={() => true}>
          {/* Category tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryTabs}
          >
            {EMOJI_CATEGORIES.map((cat, idx) => (
              <Pressable
                key={cat.label}
                style={[
                  styles.categoryTab,
                  idx === activeCategory && styles.categoryTabActive,
                ]}
                onPress={() => setActiveCategory(idx)}
              >
                <Text
                  style={[
                    styles.categoryLabel,
                    idx === activeCategory && styles.categoryLabelActive,
                  ]}
                >
                  {cat.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Emoji grid */}
          <View style={styles.emojiGrid}>
            {EMOJI_CATEGORIES[activeCategory].emoji.map((emoji) => (
              <Pressable
                key={emoji}
                style={styles.emojiButton}
                onPress={() => onSelect(emoji)}
              >
                <Text style={styles.emojiText}>{emoji}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 4,
  },
  pillRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#222",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
    borderWidth: 1,
    borderColor: "transparent",
  },
  pillActive: {
    borderColor: "#0a7ea4",
  },
  pillEmoji: {
    fontSize: 14,
  },
  pillCount: {
    fontSize: 12,
    color: "#ccc",
  },
  pillCountActive: {
    color: "#0a7ea4",
  },
  addButton: {
    width: 28,
    height: 28,
    borderRadius: 999,
    backgroundColor: "#222",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#333",
  },
  addButtonText: {
    fontSize: 14,
    color: "#888",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  pickerContainer: {
    backgroundColor: "#1c1c1e",
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    paddingTop: 8,
    paddingBottom: 34,
    maxHeight: 400,
  },
  categoryTabs: {
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 12,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#333",
  },
  categoryTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  categoryTabActive: {
    backgroundColor: "#333",
  },
  categoryLabel: {
    fontSize: 13,
    color: "#888",
  },
  categoryLabelActive: {
    color: "#fff",
    fontWeight: "600",
  },
  emojiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    gap: 2,
    padding: 12,
  },
  emojiButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  emojiText: {
    fontSize: 24,
  },
});
