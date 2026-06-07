// src/repositories/index.ts
import * as SQLite from "expo-sqlite";
import { getDatabase } from "../database/database";
import {
  User,
  Group,
  Member,
  Contribution,
  Beneficiary,
  Meeting,
  AppNotification,
  Settings,
  BackupData,
  CreateUserPayload,
  CreateGroupPayload,
  CreateMemberPayload,
  CreateContributionPayload,
  RecordPaymentPayload,
  CreateMeetingPayload,
  MemberWithStats,
  GroupWithStats,
  BeneficiaryWithMember,
  DashboardStats,
} from "../types";

const generateId = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 9);

const now = () => new Date().toISOString();

// ─── User Repository ──────────────────────────────────────────────────
export const UserRepository = {
  async create(
    payload: CreateUserPayload & { pinHash: string }
  ): Promise<User> {
    const db = await getDatabase();
    const id = generateId();
    await db.runAsync(
      `INSERT INTO users (id, name, phone, photo_uri, pin_hash, biometric_enabled)
       VALUES (?, ?, ?, ?, ?, 0)`,
      id,
      payload.name,
      payload.phone,
      payload.photoUri ?? null,
      payload.pinHash
    );
    return this.getById(id) as Promise<User>;
  },

  async getFirst(): Promise<User | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<any>("SELECT * FROM users LIMIT 1");
    return row ? mapUser(row) : null;
  },

  async getById(id: string): Promise<User | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<any>(
      "SELECT * FROM users WHERE id = ?",
      id
    );
    return row ? mapUser(row) : null;
  },

  async update(id: string, data: Partial<User>): Promise<void> {
    const db = await getDatabase();
    const fields: string[] = [];
    const values: any[] = [];
    if (data.name !== undefined) {
      fields.push("name = ?");
      values.push(data.name);
    }
    if (data.phone !== undefined) {
      fields.push("phone = ?");
      values.push(data.phone);
    }
    if (data.photoUri !== undefined) {
      fields.push("photo_uri = ?");
      values.push(data.photoUri);
    }
    if (data.biometricEnabled !== undefined) {
      fields.push("biometric_enabled = ?");
      values.push(data.biometricEnabled ? 1 : 0);
    }
    if (data.pinHash !== undefined) {
      fields.push("pin_hash = ?");
      values.push(data.pinHash);
    }
    fields.push("updated_at = ?");
    values.push(now());
    values.push(id);
    await db.runAsync(
      `UPDATE users SET ${fields.join(", ")} WHERE id = ?`,
      ...values
    );
  },
};

