import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: "http://localhost:3000/api/auth", 
});

export async function signInWithGoogle() {
  const res = await authClient.signIn.social({
    provider: "google",
    callbackURL: "http://localhost:5173/", // Redirect after login
    fetchOptions: {
        credentials: "include", // allow cookies to pass
    },
  });

  console.log(res)

  // Optional: handle any errors
  if (res.error) {
    console.error(res.error);
  }
}

export const {
  signOut,
  useSession
} = authClient;