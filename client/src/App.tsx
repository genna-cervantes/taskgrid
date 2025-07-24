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

const App = () => {

  // check local storage for workspace id else they are a guest and i generate a random workspace id ??

  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<WorkspaceRedirector />} />

            <Route path="workspaces" element={<WorkspaceRedirector />} />
            <Route path="workspaces/:workspaceId" element={<Home />} />

            <Route path="workspaces/:workspaceId/projects" element={<Projects />}>
              <Route path=":projectId" element={<Project />}>
              </Route>
            </Route>

            <Route path="workspaces/:workspaceId/projects/:projectId/tasks" element={<TaskLayout />}>
              <Route path=":taskId" element={<TaskPage />} />
            </Route>
            <Route path="contact" element={<Contact />} />
            <Route path="*" element={<NoPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App