// ─── Group Repository ─────────────────────────────────────────────────
export const GroupRepository = {
  async create(payload: CreateGroupPayload): Promise<Group> {
    const db = await getDatabase();
    const id = generateId();
    await db.runAsync(
      `INSERT INTO groups (id, name, description, photo_uri, contribution_amount, currency,
        frequency, custom_frequency_days, start_date, status, selection_mode, meeting_day, meeting_time, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?)`,
      id,
      payload.name,
      payload.description ?? "",
      payload.photoUri ?? null,
      payload.contributionAmount,
      payload.currency,
      payload.frequency,
      payload.customFrequencyDays ?? null,
      payload.startDate,
      payload.selectionMode,
      payload.meetingDay ?? null,
      payload.meetingTime ?? null,
      payload.notes ?? ""
    );
    return this.getById(id) as Promise<Group>;
  },

  async getAll(): Promise<Group[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>(
      `SELECT g.*, 
        (SELECT COUNT(*) FROM members m WHERE m.group_id = g.id AND m.is_active = 1) as member_count
       FROM groups g ORDER BY g.created_at DESC`
    );
    return rows.map(mapGroup);
  },

  async getById(id: string): Promise<Group | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<any>(
      `SELECT g.*, 
        (SELECT COUNT(*) FROM members m WHERE m.group_id = g.id AND m.is_active = 1) as member_count
       FROM groups g WHERE g.id = ?`,
      id
    );
    return row ? mapGroup(row) : null;
  },

  async getWithStats(id: string): Promise<GroupWithStats | null> {
    const db = await getDatabase();
    const group = await this.getById(id);
    if (!group) return null;

    const stats = await db.getFirstAsync<any>(
      `SELECT 
        COALESCE(SUM(CASE WHEN status = 'paid' THEN amount WHEN status = 'partial' THEN amount ELSE 0 END), 0) as total_collected
       FROM contributions WHERE group_id = ?`,
      id
    );
    const distributed = await db.getFirstAsync<any>(
      `SELECT COALESCE(SUM(amount), 0) as total_distributed FROM beneficiaries WHERE group_id = ? AND is_paid = 1`,
      id
    );
    const lateCount = await db.getFirstAsync<any>(
      `SELECT COUNT(DISTINCT member_id) as count FROM contributions WHERE group_id = ? AND status = 'unpaid'`,
      id
    );
    const nextBeneficiary = await db.getFirstAsync<any>(
      `SELECT b.*, m.name as member_name, m.phone as member_phone, m.photo_uri as member_photo
       FROM beneficiaries b JOIN members m ON b.member_id = m.id
       WHERE b.group_id = ? AND b.is_paid = 0 ORDER BY b.scheduled_date ASC LIMIT 1`,
      id
    );

    return {
      ...group,
      totalCollected: stats?.total_collected ?? 0,
      totalDistributed: distributed?.total_distributed ?? 0,
      lateMembers: lateCount?.count ?? 0,
      nextBeneficiary: nextBeneficiary
        ? ({
            id: nextBeneficiary.member_id,
            name: nextBeneficiary.member_name,
            phone: nextBeneficiary.member_phone,
            photoUri: nextBeneficiary.member_photo,
          } as Member)
        : null,
      nextPaymentDate: nextBeneficiary?.scheduled_date ?? null,
      myTotalPaid: stats?.total_collected ?? 0,
    };
  },

  async update(id: string, data: Partial<Group>): Promise<void> {
    const db = await getDatabase();
    const fields: string[] = [];
    const values: any[] = [];
    const map: Record<string, string> = {
      name: "name",
      description: "description",
      photoUri: "photo_uri",
      contributionAmount: "contribution_amount",
      frequency: "frequency",
      status: "status",
      selectionMode: "selection_mode",
      currentCycle: "current_cycle",
      totalCycles: "total_cycles",
      endDate: "end_date",
      notes: "notes",
      meetingDay: "meeting_day",
      meetingTime: "meeting_time",
    };
    for (const [key, col] of Object.entries(map)) {
      if ((data as any)[key] !== undefined) {
        fields.push(`${col} = ?`);
        values.push((data as any)[key]);
      }
    }
    fields.push("updated_at = ?");
    values.push(now());
    values.push(id);
    await db.runAsync(
      `UPDATE groups SET ${fields.join(", ")} WHERE id = ?`,
      ...values
    );
  },

  async delete(id: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync("DELETE FROM groups WHERE id = ?", id);
  },
};

