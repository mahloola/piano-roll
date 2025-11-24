import React from 'react';
import { UserAuth } from '../context/AuthContext';
import Navbar from './Navbar';
import FileUpload from './Upload';

const Dashboard: React.FC = () => {
  const { session } = UserAuth();

  return (
    <>
      <Navbar />
      <div className='relative min-h-screen'>
        <div className='flex flex-col items-center justify-center min-h-screen'>
          <div className='text-center -mt-20 space-y-8 px-4 sm:px-6 sm: text-1xl w-full '>
            <h1 className='text-lg sm:text-xl md:text-2xl break-words whitespace-normal overflow-hidden max-w-full'>
              Welcome, {session?.user?.email}
            </h1>
            <FileUpload />
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
