import { useState, useMemo } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import {
  MessageReactions,
  EmojiPickerModal,
} from "@/components/MessageReactions";
import { ThreadIndicator } from "@/components/ThreadIndicator";
import { CodeBlock } from "@/components/CodeBlock";
import type { ReactionGroup } from "@/hooks/useReactions";

interface MessageBubbleProps {
  authorName: string;
  body: string;
  timestamp: number;
  isOwn?: boolean;
  type?: "user" | "bot" | "system" | "integration";
  messageId?: string;
  reactions?: ReactionGroup[];
  onToggleReaction?: (emoji: string) => void;
  currentUserId?: string;
  onLongPress?: () => void;
  threadReplyCount?: number;
  threadLastReplyAuthor?: string;
  onThreadPress?: () => void;
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// Parse message body into segments: text and code blocks
interface TextSegment {
  type: "text";
  content: string;
}
interface CodeSegment {
  type: "code";
  language?: string;
  content: string;
}
type Segment = TextSegment | CodeSegment;

function parseBody(body: string): Segment[] {
  const segments: Segment[] = [];
  const codeBlockRegex = /```(\w*)\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(body)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: "text", content: body.slice(lastIndex, match.index) });
    }
    segments.push({
      type: "code",
      language: match[1] || undefined,
      content: match[2].replace(/\n$/, ""),
    });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < body.length) {
    segments.push({ type: "text", content: body.slice(lastIndex) });
  }

  return segments;
}

// Render inline code within text
function renderInlineText(text: string) {
  const parts = text.split(/(`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <Text key={i} style={styles.inlineCode}>
          {part.slice(1, -1)}
        </Text>
      );
    }
    return part;
  });
}

export function MessageBubble({
  authorName,
  body,
  timestamp,
  isOwn = false,
  type = "user",
  reactions,
  onToggleReaction,
  currentUserId,
  onLongPress,
  threadReplyCount,
  threadLastReplyAuthor,
  onThreadPress,
}: MessageBubbleProps) {
  const [pickerVisible, setPickerVisible] = useState(false);

  const segments = useMemo(() => parseBody(body), [body]);

  const handleLongPress = () => {
    if (onLongPress) {
      onLongPress();
    } else if (onToggleReaction) {
      setPickerVisible(true);
    }
  };

  if (type === "system") {
    return (
      <View style={styles.systemContainer}>
        <Text style={styles.systemText}>{body}</Text>
      </View>
    );
  }

  const hasReactions = reactions && reactions.length > 0 && onToggleReaction;
  const hasThread = threadReplyCount != null && threadReplyCount > 0 && onThreadPress;

  return (
    <Pressable onLongPress={handleLongPress}>
      <View style={[styles.container, isOwn && styles.ownContainer]}>
        <View style={styles.header}>
          <Text style={[styles.author, type === "bot" && styles.botAuthor]}>
            {authorName}
            {type === "bot" ? " (bot)" : ""}
          </Text>
          <Text style={styles.time}>{formatTime(timestamp)}</Text>
        </View>
        <View>
          {segments.map((seg, i) =>
            seg.type === "code" ? (
              <CodeBlock key={i} code={seg.content} language={seg.language} />
            ) : (
              <Text key={i} style={styles.body}>
                {renderInlineText(seg.content)}
              </Text>
            ),
          )}
        </View>
        {hasReactions && (
          <MessageReactions
            reactions={reactions}
            onToggle={onToggleReaction}
            currentUserId={currentUserId}
          />
        )}
        {hasThread && (
          <ThreadIndicator
            replyCount={threadReplyCount}
            lastReplyAuthor={threadLastReplyAuthor}
            onPress={onThreadPress}
          />
        )}
      </View>
      {onToggleReaction && (
        <EmojiPickerModal
          visible={pickerVisible}
          onClose={() => setPickerVisible(false)}
          onSelect={(emoji) => {
            onToggleReaction(emoji);
            setPickerVisible(false);
          }}
        />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  ownContainer: {},
  header: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 2,
    gap: 8,
  },
  author: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
  botAuthor: {
    color: "#0a7ea4",
  },
  time: {
    fontSize: 12,
    color: "#666",
  },
  body: {
    fontSize: 15,
    color: "#e0e0e0",
    lineHeight: 22,
  },
  inlineCode: {
    fontFamily: "monospace",
    fontSize: 13,
    backgroundColor: "rgba(255,255,255,0.08)",
    color: "#f0abfc",
    borderRadius: 3,
    paddingHorizontal: 4,
  },
  systemContainer: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    alignItems: "center",
  },
  systemText: {
    fontSize: 13,
    color: "#666",
    fontStyle: "italic",
  },
});
