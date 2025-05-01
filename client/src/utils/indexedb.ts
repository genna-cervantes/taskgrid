import { openDB } from "idb";

const initDB = async () => {
  return await openDB("my-db", 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("userName")) {
        db.createObjectStore("userName"); // projectId will be the key
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
