import { trpc } from "./utils/trpc";

function App() {
  const { data, isLoading } = trpc.hello.useQuery({ name: "Genna" });

  if (isLoading) {
    return <p>Loading...</p>;
  }

  return <p>Hello {data?.message}</p>; // Ensure you're accessing `data.message`
}

export default App;
