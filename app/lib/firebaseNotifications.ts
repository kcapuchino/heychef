import { getToken } from "firebase/messaging";
import { getFirebaseMessaging } from "./firebase";

export async function requestFirebaseNotificationToken() {
  if (!("Notification" in window)) {
    throw new Error(
      "Notifications are not supported in this browser."
    );
  }

  if (!("serviceWorker" in navigator)) {
    throw new Error(
      "Service workers are not supported in this browser."
    );
  }

  const permission = await Notification.requestPermission();

  console.log("Notification permission:", permission);

  if (permission !== "granted") {
    throw new Error("Notification permission was not granted.");
  }

  const messaging = await getFirebaseMessaging();

  if (!messaging) {
    throw new Error(
      "Firebase Messaging is not supported on this device."
    );
  }

  const serviceWorkerRegistration =
    await navigator.serviceWorker.ready;

  console.log("Service worker used for FCM:", {
    scope: serviceWorkerRegistration.scope,
    active:
      serviceWorkerRegistration.active?.scriptURL,
    state:
      serviceWorkerRegistration.active?.state,
  });

  const vapidKey =
    process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

  console.log("VAPID key present:", Boolean(vapidKey));
  console.log("VAPID key length:", vapidKey?.length);

  if (!vapidKey) {
    throw new Error(
      "The Firebase VAPID key is missing."
    );
  }

  const token = await getToken(messaging, {
    vapidKey,
    serviceWorkerRegistration,
  });

  if (!token) {
    throw new Error(
      "Firebase did not return a notification token."
    );
  }

  console.log("FCM token:", token);
  console.log("FCM token length:", token.length);

  return token;
}