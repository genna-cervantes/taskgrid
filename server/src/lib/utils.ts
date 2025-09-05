import { parse } from 'node-html-parser';
import { insertNotification, insertSyncNotification, updateSentAt } from '../db/queries/notifications.js';
import { updateRead } from '../db/queries/notifications.js';
import { pool } from '../db/db.js';
import { bus } from '../websocket/bus.js';
import { auth } from './auth.js';
import { Request } from 'express';

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
  // Safety check for htmlString
  if (!htmlString || typeof htmlString !== 'string') {
    console.error('getDataIdFromComment: htmlString is undefined, null, or not a string');
    return [];
  }
  
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
  const title = '🔔 You were mentioned in a discussion!';
  
  // Safety check for context.comment
  if (!context.comment) {
    console.error('handleSyncNotification: context.comment is undefined or null');
    return;
  }
  
  const root = parse(context.comment);
  const message = root.text.trim();
  
  let resultNotif = await tryCatch(insertNotification(pool, type, projectId, recipient, title, message));
  if (resultNotif.error != null) {
    console.error(resultNotif.error)
    return
  }
  await tryCatch(updateSentAt(pool, resultNotif.data));
  
  // emit event
  recipient.recipient.forEach((r) => {
    bus.emit("notify:user", {username: r, payload: {context: {title, message}}})
  })
}

export const createAsyncNotificationTemplate = (type: string, context: any, linkedTask: string) => {
  let template: {
    context: any;
    type: string;
    linkedTaskId: string;
  } = {
    context: null,  
    type: '',   
    linkedTaskId: '',
  }

  switch (type) {
    case 'update_progress': 
      template.type = type;
      template.context = context;
      template.linkedTaskId = linkedTask;
      break;
    case 'update_discussion':
      template.type = type;
      template.context = context;
      template.linkedTaskId = linkedTask;
      break;
    default:
      template.type = type;
      template.context = context;
      template.linkedTaskId = linkedTask;
      break;
  }
  return template;
}

export const groupBy = (array: any[], key: string) => {
  return array.reduce((acc, item) => {
    const groupKey = item[key];
    if (!acc[groupKey]) {
      acc[groupKey] = [];
    }
    acc[groupKey].push(item);
    return acc;
  }, {}) as Record<string, any[]>;
}

export const getUserLocalHour = (utcHour: number, timezone: string) => {
  try {
    const now = new Date()
    now.setUTCHours(utcHour, 0, 0, 0)
    
    // Convert to user's timezone
    const userTime = new Date(now.toLocaleString("en-US", {timeZone: timezone}))
    return userTime.getHours()
  } catch (error) {
    console.error(`Invalid timezone: ${timezone}`)
    return -1 // Invalid timezone
  }
}