"use client";

import { use, useCallback, useEffect, useMemo } from "react";
import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { MessageList, type Message } from "@/components/channel/MessageList";
import { AlertBanner } from "@/components/proactive/AlertBanner";
import { useTopBar } from "@/hooks/useTopBar";
import { useChannelTyping } from "@/hooks/useTyping";
import { useThreadPanel } from "@/hooks/useThreadPanel";
import { useReactions } from "@/hooks/useReactions";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

interface Props {
  params: Promise<{ channelId: string }>;
}

export default function ChannelPage({ params }: Props) {
  const { channelId } = use(params);
  const typedChannelId = channelId as Id<"channels">;

  const { isAuthenticated } = useConvexAuth();
  const channel = useQuery(api.channels.get, isAuthenticated ? { channelId: typedChannelId } : "skip");
  const isMember = channel?.isMember ?? false;
  const results = useQuery(
    api.messages.listByChannel,
    isAuthenticated ? { channelId: typedChannelId } : "skip",
  );
  const joinChannel = useMutation(api.channels.join);
  const sendMessage = useMutation(api.messages.send);
  const editMessage = useMutation(api.messages.edit);
  const deleteMessage = useMutation(api.messages.remove);
  const markRead = useMutation(api.channels.markRead);
  const memberCount = useQuery(api.channels.memberCount, isAuthenticated ? { channelId: typedChannelId } : "skip");
  const alerts = useQuery(api.proactiveAlerts.listPending, isAuthenticated ? {} : "skip");
  const dismissAlert = useMutation(api.proactiveAlerts.dismiss);
  const { typingUsers, onTyping, onSendClear } = useChannelTyping(typedChannelId, isMember);
  const { openThreadPanel, closeThreadPanel } = useThreadPanel();
  const currentUser = useQuery(api.users.getMe, isAuthenticated ? {} : "skip");

  const { setSubtitle } = useTopBar();

  useEffect(() => {
    if (!isAuthenticated || !isMember) return;
    markRead({ channelId: typedChannelId });
  }, [isAuthenticated, isMember, markRead, typedChannelId]);

  // Close thread panel when navigating to a different channel
  useEffect(() => {
    closeThreadPanel();
  }, [channelId, closeThreadPanel]);

  // Inject member count into TopBar
  useEffect(() => {
    if (memberCount !== undefined) {
      setSubtitle(
        <span className="rounded bg-surface-3 px-1.5 py-px text-2xs text-muted-foreground">
          {memberCount} member{memberCount !== 1 ? "s" : ""}
        </span>,
      );
    }
    return () => setSubtitle(null);
  }, [memberCount, setSubtitle]);

  const messages: Message[] = useMemo(() => {
    if (!results) return [];
    return [...results].reverse().map((msg) => ({
      id: msg._id,
      type: msg.type === "bot" ? ("bot" as const) : ("user" as const),
      authorId: msg.authorId,
      author: msg.author?.name ?? "Unknown",
      authorInitials: getInitials(msg.author?.name ?? "?"),
      content: msg.body,
      timestamp: new Date(msg._creationTime),
      citations: msg.citations?.map((c) => ({
        type: "message" as const,
        label: c.sourceTitle ?? c.text,
        url: c.sourceUrl,
      })),
      botName: msg.type === "bot" ? "KnowledgeBot" : undefined,
      threadReplyCount: msg.threadReplyCount,
      threadLastReplyAt: msg.threadLastReplyAt,
      threadParticipants: msg.threadParticipants,
      threadId: msg.threadId,
      alsoSentToChannel: msg.alsoSentToChannel,
      isEdited: msg.isEdited,
    }));
  }, [results]);

  const messageIds = useMemo(
    () => messages.map((m) => m.id as Id<"messages">),
    [messages],
  );
  const { reactionsByMessage, toggleReaction } = useReactions({
    messageIds,
    enabled: isAuthenticated,
  });

  const handleSend = (content: string) => {
    sendMessage({ channelId: typedChannelId, body: content });
    onSendClear();
  };

  const handleEditMessage = useCallback((messageId: string, newBody: string) => {
    editMessage({ messageId: messageId as Id<"messages">, body: newBody });
  }, [editMessage]);

  const handleDeleteMessage = useCallback((messageId: string) => {
    deleteMessage({ messageId: messageId as Id<"messages"> });
  }, [deleteMessage]);

  const handleOpenThread = useCallback(
    (messageId: string) => {
      openThreadPanel({
        parentMessageId: messageId,
        messageTable: "messages",
        channelId,
        contextName: channel?.name ?? channelId,
      });
    },
    [openThreadPanel, channelId, channel?.name],
  );

  const handleJoinChannel = useCallback(() => {
    joinChannel({ channelId: typedChannelId });
  }, [joinChannel, typedChannelId]);

  const firstAlert = alerts?.[0];

  return (
    <div className="relative flex h-full flex-col">
      <MessageList
        channelName={channel?.name ?? channelId}
        messages={messages}
        onSend={isMember ? handleSend : undefined}
        isLoading={results === undefined}
        typingUsers={typingUsers}
        onTyping={isMember ? onTyping : undefined}
        onOpenThread={handleOpenThread}
        onToggleReaction={isMember ? toggleReaction : undefined}
        currentUserId={currentUser?._id}
        reactionsByMessage={reactionsByMessage}
        onEditMessage={isMember ? handleEditMessage : undefined}
        onDeleteMessage={isMember ? handleDeleteMessage : undefined}
      />

      {!isMember && channel && (
        <div className="border-t border-subtle bg-surface-1 px-6 py-4">
          <div className="flex items-center justify-center gap-3">
            <span className="text-sm text-muted-foreground">
              You&apos;re previewing <span className="font-medium text-foreground">#{channel.name}</span>
            </span>
            <button
              onClick={handleJoinChannel}
              className="rounded-md bg-ping-purple px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-ping-purple/90"
            >
              Join Channel
            </button>
          </div>
        </div>
      )}

      {firstAlert && (
        <AlertBanner
          title={firstAlert.title}
          description={firstAlert.body}
          actions={[
            { label: firstAlert.suggestedAction, primary: true },
          ]}
          onDismiss={() => dismissAlert({ alertId: firstAlert._id })}
        />
      )}
    </div>
  );
}
