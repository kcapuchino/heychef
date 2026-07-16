const CACHE_NAME = "hey-chef-v5s";

const APP_SHELL = [
  "/",
  "/offline",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-maskable-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );

  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      caches
        .keys()
        .then((keys) =>
          Promise.all(
            keys
              .filter((key) => key !== CACHE_NAME)
              .map((key) => caches.delete(key))
          )
        ),
      self.clients.claim(),
    ])
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match("/offline"))
    );

    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request)
  .then((networkResponse) => {
    if (!networkResponse || networkResponse.status !== 200) {
      return networkResponse;
    }

    if (request.method === "GET") {
      const responseToCache = networkResponse.clone();

      caches.open(CACHE_NAME).then((cache) => {
        cache.put(request, responseToCache);
      });
    }

    return networkResponse;
  })
  .catch(() => {
    return caches.match(request);
  });
    })
  );
});

self.addEventListener("push", (event) => {
  console.log("[sw.js] Push event received");

  let payload = {};

  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = {
      body: event.data ? event.data.text() : "",
    };
  }

  const notification = payload.notification || payload;

 console.log("[sw.js] About to show notification", {
  title: notification.title || "Hey Chef",
  body: notification.body || "You have a reminder.",
});

event.waitUntil(
  self.registration
    .showNotification(notification.title || "Hey Chef", {
      body:
        notification.body ||
        "You have a reminder.",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: {
        url:
          notification.data?.url ||
          payload.data?.url ||
          "/reminders",
      },
    })
    .then(() => {
      console.log("[sw.js] Notification shown");
    })
    .catch((error) => {
      console.error(
        "[sw.js] showNotification failed:",
        error
      );
    })
);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetPath =
  event.notification.data?.url || "/reminders";

  const targetUrl = new URL(
    targetPath,
    self.location.origin
  ).href;

  event.waitUntil(
    self.clients
      .matchAll({
        type: "window",
        includeUncontrolled: true,
      })
      .then(async (windowClients) => {
        for (const client of windowClients) {
          if (
            client.url.startsWith(self.location.origin) &&
            "focus" in client
          ) {
            if ("navigate" in client) {
              await client.navigate(targetUrl);
            }

            return client.focus();
          }
        }

        return self.clients.openWindow(targetUrl);
      })
  );
});