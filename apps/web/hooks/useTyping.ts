import { useCallback, useRef } from "react";
import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import type { TypingUser } from "@/components/channel/MessageList";

const THROTTLE_MS = 3000;

/** Typing indicator for channel messages. Pass enabled=false to suppress write mutations (e.g. for non-members previewing a channel). */
export function useChannelTyping(channelId: Id<"channels">, enabled = true) {
  const { isAuthenticated } = useConvexAuth();
  const typingUsers =
    useQuery(
      api.typing.getTypingUsers,
      isAuthenticated ? { channelId } : "skip",
    ) ?? [];

  const setTyping = useMutation(api.typing.setTyping);
  const clearTyping = useMutation(api.typing.clearTyping);
  const lastFired = useRef(0);

  const onTyping = useCallback(() => {
    if (!enabled) return;
    const now = Date.now();
    if (now - lastFired.current < THROTTLE_MS) return;
    lastFired.current = now;
    setTyping({ channelId });
  }, [setTyping, channelId, enabled]);

  const onSendClear = useCallback(() => {
    if (!enabled) return;
    lastFired.current = 0;
    clearTyping({ channelId });
  }, [clearTyping, channelId, enabled]);

  return { typingUsers: typingUsers as TypingUser[], onTyping, onSendClear };
}

/** Typing indicator for DM conversations. */
export function useDMTyping(conversationId: Id<"directConversations">) {
  const typingUsers =
    useQuery(api.typing.getTypingUsersDM, { conversationId }) ?? [];

  const setTyping = useMutation(api.typing.setTypingDM);
  const clearTyping = useMutation(api.typing.clearTypingDM);
  const lastFired = useRef(0);

  const onTyping = useCallback(() => {
    const now = Date.now();
    if (now - lastFired.current < THROTTLE_MS) return;
    lastFired.current = now;
    setTyping({ conversationId });
  }, [setTyping, conversationId]);

  const onSendClear = useCallback(() => {
    lastFired.current = 0;
    clearTyping({ conversationId });
  }, [clearTyping, conversationId]);

  return { typingUsers: typingUsers as TypingUser[], onTyping, onSendClear };
}
