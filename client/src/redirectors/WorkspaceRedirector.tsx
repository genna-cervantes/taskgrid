import LoadingModal from '@/components/LoadingModal';
import { useUserContext } from '@/contexts/UserContext';
import { Navigate } from 'react-router-dom';

const WorkspaceRedirector = () => {
  const { isLoading, currentWorkspace } = useUserContext();

  if (isLoading) return <LoadingModal />;

  if (currentWorkspace) {
    return <Navigate to={`/workspaces/${currentWorkspace}`} replace />;
  }

  // Optional fallback if no workspace found
  return <Navigate to={`/404`} replace />;
};

export default WorkspaceRedirector