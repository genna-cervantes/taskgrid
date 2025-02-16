import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "../../../server/src/trpc/router"; // Import the backend router type

export const trpc = createTRPCReact<AppRouter>();