// ─── Member Repository ────────────────────────────────────────────────
export const MemberRepository = {
  async create(payload: CreateMemberPayload): Promise<Member> {
    const db = await getDatabase();
    const id = generateId();
    const maxOrder = await db.getFirstAsync<{ max_order: number }>(
      "SELECT MAX(beneficiary_order) as max_order FROM members WHERE group_id = ?",
      payload.groupId
    );
    const order = payload.beneficiaryOrder ?? (maxOrder?.max_order ?? 0) + 1;
    await db.runAsync(
      `INSERT INTO members (id, group_id, name, phone, photo_uri, address, profession, notes, beneficiary_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      payload.groupId,
      payload.name,
      payload.phone ?? "",
      payload.photoUri ?? null,
      payload.address ?? "",
      payload.profession ?? "",
      payload.notes ?? "",
      order
    );
    return this.getById(id) as Promise<Member>;
  },

  async getByGroup(groupId: string): Promise<Member[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>(
      "SELECT * FROM members WHERE group_id = ? AND is_active = 1 ORDER BY beneficiary_order ASC",
      groupId
    );
    return rows.map(mapMember);
  },

  async getByGroupWithStats(
    groupId: string,
    cycle: number
  ): Promise<MemberWithStats[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>(
      `SELECT m.*,
        COALESCE(SUM(CASE WHEN c.status IN ('paid','partial') THEN c.amount ELSE 0 END), 0) as total_paid,
        COALESCE(SUM(c.expected_amount), 0) as total_due,
        MAX(CASE WHEN c.status IN ('paid','partial') THEN c.payment_date END) as last_payment_date,
        COALESCE(MAX(CASE WHEN c.cycle = ? THEN c.status ELSE NULL END), 'pending') as contribution_status,
        CASE WHEN EXISTS(SELECT 1 FROM beneficiaries b WHERE b.member_id = m.id AND b.group_id = ? AND b.is_paid = 1) THEN 1 ELSE 0 END as has_received
       FROM members m
       LEFT JOIN contributions c ON c.member_id = m.id AND c.group_id = ?
       WHERE m.group_id = ? AND m.is_active = 1
       GROUP BY m.id ORDER BY m.beneficiary_order ASC`,
      cycle,
      groupId,
      groupId,
      groupId
    );
    return rows.map((row) => ({
      ...mapMember(row),
      totalPaid: row.total_paid ?? 0,
      totalDue: row.total_due ?? 0,
      lastPaymentDate: row.last_payment_date ?? null,
      contributionStatus: row.contribution_status ?? "pending",
      hasReceivedBenefit: row.has_received === 1,
      cycle,
    }));
  },

  async getById(id: string): Promise<Member | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<any>(
      "SELECT * FROM members WHERE id = ?",
      id
    );
    return row ? mapMember(row) : null;
  },

  async update(id: string, data: Partial<Member>): Promise<void> {
    const db = await getDatabase();
    const fields: string[] = [];
    const values: any[] = [];
    const map: Record<string, string> = {
      name: "name",
      phone: "phone",
      photoUri: "photo_uri",
      address: "address",
      profession: "profession",
      notes: "notes",
      beneficiaryOrder: "beneficiary_order",
      isActive: "is_active",
    };
    for (const [key, col] of Object.entries(map)) {
      if ((data as any)[key] !== undefined) {
        const val =
          key === "isActive"
            ? (data as any)[key]
              ? 1
              : 0
            : (data as any)[key];
        fields.push(`${col} = ?`);
        values.push(val);
      }
    }
    fields.push("updated_at = ?");
    values.push(now());
    values.push(id);
    await db.runAsync(
      `UPDATE members SET ${fields.join(", ")} WHERE id = ?`,
      ...values
    );
  },

  async delete(id: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      "UPDATE members SET is_active = 0, updated_at = ? WHERE id = ?",
      now(),
      id
    );
  },

  async reorderBeneficiaries(
    groupId: string,
    orderedIds: string[]
  ): Promise<void> {
    const db = await getDatabase();
    for (let i = 0; i < orderedIds.length; i++) {
      await db.runAsync(
        "UPDATE members SET beneficiary_order = ?, updated_at = ? WHERE id = ? AND group_id = ?",
        i + 1,
        now(),
        orderedIds[i],
        groupId
      );
    }
  },
};

// ─── Contribution Repository ──────────────────────────────────────────
export const ContributionRepository = {
  async create(payload: CreateContributionPayload): Promise<Contribution> {
    const db = await getDatabase();
    const id = generateId();
    await db.runAsync(
      `INSERT INTO contributions (id, group_id, member_id, amount, expected_amount, status, cycle, period_label, due_date, notes)
       VALUES (?, ?, ?, 0, ?, 'pending', ?, ?, ?, ?)`,
      id,
      payload.groupId,
      payload.memberId,
      payload.expectedAmount,
      payload.cycle,
      payload.periodLabel,
      payload.dueDate,
      payload.notes ?? ""
    );
    return this.getById(id) as Promise<Contribution>;
  },

  async bulkCreate(payloads: CreateContributionPayload[]): Promise<void> {
    const db = await getDatabase();
    for (const payload of payloads) {
      const id = generateId();
      await db.runAsync(
        `INSERT OR IGNORE INTO contributions (id, group_id, member_id, amount, expected_amount, status, cycle, period_label, due_date, notes)
         VALUES (?, ?, ?, 0, ?, 'pending', ?, ?, ?, ?)`,
        id,
        payload.groupId,
        payload.memberId,
        payload.expectedAmount,
        payload.cycle,
        payload.periodLabel,
        payload.dueDate,
        payload.notes ?? ""
      );
    }
  },

  async recordPayment(payload: RecordPaymentPayload): Promise<void> {
    const db = await getDatabase();
    const contribution = await this.getById(payload.contributionId);
    if (!contribution) throw new Error("Contribution not found");
    const totalPaid = contribution.amount + payload.amount;
    let status: string = "partial";
    if (totalPaid >= contribution.expectedAmount) status = "paid";
    const receiptNumber = `REC-${Date.now()}`;
    await db.runAsync(
      `UPDATE contributions SET amount = ?, status = ?, payment_date = ?, receipt_number = ?, notes = ?, updated_at = ?
       WHERE id = ?`,
      totalPaid,
      status,
      payload.paymentDate,
      receiptNumber,
      payload.notes ?? contribution.notes,
      now(),
      payload.contributionId
    );
    // Mark overdue contributions in the same group as unpaid
    const paidContrib = await this.getById(payload.contributionId);
    if (paidContrib) {
      await db.runAsync(
        `UPDATE contributions SET status = 'unpaid', updated_at = ? 
         WHERE status = 'pending' AND due_date < date('now') 
         AND group_id = ? AND id != ?`,
        now(),
        paidContrib.groupId,
        payload.contributionId
      );
    }
  },

  async getByGroup(groupId: string, cycle?: number): Promise<Contribution[]> {
    const db = await getDatabase();
    const query =
      cycle !== undefined
        ? `SELECT * FROM contributions WHERE group_id = ? AND cycle = ? ORDER BY due_date ASC`
        : `SELECT * FROM contributions WHERE group_id = ? ORDER BY due_date DESC`;
    const params = cycle !== undefined ? [groupId, cycle] : [groupId];
    const rows = await db.getAllAsync<any>(query, ...params);
    return rows.map(mapContribution);
  },

  async getByMember(memberId: string): Promise<Contribution[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>(
      "SELECT * FROM contributions WHERE member_id = ? ORDER BY due_date DESC",
      memberId
    );
    return rows.map(mapContribution);
  },

  async getById(id: string): Promise<Contribution | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<any>(
      "SELECT * FROM contributions WHERE id = ?",
      id
    );
    return row ? mapContribution(row) : null;
  },

  async getOverdue(): Promise<Contribution[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>(
      `SELECT c.*, m.name as member_name, g.name as group_name
       FROM contributions c 
       JOIN members m ON c.member_id = m.id
       JOIN groups g ON c.group_id = g.id
       WHERE c.status IN ('unpaid', 'partial') AND c.due_date < date('now')
       ORDER BY c.due_date ASC`
    );
    return rows.map(mapContribution);
  },

  async markOverdueContributions(): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE contributions SET status = 'unpaid', updated_at = ? 
       WHERE status = 'pending' AND due_date < date('now')`,
      now()
    );
  },
};

