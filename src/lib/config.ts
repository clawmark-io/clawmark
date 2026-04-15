const AUTH_URL_DEV = "http://localhost:3000";
const AUTH_URL_PROD = "https://clawmark.io";

export const config = {
  authUrl:
    import.meta.env.VITE_AUTH_URL ||
    (import.meta.env.DEV ? AUTH_URL_DEV : AUTH_URL_PROD),
} as const;
