const CACHE_NAME = "hey-chef-v2";

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

  console.log("[sw.js] Push payload:", payload);

  const notification = payload.notification || payload.data || payload;

  const title =
    notification.title ||
    payload.data?.title ||
    "Hey Chef";

  const options = {
    body:
      notification.body ||
      payload.data?.body ||
      "You have a new reminder from Hey Chef.",
    icon:
      notification.icon ||
      payload.data?.icon ||
      "/icon-192.png",
    badge: "/icon-192.png",
    data: {
      url:
        notification.url ||
        notification.click_action ||
        payload.data?.url ||
        "/?page=reminders",
    },
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetPath =
    event.notification.data?.url || "/?page=reminders";

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