import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { UserAuth } from '../context/AuthContext';

interface PrivateRouteProps {
  children: ReactNode;
}

const PrivateRoute = ({ children }: PrivateRouteProps) => {
  const { session } = UserAuth();

  if (session === undefined) {
    return <p>Loading...</p>;
  }

  return <>{session ? <>{children}</> : <Navigate to='/signup' />}</>;
};

export default PrivateRoute;