// ─── Beneficiary Repository ───────────────────────────────────────────
export const BeneficiaryRepository = {
  async create(data: {
    groupId: string;
    memberId: string;
    cycle: number;
    scheduledDate: string;
    amount: number;
    notes?: string;
  }): Promise<Beneficiary> {
    const db = await getDatabase();
    const id = generateId();
    await db.runAsync(
      `INSERT INTO beneficiaries (id, group_id, member_id, cycle, scheduled_date, amount, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      id,
      data.groupId,
      data.memberId,
      data.cycle,
      data.scheduledDate,
      data.amount,
      data.notes ?? ""
    );
    return this.getById(id) as Promise<Beneficiary>;
  },

  async getByGroup(groupId: string): Promise<BeneficiaryWithMember[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>(
      `SELECT b.*, m.name as member_name, m.phone as member_phone, 
        m.photo_uri as member_photo_uri, m.address as member_address,
        m.profession as member_profession, m.notes as member_notes,
        m.beneficiary_order as member_beneficiary_order, m.is_active as member_is_active,
        m.joined_at as member_joined_at, m.created_at as member_created_at,
        m.updated_at as member_updated_at
       FROM beneficiaries b JOIN members m ON b.member_id = m.id
       WHERE b.group_id = ? ORDER BY b.cycle ASC, b.scheduled_date ASC`,
      groupId
    );
    return rows.map((row) => ({
      ...mapBeneficiary(row),
      member: {
        id: row.member_id,
        groupId: groupId,
        name: row.member_name,
        phone: row.member_phone,
        photoUri: row.member_photo_uri,
        address: row.member_address,
        profession: row.member_profession,
        notes: row.member_notes,
        beneficiaryOrder: row.member_beneficiary_order,
        isActive: row.member_is_active === 1,
        joinedAt: row.member_joined_at,
        createdAt: row.member_created_at,
        updatedAt: row.member_updated_at,
      } as Member,
    }));
  },

  async getById(id: string): Promise<Beneficiary | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<any>(
      "SELECT * FROM beneficiaries WHERE id = ?",
      id
    );
    return row ? mapBeneficiary(row) : null;
  },

  async markAsPaid(id: string, actualDate: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      "UPDATE beneficiaries SET is_paid = 1, actual_date = ?, updated_at = ? WHERE id = ?",
      actualDate,
      now(),
      id
    );
  },

  async getNext(groupId: string): Promise<BeneficiaryWithMember | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<any>(
      `SELECT b.*, m.name as member_name, m.phone as member_phone, m.photo_uri as member_photo_uri,
        m.address as member_address, m.profession as member_profession, m.notes as member_notes,
        m.beneficiary_order as member_beneficiary_order, m.is_active as member_is_active,
        m.joined_at as member_joined_at, m.created_at as member_created_at, m.updated_at as member_updated_at
       FROM beneficiaries b JOIN members m ON b.member_id = m.id
       WHERE b.group_id = ? AND b.is_paid = 0 ORDER BY b.scheduled_date ASC LIMIT 1`,
      groupId
    );
    if (!row) return null;
    return {
      ...mapBeneficiary(row),
      member: {
        id: row.member_id,
        groupId,
        name: row.member_name,
        phone: row.member_phone,
        photoUri: row.member_photo_uri,
        address: row.member_address,
        profession: row.member_profession,
        notes: row.member_notes,
        beneficiaryOrder: row.member_beneficiary_order,
        isActive: row.member_is_active === 1,
        joinedAt: row.member_joined_at,
        createdAt: row.member_created_at,
        updatedAt: row.member_updated_at,
      } as Member,
    };
  },
};

// ─── Meeting Repository ───────────────────────────────────────────────
export const MeetingRepository = {
  async create(payload: CreateMeetingPayload): Promise<Meeting> {
    const db = await getDatabase();
    const id = generateId();
    await db.runAsync(
      `INSERT INTO meetings (id, group_id, title, description, scheduled_date, location)
       VALUES (?, ?, ?, ?, ?, ?)`,
      id,
      payload.groupId,
      payload.title,
      payload.description ?? "",
      payload.scheduledDate,
      payload.location ?? ""
    );
    return this.getById(id) as Promise<Meeting>;
  },

  async getByGroup(groupId: string): Promise<Meeting[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>(
      "SELECT * FROM meetings WHERE group_id = ? ORDER BY scheduled_date DESC",
      groupId
    );
    return rows.map(mapMeeting);
  },

  async getUpcoming(limit = 10): Promise<Meeting[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>(
      `SELECT m.*, g.name as group_name FROM meetings m JOIN groups g ON m.group_id = g.id
       WHERE m.scheduled_date >= date('now') AND m.is_completed = 0
       ORDER BY m.scheduled_date ASC LIMIT ?`,
      limit
    );
    return rows.map(mapMeeting);
  },

  async getById(id: string): Promise<Meeting | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<any>(
      "SELECT * FROM meetings WHERE id = ?",
      id
    );
    return row ? mapMeeting(row) : null;
  },

  async markComplete(id: string, notes?: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      "UPDATE meetings SET is_completed = 1, notes = ?, updated_at = ? WHERE id = ?",
      notes ?? "",
      now(),
      id
    );
  },

  async delete(id: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync("DELETE FROM meetings WHERE id = ?", id);
  },
};

// ─── Settings Repository ──────────────────────────────────────────────
export const SettingsRepository = {
  async get(): Promise<Settings | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<any>("SELECT * FROM settings LIMIT 1");
    return row ? mapSettings(row) : null;
  },

  async createDefaults(): Promise<Settings> {
    const db = await getDatabase();
    const id = generateId();
    await db.runAsync(
      `INSERT INTO settings (id, currency, language, theme_mode, notifications_enabled)
       VALUES (?, 'XOF', 'fr', 'system', 1)`,
      id
    );
    return this.get() as Promise<Settings>;
  },

  async update(data: Partial<Settings>): Promise<void> {
    const db = await getDatabase();
    const existing = await this.get();
    if (!existing) {
      await this.createDefaults();
      return;
    }
    const fields: string[] = [];
    const values: any[] = [];
    const map: Record<string, string> = {
      currency: "currency",
      language: "language",
      themeMode: "theme_mode",
      biometricEnabled: "biometric_enabled",
      autoBackup: "auto_backup",
      autoBackupFrequency: "auto_backup_frequency",
      notificationsEnabled: "notifications_enabled",
      contributionReminderDays: "contribution_reminder_days",
    };
    for (const [key, col] of Object.entries(map)) {
      if ((data as any)[key] !== undefined) {
        const val =
          typeof (data as any)[key] === "boolean"
            ? (data as any)[key]
              ? 1
              : 0
            : (data as any)[key];
        fields.push(`${col} = ?`);
        values.push(val);
      }
    }
    fields.push("updated_at = ?");
    values.push(now());
    await db.runAsync(
      `UPDATE settings SET ${fields.join(", ")} WHERE id = ?`,
      ...values,
      existing.id
    );
  },
};

// ─── Notification Repository ──────────────────────────────────────────
export const NotificationRepository = {
  async create(
    data: Omit<AppNotification, "id" | "isRead" | "isSent" | "createdAt">
  ): Promise<AppNotification> {
    const db = await getDatabase();
    const id = generateId();
    await db.runAsync(
      `INSERT INTO app_notifications (id, type, title, body, data, scheduled_date, expo_notification_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      id,
      data.type,
      data.title,
      data.body,
      JSON.stringify(data.data),
      data.scheduledDate,
      data.expoNotificationId ?? null
    );
    return { ...data, id, isRead: false, isSent: false, createdAt: now() };
  },

  async getAll(): Promise<AppNotification[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>(
      "SELECT * FROM app_notifications ORDER BY created_at DESC LIMIT 50"
    );
    return rows.map(mapNotification);
  },

  async markRead(id: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      "UPDATE app_notifications SET is_read = 1 WHERE id = ?",
      id
    );
  },

  async markAllRead(): Promise<void> {
    const db = await getDatabase();
    await db.runAsync("UPDATE app_notifications SET is_read = 1");
  },

  async getUnreadCount(): Promise<number> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM app_notifications WHERE is_read = 0"
    );
    return row?.count ?? 0;
  },
};

