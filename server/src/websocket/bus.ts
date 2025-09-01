import { EventEmitter } from "events";
import { io } from "../server/server.js";
export const bus = new EventEmitter();

bus.on("notify:user", ({ username, payload }) => {
  io.to(`user_${username}`).emit("notification", payload);
});