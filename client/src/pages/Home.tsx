import React from 'react'
import { trpc } from '../utils/trpc';

const Home = () => {
const { data, isLoading } = trpc.hello.useQuery({ name: "Genna" });

  if (isLoading) {
    return <p>Loading...</p>;
  }

  return <p>{data}</p>; 
}

export default Home