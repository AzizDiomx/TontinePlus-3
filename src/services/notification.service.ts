// src/services/notification.service.ts
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { NotificationRepository } from "../repositories";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const NotificationService = {
  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === "web") return false;
    const { status } = await Notifications.getPermissionsAsync();
    if (status === "granted") return true;
    const { status: newStatus } = await Notifications.requestPermissionsAsync();
    return newStatus === "granted";
  },

  async scheduleContributionReminder(
    memberId: string, memberName: string, groupName: string,
    amount: number, dueDate: Date, currency: string, reminderDays: number
  ): Promise<string | null> {
    const triggerDate = new Date(dueDate);
    triggerDate.setDate(triggerDate.getDate() - reminderDays);
    if (triggerDate <= new Date()) return null;

    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: "Rappel de cotisation",
          body: `${memberName} doit cotiser ${amount.toLocaleString()} ${currency} pour ${groupName} dans ${reminderDays} jour(s)`,
          data: { memberId, groupName, type: "contribution_due" },
          sound: true,
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: triggerDate },
      });
      await NotificationRepository.create({
        type: "contribution_due",
        title: "Rappel de cotisation",
        body: `Cotisation de ${amount.toLocaleString()} ${currency} pour ${groupName}`,
        data: { memberId, groupName },
        scheduledDate: triggerDate.toISOString(),
        expoNotificationId: id,
      });
      return id;
    } catch {
      return null;
    }
  },

  async scheduleOverdueReminder(
    memberId: string, memberName: string, groupName: string,
    amount: number, currency: string
  ): Promise<string | null> {
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: "Cotisation en retard",
          body: `${memberName} a une cotisation en retard de ${amount.toLocaleString()} ${currency} pour ${groupName}`,
          data: { memberId, groupName, type: "overdue_alert" },
          sound: true,
        },
        trigger: null,
      });
      return id;
    } catch {
      return null;
    }
  },

  async scheduleBeneficiaryNotification(
    memberName: string, groupName: string,
    amount: number, date: Date, currency: string
  ): Promise<string | null> {
    const triggerDate = new Date(date);
    triggerDate.setDate(triggerDate.getDate() - 1);
    if (triggerDate <= new Date()) return null;

    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: "Tour de bénéficiaire demain !",
          body: `${memberName} reçoit ${amount.toLocaleString()} ${currency} de ${groupName} demain`,
          data: { memberName, groupName, type: "beneficiary_turn" },
          sound: true,
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: triggerDate },
      });
      return id;
    } catch {
      return null;
    }
  },

  async cancelNotification(expoId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(expoId);
    } catch {}
  },

  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  },

  async sendImmediateNotification(title: string, body: string): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: true },
      trigger: null,
    });
  },
};