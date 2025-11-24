import { Link } from 'react-router-dom';
import { UserAuth } from '../context/AuthContext';

const Navbar = () => {
  const { session, signOut } = UserAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <nav className='border-gray-500'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between items-center pt-4'>
          <div className='flex items-center space-x-16'>
            <Link to='/'>Home</Link>

            {session && <Link to='/uploads'>Uploads</Link>}
          </div>

          <div className='flex items-center space-x-4'>
            {session ? (
              <button onClick={handleSignOut}>Sign Out</button>
            ) : (
              <>
                <Link to='/signin'>Sign In</Link>
                <Link to='/signup'>Sign Up</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
