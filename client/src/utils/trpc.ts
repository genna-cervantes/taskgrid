// client/src/utils/trpc.ts
import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '../../../server/src/trpc/type';
import superjson from 'superjson'

export const trpc = createTRPCReact<AppRouter>({
    transformer: superjson,
});