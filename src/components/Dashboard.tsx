import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserAuth } from '../context/AuthContext';
import Navbar from './Navbar';
import FileUpload from './Upload';

const Dashboard: React.FC = () => {
  const { session } = UserAuth();
  const navigate = useNavigate();

  return (
    <>
      <Navbar />
      <div className='relative min-h-screen'>
        {/* Welcome text - centered in the middle of screen */}
        <div className='flex flex-col items-center justify-center min-h-screen'>
          <div className='text-center -mt-20 space-y-8'>
            <h1 className='text-2xl'>Welcome, {session?.user?.email}</h1>
            <FileUpload />
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
