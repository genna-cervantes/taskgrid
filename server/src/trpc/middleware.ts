import { TRPCError } from "@trpc/server";
import { middleware } from "./trpc.js";

const rateLimitMap = new Map<string, { count: number; lastRequest: number }>();
const RATE_LIMIT = 50; // max requests
const TIME_WINDOW = 10 * 1000; // 10 seconds

export const rateLimitMiddleware = middleware(({ctx, next}) => {
    const ip = ctx.req.headers["x-forwarded-for"] ?? ctx.req.socket.remoteAddress ?? "unknown";

    const now = Date.now()
    const entry = rateLimitMap.get(ip as string) ?? {count: 0, lastRequest: now};

    if (now - entry.lastRequest > TIME_WINDOW){
        entry.count = 1;
        entry.lastRequest = now;
    }else{
        entry.count += 1;
    }

    rateLimitMap.set(ip as string, entry);

    if (entry.count > RATE_LIMIT){
        throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Rate limit exceeded" });
    }

    return next()

})