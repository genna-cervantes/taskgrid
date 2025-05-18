import { trpc } from "./utils/trpc";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { ActionProvider } from "./contexts/ActionContext";
import {
  RecentTaskProvider,
} from "./contexts/RecentTaskContext";
import { UserProvider } from "./contexts/UserContext";

const queryClient = new QueryClient();
export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: import.meta.env.VITE_ENVIRONMENT === 'dev' ? import.meta.env.VITE_TRPC_DEV_URL : import.meta.env.VITE_TRPC_PROD_URL, // Backend API URL
    }),
  ]
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <RecentTaskProvider>
          <ActionProvider>
            <App />
          </ActionProvider>
        </RecentTaskProvider>
      </UserProvider>
    </QueryClientProvider>
  </trpc.Provider>
);
