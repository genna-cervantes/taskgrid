import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import Layout from "./pages/Layout";
import Home from "./pages/Home";
import Projects from "./pages/Projects";
import Contact from "./pages/Contact";
import NoPage from "./pages/NoPage";
import Project from "./pages/Project";
import TaskLayout from "./pages/TaskLayout";
import TaskPage from "./pages/TaskPage";
import WorkspaceRedirector from "./redirectors/WorkspaceRedirector";
import ProfilePage from "./pages/ProfilePage";
import Login from "./pages/Login";
import Inbox from "./pages/Inbox";
import Integrations from "./pages/Integrations";
import { TimezoneSync } from "./pages/TimezoneSync";
import { SocketNotificationsProvider } from "./contexts/NotificationContext";
import { useUserContext } from "./contexts/UserContext";

const App = () => {

  // check local storage for workspace id else they are a guest and i generate a random workspace id ??
  const {username} = useUserContext()

  return (
    <ThemeProvider>
      <BrowserRouter>
        <TimezoneSync />
        <SocketNotificationsProvider username={username}>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<WorkspaceRedirector />} />

              {/* auth */}
              <Route path="login" element={<Login />} />

              {/* defaults */}
              <Route path="workspaces" element={<WorkspaceRedirector />} />
              <Route path="workspaces/:workspaceId" element={<Home />} />

              {/* projects */}
              <Route path="workspaces/:workspaceId/projects" element={<Projects />}>
                <Route path=":projectId" element={<Project />}>
                </Route>
              </Route>

              {/* tasks */}
              <Route path="workspaces/:workspaceId/projects/:projectId/tasks" element={<TaskLayout />}>
                <Route path=":taskId" element={<TaskPage />} />
              </Route>

              {/* inbox */}
              <Route path="workspaces/:workspaceId/projects/:projectId/inbox" element={<Inbox />} />

              {/* integrations */}
              <Route path="workspaces/:workspaceId/projects/:projectId/integrations" element={<Integrations />} />

              {/* profile */}
              <Route path="profile" element={<ProfilePage />} />

              <Route path="contact" element={<Contact />} />
              <Route path="*" element={<NoPage />} />
            </Route>
          </Routes>
        </SocketNotificationsProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App