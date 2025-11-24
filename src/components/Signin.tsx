import type { ChangeEvent, FormEvent } from 'react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserAuth } from '../context/AuthContext';

const Signin = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const { signInUser } = UserAuth();
  const navigate = useNavigate();

  const handleSignIn = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signInUser({ email, password });
      if (result.success) {
        navigate('/dashboard');
      } else if (result.error) {
        setError(`An error occurred during sign in: ${result.error.message}`);
      }
    } catch (err) {
      setError('An unexpected error occurred during sign in');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setEmail(e.target.value);
  };

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setPassword(e.target.value);
  };

  return (
    <div className='max-w-md m-auto pt-24 px-4 sm:px-6 w-full'>
      <h1>Welcome back.</h1>
      <form
        onSubmit={handleSignIn}
        className='m-auto pt-12'
      >
        <h2 className='font-bold pb-2'>Sign in</h2>
        <p>
          Don't have an account? <Link to='/signup'>Sign up!</Link>
        </p>
        <div className='flex flex-col py-4'>
          <input
            className='p-3 mt-8'
            onChange={handleEmailChange}
            placeholder='Email'
            type='email'
            value={email}
            required
          />
          <input
            className='p-3 mt-8'
            onChange={handlePasswordChange}
            placeholder='Password'
            type='password'
            value={password}
            required
          />
          <button
            type='submit'
            disabled={loading}
            className='mt-8 w-full'
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
          {error && <p className='text-red-600 text-center pt-4'>{error}</p>}
        </div>
      </form>
    </div>
  );
};

export default Signin;
