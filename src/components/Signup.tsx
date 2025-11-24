import type { ChangeEvent, FormEvent } from 'react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserAuth } from '../context/AuthContext';

const Signup = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const { session, signUpNewUser } = UserAuth();
  const navigate = useNavigate();

  const handleSignUp = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signUpNewUser({ email, password });
      if (result.success) {
        navigate('/dashboard');
      } else if (result.error) {
        setError(`An error occurred during signup: ${result.error.message}`);
      }
    } catch (err) {
      setError('An unexpected error occurred during signup');
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
    <div className='max-w-md m-auto pt-24'>
      <h1>Welcome to Songscription.</h1>
      <form
        onSubmit={handleSignUp}
        className='m-auto pt-12'
      >
        <h2 className='font-bold pb-2'>Sign up today!</h2>
        <p>
          Already have an account? <Link to='/signin'>Sign in!</Link>
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
            {loading ? 'Signing up...' : 'Sign up'}
          </button>
          {error && <p className='text-red-600 text-center pt-4'>{error}</p>}
        </div>
      </form>
    </div>
  );
};

export default Signup;
