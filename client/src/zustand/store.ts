import { create } from "zustand";
import { Task } from "../../../server/src/shared/types";

interface ProjectDetailsState {
  // state
  name: string;
  description: string | null;
  privacy: "private" | "public";
  plan: "basic" | "pro";
  isLoading: boolean;
}

interface ProjectDetailsActions {
  // actions
  setName: (name: string) => void;
  setDescription: (description: string | null) => void;
  setPrivacy: (privacy: "private" | "public") => void;
  setPlan: (plan: "basic" | "pro") => void;
  setLoading: (isLoading: boolean) => void;
  setProjectDetails: (details: {
    name: string;
    description: string | null;
    privacy: "private" | "public";
    plan: "basic" | "pro";
  }) => void;
  resetStore: () => void;
}

type ProjectDetailsStore = ProjectDetailsState & ProjectDetailsActions;

const initialState = {
  name: "",
  description: null,
  privacy: "private" as const,
  plan: "basic" as const,
  isLoading: false,
};

export const useProjectDetailsStore = create<ProjectDetailsStore>((set) => ({
  // state
  ...initialState,

  // actions
  setName: (name: string) => set({ name }),
  setDescription: (description: string | null) => set({ description }),
  setPrivacy: (privacy: "private" | "public") => set({ privacy }),
  setPlan: (plan: "basic" | "pro") => set({ plan }),
  setLoading: (isLoading: boolean) => set({ isLoading }),
  setProjectDetails: (details: {
    name: string;
    description: string | null;
    privacy: "private" | "public";
    plan: "basic" | "pro";
  }) =>
    set({
      name: details.name,
      description: details.description,
      privacy: details.privacy,
      plan: details.plan,
      isLoading: false,
    }),
  resetStore: () => set(initialState),
}));

// USERS IN PROJECT STORE
const initialUsersInProjectState = {
  usersInProject: [],
};

type UsersInProjectStore = {
  usersInProject: { username: string }[];
  setUsersInProject: (usersInProject: { username: string }[]) => void;
};

export const useUsersInProjectStore = create<UsersInProjectStore>((set) => ({
  ...initialUsersInProjectState,

  setUsersInProject: (usersInProject: { username: string }[]) =>
    set({ usersInProject }),
}));

// TASK CATEGORY OPTIONS STORE
const initialTaskCategoryOptionsState = {
  taskCategoryOptions: [],
};

type TaskCategoryOptionsStore = {
  taskCategoryOptions: {
    category: string;
    color: string;
  }[];
  setTaskCategoryOptions: (
    taskCategoryOptions: {
      category: string;
      color: string;
    }[]
  ) => void;
};

export const useTaskCategoryOptionsStore = create<TaskCategoryOptionsStore>(
  (set) => ({
    ...initialTaskCategoryOptionsState,

    setTaskCategoryOptions: (
      taskCategoryOptions: {
        category: string;
        color: string;
      }[]
    ) => set({ taskCategoryOptions }),
  })
);

// TASKS STORE
const initialTasksState = {
    tasks: []
}

type TasksStore = {
    tasks: Task[];
    setTasks: (tasks: Task[]) => void;
}

export const useTasksStore = create<TasksStore>((set) => ({
    ...initialTasksState,

    setTasks: (tasks: Task[]) => set({ tasks }),
}))