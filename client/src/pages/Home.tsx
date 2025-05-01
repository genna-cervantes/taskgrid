import React from 'react'
import { trpc } from '../utils/trpc';

const Home = () => {
// const { data, isLoading } = trpc.hello.useQuery({ name: "Genna" });
const { data, isLoading } = trpc.getTasks.useQuery({ id: "8b18ffb3-6c8d-4799-bcc3-379e9ffb38df" });
console.log(data)

  return <p>hello world</p>; 
}

export default Home