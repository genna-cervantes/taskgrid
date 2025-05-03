import { openDB } from "idb";

const initDB = async () => {
  return await openDB("my-db", 7, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("userName")) {
        db.createObjectStore("userName"); // projectId will be the key
      }
      if (!db.objectStoreNames.contains("projectIds")) {
        db.createObjectStore("projectIds"); // key = projectId, value = true
      }
    },
  });
};

export const setUsernameForProject = async (
  projectId: string,
  username: string
) => {
  const db = await initDB();
  await db.put("userName", username, projectId); // key = projectId
};

export const getUsernameForProject = async (projectId: string) => {
  const db = await initDB();
  return await db.get("userName", projectId);
};

export const getAllProjects = async (): Promise<{ id: string; name: string }[]> => {
  const db = await initDB();
  const keys = await db.getAllKeys("projectIds");
  const values = await db.getAll("projectIds");

  return keys.map((key, index) => ({
    id: key as string,
    name: values[index] as string,
  }));
};

export const addProjectId = async (projectId: string, projectName = "new project") => {
  const db = await initDB();
  await db.put("projectIds", projectName, projectId);
};

export const getProjectNameByKey = async (projectKey: string): Promise<string | undefined> => {
  const db = await initDB();
  const projectName = await db.get('projectIds', projectKey); // Get the record by projectKey
  
  return projectName; // Return the name of the project if found, else undefined
};