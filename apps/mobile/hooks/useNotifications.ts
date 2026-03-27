import { useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import {
  requestPermissions,
  setupNotificationCategories,
} from "@/lib/notifications";

export function useNotifications() {
  const router = useRouter();
  const responseListener = useRef<Notifications.Subscription | null>(null);
  const notificationListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    (async () => {
      await requestPermissions();
      await setupNotificationCategories();
    })();

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;
        const actionId = response.actionIdentifier;

        if (actionId === "reply") {
          const userText = (response as any).userText;
          // TODO: Send reply via Convex mutation when backend supports it
          console.log("Reply from notification:", userText, data);
        }

        if (data?.channelId) {
          router.push({
            pathname: "/channel/[channelId]",
            params: { channelId: data.channelId as string },
          });
        } else if (data?.conversationId) {
          router.push({
            pathname: "/dm/[conversationId]",
            params: { conversationId: data.conversationId as string },
          });
        }
      });

    notificationListener.current =
      Notifications.addNotificationReceivedListener(() => {
        // No-op: Convex live queries already update the UI
      });

    return () => {
      responseListener.current?.remove();
      notificationListener.current?.remove();
    };
  }, [router]);
}