// ─── Dashboard Repository ─────────────────────────────────────────────
export const DashboardRepository = {
  async getStats(): Promise<DashboardStats> {
    const db = await getDatabase();

    const groupStats = await db.getFirstAsync<any>(
      `SELECT COUNT(*) as total, SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active FROM groups`
    );

    const monthlyStats = await db.getFirstAsync<any>(
      `SELECT 
        COALESCE(SUM(CASE WHEN status IN ('paid','partial') THEN amount ELSE 0 END), 0) as paid,
        COALESCE(SUM(expected_amount), 0) as due
       FROM contributions 
       WHERE strftime('%Y-%m', due_date) = strftime('%Y-%m', 'now')`
    );

    const nextBeneficiary = await db.getFirstAsync<any>(
      `SELECT b.*, m.name as member_name, m.phone as member_phone, m.photo_uri as member_photo_uri,
        m.address as member_address, m.profession as member_profession, m.notes as member_notes,
        m.beneficiary_order as member_beneficiary_order, m.is_active as member_is_active,
        m.joined_at as member_joined_at, m.created_at as member_created_at, m.updated_at as member_updated_at,
        g.name as group_name, g.currency as group_currency
       FROM beneficiaries b 
       JOIN members m ON b.member_id = m.id 
       JOIN groups g ON b.group_id = g.id
       WHERE b.is_paid = 0 ORDER BY b.scheduled_date ASC LIMIT 1`
    );

    const recentContributions = await db.getAllAsync<any>(
      `SELECT c.*, m.name as member_name, g.name as group_name
       FROM contributions c JOIN members m ON c.member_id = m.id JOIN groups g ON c.group_id = g.id
       WHERE c.status IN ('paid', 'partial') ORDER BY c.payment_date DESC LIMIT 5`
    );

    const monthlyTrend = await db.getAllAsync<any>(
      `SELECT strftime('%Y-%m', due_date) as month, COALESCE(SUM(amount), 0) as amount
       FROM contributions WHERE status IN ('paid','partial') 
       GROUP BY month ORDER BY month DESC LIMIT 6`
    );

    const groupDist = await db.getAllAsync<any>(
      `SELECT g.name, COALESCE(SUM(c.amount), 0) as amount
       FROM groups g LEFT JOIN contributions c ON c.group_id = g.id AND c.status IN ('paid','partial')
       GROUP BY g.id ORDER BY amount DESC LIMIT 5`
    );

    const colors = ["#2EB36B", "#FFC107", "#F2702D", "#3182CE", "#9F7AEA"];

    return {
      totalBalance: monthlyStats?.paid ?? 0,
      groupCount: groupStats?.total ?? 0,
      activeGroupCount: groupStats?.active ?? 0,
      monthlyContributions: monthlyStats?.due ?? 0,
      thisMonthPaid: monthlyStats?.paid ?? 0,
      thisMonthDue: monthlyStats?.due ?? 0,
      nextBeneficiary: nextBeneficiary
        ? {
            member: {
              id: nextBeneficiary.member_id,
              groupId: nextBeneficiary.group_id,
              name: nextBeneficiary.member_name,
              phone: nextBeneficiary.member_phone,
              photoUri: nextBeneficiary.member_photo_uri,
              address: nextBeneficiary.member_address,
              profession: nextBeneficiary.member_profession,
              notes: nextBeneficiary.member_notes,
              beneficiaryOrder: nextBeneficiary.member_beneficiary_order,
              isActive: nextBeneficiary.member_is_active === 1,
              joinedAt: nextBeneficiary.member_joined_at,
              createdAt: nextBeneficiary.member_created_at,
              updatedAt: nextBeneficiary.member_updated_at,
            } as Member,
            group: {
              id: nextBeneficiary.group_id,
              name: nextBeneficiary.group_name,
            } as Group,
            date: nextBeneficiary.scheduled_date,
            amount: nextBeneficiary.amount,
          }
        : null,
      recentContributions: recentContributions.map((r) => ({
        ...mapContribution(r),
        memberName: r.member_name,
        groupName: r.group_name,
      })),
      contributionsByMonth: monthlyTrend
        .map((r) => ({ month: r.month, amount: r.amount }))
        .reverse(),
      groupDistribution: groupDist.map((r, i) => ({
        groupName: r.name,
        amount: r.amount,
        color: colors[i % colors.length],
      })),
    };
  },
};

