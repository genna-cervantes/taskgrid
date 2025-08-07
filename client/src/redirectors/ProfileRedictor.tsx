import LoadingModal from '@/components/LoadingModal';
import { useUserContext } from '@/contexts/UserContext';
import { Navigate } from 'react-router-dom';

const ProfileRedictor = () => {
  const { isLoading, username } = useUserContext();
  
    if (isLoading) return <LoadingModal />;
  
    if (username) {
      return <Navigate to={`/profile/${username}`} replace />;
    }
  
    // Optional fallback if no workspace found
    return <Navigate to={`/404`} replace />;
}

export default ProfileRedictor