import { createContext, useContext } from "react";
import { feathers, Application, Paginated } from "@feathersjs/feathers";
import fio from "@feathersjs/socketio-client";
import socketio from "socket.io-client";

export { Paginated };

let connected = false;
/** Split "https://host/app" into the origin and the path the API lives under.
 * socket.io must be given the origin plus a `path` - a path in the URL itself
 * would be read as a socket.io namespace. (RN's URL polyfill has no `pathname`.) */
function splitBaseURL(baseURL: string) {
  const match = baseURL.match(/^(https?:\/\/[^/?#]+)(\/[^?#]*)?/i);
  return { origin: match?.[1] ?? baseURL, basePath: (match?.[2] ?? "").replace(/\/+$/, "") };
}

function createClient(baseURL?: string) {
  const base = (baseURL || "").replace(/\/+$/, "");
  // e.g. https://xr-archaeology-server-production.up.railway.app/app/api
  const apiURL = base + "/api";
  const { origin, basePath } = splitBaseURL(base);

  const prefix = process.env.EXPO_PUBLIC_PREFIX || "";

  const socket = socketio(origin, {
    path: `${basePath}${prefix}/api/socket.io`,
    transports: ["websocket"],
    forceNew: true,
  });
  socket.on("connect", function () {
    console.log("Socket connected");
    connected = true;
  });

  socket.on("reconnect", function () {
    console.log("Socket reconnected");
  });
  socket.on("disconnect", function () {
    console.log("Socket disconnects");
    connected = false;
  });
  socket.on("connect_error", (err) => {
    console.warn("Server disconnect");
  });
  // Set up Socket.io client with the socket. Timeout as 3 minutes
  let app: Application = feathers().configure(fio(socket, { timeout: 1800000 }));

  app.post = async function (url: string, data: any, params: any) {
    // authentication with token in header
    return fetch(`${apiURL}/${url}`, {
      method: "POST",
      body: data,
      ...params,
    });
  };

  app.on("login", (authRes) => {});
  app.on("logout", (args) => {});

  app.apiURL = apiURL;

  console.log("Feathers-Client using url:", apiURL);

  return app;
}

interface Props {
  children: React.ReactNode;
  baseURL?: string;
}

const FeathersContext = createContext<Application | null>(null);
export const FeathersProvider = ({ children, baseURL }: Props) => {
  const feathers = createClient(baseURL ?? process.env.EXPO_PUBLIC_API_URL);
  return <FeathersContext.Provider value={feathers}>{children}</FeathersContext.Provider>;
};

export const useFeathers = () => {
  const feathers = useContext(FeathersContext);
  if (!feathers) throw new Error("useFeathers must be used inside FeathersProvider");
  return feathers;
};