// ─── Search Repository ────────────────────────────────────────────────
export const SearchRepository = {
  async search(query: string): Promise<{
    members: Member[];
    groups: Group[];
    contributions: Contribution[];
  }> {
    const db = await getDatabase();
    const q = `%${query}%`;

    const members = await db.getAllAsync<any>(
      `SELECT * FROM members WHERE is_active = 1 AND (name LIKE ? OR phone LIKE ? OR profession LIKE ?) LIMIT 10`,
      q,
      q,
      q
    );
    const groups = await db.getAllAsync<any>(
      `SELECT * FROM groups WHERE name LIKE ? OR description LIKE ? LIMIT 10`,
      q,
      q
    );
    const contributions = await db.getAllAsync<any>(
      `SELECT c.*, m.name as member_name, g.name as group_name
       FROM contributions c JOIN members m ON c.member_id = m.id JOIN groups g ON c.group_id = g.id
       WHERE m.name LIKE ? OR g.name LIKE ? OR c.receipt_number LIKE ? LIMIT 10`,
      q,
      q,
      q
    );

    return {
      members: members.map(mapMember),
      groups: groups.map(mapGroup),
      contributions: contributions.map(mapContribution),
    };
  },
};

// ─── Mapper functions ─────────────────────────────────────────────────
function mapUser(row: any): User {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    photoUri: row.photo_uri,
    pinHash: row.pin_hash,
    biometricEnabled: row.biometric_enabled === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapGroup(row: any): Group {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    photoUri: row.photo_uri,
    contributionAmount: row.contribution_amount,
    currency: row.currency,
    frequency: row.frequency,
    customFrequencyDays: row.custom_frequency_days,
    memberCount: row.member_count ?? 0,
    totalAmount: row.total_amount,
    startDate: row.start_date,
    endDate: row.end_date,
    status: row.status,
    selectionMode: row.selection_mode,
    currentCycle: row.current_cycle,
    totalCycles: row.total_cycles,
    meetingDay: row.meeting_day,
    meetingTime: row.meeting_time,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapMember(row: any): Member {
  return {
    id: row.id,
    groupId: row.group_id,
    name: row.name,
    phone: row.phone,
    photoUri: row.photo_uri,
    address: row.address,
    profession: row.profession,
    notes: row.notes,
    beneficiaryOrder: row.beneficiary_order,
    isActive: row.is_active === 1,
    joinedAt: row.joined_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapContribution(row: any): Contribution {
  return {
    id: row.id,
    groupId: row.group_id,
    memberId: row.member_id,
    amount: row.amount,
    expectedAmount: row.expected_amount,
    status: row.status,
    cycle: row.cycle,
    periodLabel: row.period_label,
    paymentDate: row.payment_date,
    dueDate: row.due_date,
    notes: row.notes,
    receiptNumber: row.receipt_number,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapBeneficiary(row: any): Beneficiary {
  return {
    id: row.id,
    groupId: row.group_id,
    memberId: row.member_id,
    cycle: row.cycle,
    scheduledDate: row.scheduled_date,
    actualDate: row.actual_date,
    amount: row.amount,
    isPaid: row.is_paid === 1,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapMeeting(row: any): Meeting {
  return {
    id: row.id,
    groupId: row.group_id,
    title: row.title,
    description: row.description,
    scheduledDate: row.scheduled_date,
    location: row.location,
    isCompleted: row.is_completed === 1,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapSettings(row: any): Settings {
  return {
    id: row.id,
    currency: row.currency,
    language: row.language,
    themeMode: row.theme_mode,
    biometricEnabled: row.biometric_enabled === 1,
    autoBackup: row.auto_backup === 1,
    autoBackupFrequency: row.auto_backup_frequency,
    notificationsEnabled: row.notifications_enabled === 1,
    contributionReminderDays: row.contribution_reminder_days,
    updatedAt: row.updated_at,
  };
}

function mapNotification(row: any): AppNotification {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    data: JSON.parse(row.data ?? "{}"),
    scheduledDate: row.scheduled_date,
    isRead: row.is_read === 1,
    isSent: row.is_sent === 1,
    expoNotificationId: row.expo_notification_id,
    createdAt: row.created_at,
  };
}
