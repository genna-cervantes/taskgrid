import { parse } from 'node-html-parser';
import { insertSyncNotification } from '../db/queries/notifications.js';
import { pool } from '../trpc/router.js';
import { bus } from '../websocket/bus.js';

type Success<T> = {
  data: T;
  error: null;
};

type Failure<E> = {
  data: null;
  error: E;
};

type Result<T, E = Error> = Success<T> | Failure<E>;

// Main wrapper function
export async function tryCatch<T, E = Error>(
  promise: Promise<T>,
): Promise<Result<T, E>> {
  try {
    const data = await promise;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as E };
  }
}

export const getDataIdFromComment = (htmlString: string) => {
  const root = parse(htmlString);
  const mentions = root.querySelectorAll('span.mention[data-label]');
  
  let recipients: string[] = [];
  mentions.forEach((mention) => {
    const username = mention.getAttribute('data-label');
  
    if (username) recipients.push(username);
  })

  return recipients
};

export const toSnakeCase = (str: string) => str.replace(/([A-Z])/g, '_$1').toLowerCase();

export const handleSyncNotification = async (type: string, taskId: string, projectId: string, recipient: {recipient: string[]}, context: any) => {
  console.log('handling sync notif')

  insertSyncNotification(pool, type, taskId, projectId, recipient, context);
  console.log('inserted to db')

  // emit event
  console.log(`sending to recipients ${recipient.recipient}`)
  console.log(recipient)
  recipient.recipient.forEach((r) => {
    console.log(`notifying user ${r}`)
    bus.emit("notify:user", {username: r, payload: context})
  })
}