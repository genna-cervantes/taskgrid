// client/src/utils/trpc.ts
import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '../../../server/src/trpc/type';

export const trpc = createTRPCReact<AppRouter>();