// src/services/backup.service.ts
import * as FileSystem from "expo-file-system/legacy";
import { Paths } from "expo-file-system/next";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import { getDatabase } from "../database/database";
import {
  UserRepository, GroupRepository, MemberRepository,
  ContributionRepository, BeneficiaryRepository,
  MeetingRepository, SettingsRepository,
} from "../repositories";
import type { BackupData } from "../types";

const APP_VERSION = "1.0.0";

export const BackupService = {

  // ── Construit le JSON de sauvegarde ───────────────────────────────────
  async buildBackupData(): Promise<BackupData> {
    const [user, groups, settings] = await Promise.all([
      UserRepository.getFirst(),
      GroupRepository.getAll(),
      SettingsRepository.get(),
    ]);
    if (!user) throw new Error("Aucun utilisateur trouvé");

    const members: any[] = [];
    const contributions: any[] = [];
    const beneficiaries: any[] = [];
    const meetings: any[] = [];

    for (const group of groups) {
      const [gM, gC, gB, gMt] = await Promise.all([
        MemberRepository.getByGroup(group.id),
        ContributionRepository.getByGroup(group.id),
        BeneficiaryRepository.getByGroup(group.id),
        MeetingRepository.getByGroup(group.id),
      ]);
      members.push(...gM);
      contributions.push(...gC);
      beneficiaries.push(...gB.map((b) => ({ ...b, member: undefined })));
      meetings.push(...gMt);
    }

    return {
      version: APP_VERSION,
      exportedAt: new Date().toISOString(),
      user,
      groups,
      members,
      contributions,
      beneficiaries,
      meetings,
      settings: settings!,
    };
  },

  // ── Exporte vers un fichier JSON et retourne l'URI ────────────────────
  async exportToJSON(): Promise<string> {
    const data = await this.buildBackupData();
    const json = JSON.stringify(data, null, 2);
    const filename = `tontineplus_backup_${new Date().toISOString().split("T")[0]}.json`;
    const fileUri = `${Paths.document.uri}${filename}`;
    await FileSystem.writeAsStringAsync(fileUri, json, { encoding: "utf8" });
    return fileUri;
  },

  // ── Alias utilisé par les écrans ──────────────────────────────────────
  async exportBackup(): Promise<void> {
    return this.shareBackup();
  },

  // ── Partage la sauvegarde JSON ────────────────────────────────────────
  async shareBackup(): Promise<void> {
    const fileUri = await this.exportToJSON();
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: "application/json",
        dialogTitle: "Sauvegarder TontinePlus",
      });
    }
  },

  // ── Importe depuis un fichier JSON ────────────────────────────────────
  async importBackup(): Promise<boolean> {
    const result = await DocumentPicker.getDocumentAsync({
      type: "application/json",
      copyToCacheDirectory: true,
    });
    if (result.canceled) return false;

    const fileUri = result.assets[0].uri;
    const content = await FileSystem.readAsStringAsync(fileUri);

    let backupData: BackupData;
    try {
      backupData = JSON.parse(content);
    } catch {
      throw new Error("Fichier JSON invalide");
    }

    if (!backupData.version || !backupData.user || !backupData.groups) {
      throw new Error("Format de sauvegarde invalide");
    }

    // Alias pour compatibilité
    return this._restoreFromData(backupData);
  },

  // ── Ancien alias utilisé dans certains écrans ─────────────────────────
  async importFromJSON(): Promise<{ success: boolean; message: string }> {
    try {
      const ok = await this.importBackup();
      return ok
        ? { success: true, message: "Import réussi !" }
        : { success: false, message: "Import annulé" };
    } catch (e: any) {
      return { success: false, message: e.message ?? "Erreur inconnue" };
    }
  },

  // ── Restauration effective ────────────────────────────────────────────
  async _restoreFromData(backupData: BackupData): Promise<boolean> {
    const db = await getDatabase();

    await db.execAsync(`
      DELETE FROM contributions;
      DELETE FROM beneficiaries;
      DELETE FROM meetings;
      DELETE FROM members;
      DELETE FROM groups;
      DELETE FROM users;
      DELETE FROM settings;
    `);

    const u = backupData.user;
    await db.runAsync(
      `INSERT INTO users (id, name, phone, photo_uri, pin_hash, biometric_enabled, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      u.id, u.name, u.phone, u.photoUri, u.pinHash,
      u.biometricEnabled ? 1 : 0, u.createdAt, u.updatedAt
    );

    for (const g of backupData.groups) {
      await db.runAsync(
        `INSERT INTO groups (id, name, description, photo_uri, contribution_amount, currency, frequency,
          custom_frequency_days, start_date, end_date, status, selection_mode, current_cycle, total_cycles,
          meeting_day, meeting_time, notes, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        g.id, g.name, g.description, g.photoUri, g.contributionAmount,
        g.currency, g.frequency, g.customFrequencyDays, g.startDate,
        g.endDate, g.status, g.selectionMode, g.currentCycle, g.totalCycles,
        g.meetingDay, g.meetingTime, g.notes, g.createdAt, g.updatedAt
      );
    }

    for (const m of backupData.members) {
      await db.runAsync(
        `INSERT INTO members (id, group_id, name, phone, photo_uri, address, profession, notes,
          beneficiary_order, is_active, joined_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        m.id, m.groupId, m.name, m.phone, m.photoUri,
        m.address, m.profession, m.notes, m.beneficiaryOrder,
        m.isActive ? 1 : 0, m.joinedAt, m.createdAt, m.updatedAt
      );
    }

    for (const c of backupData.contributions) {
      await db.runAsync(
        `INSERT INTO contributions (id, group_id, member_id, amount, expected_amount, status, cycle,
          period_label, payment_date, due_date, notes, receipt_number, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        c.id, c.groupId, c.memberId, c.amount, c.expectedAmount,
        c.status, c.cycle, c.periodLabel, c.paymentDate, c.dueDate,
        c.notes, c.receiptNumber, c.createdAt, c.updatedAt
      );
    }

    if (backupData.settings) {
      const s = backupData.settings;
      await db.runAsync(
        `INSERT INTO settings (id, currency, language, theme_mode, biometric_enabled, auto_backup,
          auto_backup_frequency, notifications_enabled, contribution_reminder_days, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        s.id, s.currency, s.language, s.themeMode,
        s.biometricEnabled ? 1 : 0, s.autoBackup ? 1 : 0,
        s.autoBackupFrequency, s.notificationsEnabled ? 1 : 0,
        s.contributionReminderDays, s.updatedAt
      );
    }

    return true;
  },

  // ── Export CSV ─────────────────────────────────────────────────────────
  async exportCSV(groupIds: string[]): Promise<void> {
    const allContribs: any[] = [];
    const allMembers: any[]  = [];

    // Si groupIds vide, on exporte tous les groupes
    const ids = groupIds.length > 0
      ? groupIds
      : (await GroupRepository.getAll()).map((g) => g.id);

    for (const groupId of ids) {
      const [contribs, members] = await Promise.all([
        ContributionRepository.getByGroup(groupId),
        MemberRepository.getByGroup(groupId),
      ]);
      allContribs.push(...contribs);
      allMembers.push(...members);
    }

    const memberMap = new Map(allMembers.map((m) => [m.id, m.name]));

    const header = "Membre,Montant,Attendu,Statut,Cycle,Échéance,Paiement\n";
    const rows = allContribs.map((c) =>
      `"${memberMap.get(c.memberId) ?? "Inconnu"}",${c.amount},${c.expectedAmount},"${c.status}",${c.cycle},"${c.dueDate}","${c.paymentDate ?? ""}"`
    ).join("\n");

    const csv = header + rows;
    const filename = `tontineplus_export_${new Date().toISOString().split("T")[0]}.csv`;
    const fileUri = `${Paths.document.uri}${filename}`;
    await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: "utf8" });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: "text/csv",
        dialogTitle: "Exporter les cotisations",
      });
    }
  },
};