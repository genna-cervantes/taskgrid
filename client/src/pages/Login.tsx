import { signInWithGoogle } from '@/lib/auth'

const Login = () => {
  return (
    <div>
        <h1>Login</h1>
        <button onClick={signInWithGoogle}>Login with Google</button>
    </div>
  )
}

export default Login