import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import PropTypes from 'prop-types';

export default function ProtectedRoute({ children }) {
  const { currentUser, loading } = useAuth();
  
  console.log('ProtectedRoute - currentUser:', currentUser);
  console.log('ProtectedRoute - loading:', loading);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!currentUser) {
    console.log('ProtectedRoute - redirecting to login');
    return <Navigate to="/login" />;
  }

  console.log('ProtectedRoute - rendering children');
  return children;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired
}; 