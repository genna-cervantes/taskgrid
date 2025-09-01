import cron from "node-cron";
import { getAllNotSentYetAsyncNotifications, insertNotification, updateSentAt } from "../db/queries/notifications.js";
import { pool } from "../trpc/router.js";
import { createAsyncNotificationTemplate, getUserLocalHour, groupBy, tryCatch } from "./utils.js";
import { bus } from "../websocket/bus.js";
import { generateDailyStarterNotificationMessage } from "../trpc/routers/chat.js";
import { ModelMessage } from "ai";
import { getUsersAndTimezonesInProject } from "../db/queries/users.js";

// note all daily starters are sent to everyone
export const sendDailyStarterNotificationCron = () => {
    // Run every hour to check if it's morning time for any timezone
    cron.schedule('0 * * * *', async () => {
      const currentHour = new Date().getUTCHours()
      
      const result = await tryCatch(getAllNotSentYetAsyncNotifications(pool))
      if (result.error != null) {
        console.error(result.error)
        return
      }
  
      const toSend = result.data
      
      // Get all users with their timezones for the projects that have notifications
      const projectIds = [...new Set(toSend.map(n => n.projectId))]
      const usersResults = await Promise.all(projectIds.map(async (projectId) => {
        const usersResult = await tryCatch(getUsersAndTimezonesInProject(pool, projectId))
        if (usersResult.error != null) {
          console.error(usersResult.error)
          return
        }
        return usersResult.data
      }))
      
      // Flatten and filter out null values
      const users = usersResults.flat().filter((u) => u != null)
      
      // Filter users who should receive notifications at this hour (their morning time)
      const usersToNotify = users.filter(user => {
        const userLocalHour = getUserLocalHour(currentHour, user.timezone)
        // Send at 8 AM local time (adjust as needed)
        return userLocalHour === 8
      })
      
      if (usersToNotify.length === 0) {
        return // No users to notify at this hour
      }
      
      // Get project IDs that have users to notify
      const projectIdsToNotify = [...new Set(usersToNotify.map(u => u.projectId))]
      
      // Filter notifications for projects that have users to notify
      const notificationsToProcess = toSend.filter(n => 
        projectIdsToNotify.includes(n.projectId)
      )
      
      // Group notifications by project
      const groupedNotifsByProject = groupBy(notificationsToProcess, 'projectId')
      
      // Process each project
      const processProjectPromises = Object.keys(groupedNotifsByProject).map(async (projectId) => {
        const projectNotifications = groupedNotifsByProject[projectId]
        
        // Check if this project has users to notify at this hour
        const projectUsersToNotify = usersToNotify.filter(u => u.projectId === projectId)
        if (projectUsersToNotify.length === 0) {
          return
        }
        
        // Create templates from notifications
        const templatePromises = projectNotifications.map(async (n) => {
          const template = createAsyncNotificationTemplate(n.type, n.context, n.taskId)
          return template
        })
        
        const templates = (await Promise.all(templatePromises)).filter(Boolean)
        
        if (templates.length === 0) {
          return
        }
        
        // Generate AI message
        const notifCollectionMessage: ModelMessage = {
          role: 'system',
          content: `The following are the notifications for the project ${projectId}. Use them to generate a daily starter notification message. ${templates.map(t => JSON.stringify(t)).join('\n')}`
        }
        
        const message = await generateDailyStarterNotificationMessage({
          messages: [notifCollectionMessage]
        })

        const result = await tryCatch(insertNotification(pool, 'daily_starter', projectId, {recipient: projectUsersToNotify.map(u => u.username)}, message.title, message.message))
        if (result.error != null) {
          console.error(result.error)
          return
        }

        // Mark as sent
        const resultSentAt = await tryCatch(updateSentAt(pool, result.data))
        if (resultSentAt.error != null) {
          console.error(resultSentAt.error)
          return
        }
        
        // Send to users in this project who should receive notifications at this hour
        const sendPromises = projectUsersToNotify.map(async (user) => {
          bus.emit('notify:user', {
            username: user.username, 
            payload: message
          })
        })
        
        await Promise.all(sendPromises)
      })
      
      await Promise.all(processProjectPromises)
    })
  }