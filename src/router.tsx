import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import Dashboard from './components/Dashboard';
import History from './components/History';
import PianoRollFalling from './components/PianoRoll';
import PrivateRoute from './components/PrivateRoute';
import Signin from './components/Signin';
import Signup from './components/Signup';

export const router = createBrowserRouter([
  { path: '/', element: <App /> },
  { path: '/signup', element: <Signup /> },
  { path: '/signin', element: <Signin /> },
  {
    path: '/dashboard',
    element: (
      <PrivateRoute>
        <Dashboard />
      </PrivateRoute>
    ),
  },
  {
    path: '/uploads',
    element: (
      <PrivateRoute>
        <History />
      </PrivateRoute>
    ),
  },
  {
    path: '/uploads/:uploadId',
    element: (
      <PrivateRoute>
        <PianoRollFalling />
      </PrivateRoute>
    ),
  },
]);
