import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { Feather } from "@expo/vector-icons";

interface CodeBlockProps {
  code: string;
  language?: string;
}

const COLLAPSE_THRESHOLD = 10;

export function CodeBlock({ code, language }: CodeBlockProps) {
  const lines = code.split("\n");
  const isLong = lines.length > COLLAPSE_THRESHOLD;
  const [expanded, setExpanded] = useState(!isLong);
  const [copied, setCopied] = useState(false);

  const displayCode = expanded ? code : lines.slice(0, COLLAPSE_THRESHOLD).join("\n");

  const handleCopy = async () => {
    await Clipboard.setStringAsync(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.language}>{language || "code"}</Text>
        <Pressable onPress={handleCopy} hitSlop={8}>
          <Feather
            name={copied ? "check" : "copy"}
            size={14}
            color={copied ? "#4ade80" : "#666"}
          />
        </Pressable>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Text style={styles.code} selectable>
          {displayCode}
        </Text>
      </ScrollView>
      {isLong && (
        <Pressable
          style={styles.toggleBtn}
          onPress={() => setExpanded(!expanded)}
        >
          <Text style={styles.toggleText}>
            {expanded
              ? "Hide"
              : `Show ${lines.length - COLLAPSE_THRESHOLD} more lines`}
          </Text>
          <Feather
            name={expanded ? "chevron-up" : "chevron-down"}
            size={14}
            color="#0a7ea4"
          />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#1a1a2e",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    marginVertical: 6,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  language: {
    fontSize: 11,
    fontFamily: "monospace",
    color: "rgba(255,255,255,0.3)",
  },
  code: {
    fontFamily: "monospace",
    fontSize: 13,
    color: "#e0e0e0",
    lineHeight: 20,
    padding: 12,
  },
  toggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  toggleText: {
    fontSize: 12,
    color: "#0a7ea4",
  },
});
