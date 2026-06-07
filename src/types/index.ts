// src/types/index.ts

export type CurrencyCode = 'XOF' | 'XAF' | 'GNF' | 'MRU' | 'EUR' | 'USD';
export type Language = 'fr' | 'en';
export type ThemeMode = 'light' | 'dark' | 'system';
export type ContributionFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'custom';
export type ContributionStatus = 'paid' | 'partial' | 'unpaid' | 'pending';
export type GroupStatus = 'active' | 'paused' | 'completed' | 'archived';
export type BeneficiarySelectionMode = 'manual' | 'automatic' | 'random';
export type NotificationType = 'contribution_due' | 'contribution_late' | 'beneficiary_turn' | 'meeting' | 'custom';

// ─── User ─────────────────────────────────────────────────────────────
export interface User {
  id: string;
  name: string;
  phone: string;
  photoUri: string | null;
  pinHash: string;
  biometricEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserPayload {
  name: string;
  phone: string;
  photoUri: string | null;
  pin: string;
}

// ─── Group ────────────────────────────────────────────────────────────
export interface Group {
  id: string;
  name: string;
  description: string;
  photoUri: string | null;
  contributionAmount: number;
  currency: CurrencyCode;
  frequency: ContributionFrequency;
  customFrequencyDays: number | null;
  memberCount: number;
  totalAmount: number;
  startDate: string;
  endDate: string | null;
  status: GroupStatus;
  selectionMode: BeneficiarySelectionMode;
  currentCycle: number;
  totalCycles: number;
  meetingDay: number | null; // 0-6 for Sun-Sat
  meetingTime: string | null; // HH:MM
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGroupPayload {
  name: string;
  description: string;
  photoUri: string | null;
  contributionAmount: number;
  currency: CurrencyCode;
  frequency: ContributionFrequency;
  customFrequencyDays?: number;
  startDate: string;
  selectionMode: BeneficiarySelectionMode;
  meetingDay?: number;
  meetingTime?: string;
  notes?: string;
}

export interface GroupWithStats extends Group {
  totalCollected: number;
  totalDistributed: number;
  lateMembers: number;
  nextBeneficiary: Member | null;
  nextPaymentDate: string | null;
  myTotalPaid: number;
}

// ─── Member ───────────────────────────────────────────────────────────
export interface Member {
  id: string;
  groupId: string;
  name: string;
  phone: string;
  photoUri: string | null;
  address: string;
  profession: string;
  notes: string;
  beneficiaryOrder: number;
  isActive: boolean;
  joinedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMemberPayload {
  groupId: string;
  name: string;
  phone: string;
  photoUri?: string | null;
  address?: string;
  profession?: string;
  notes?: string;
  beneficiaryOrder?: number;
}

export interface MemberWithStats extends Member {
  totalPaid: number;
  totalDue: number;
  lastPaymentDate: string | null;
  contributionStatus: ContributionStatus;
  hasReceivedBenefit: boolean;
  cycle: number;
}

// ─── Contribution ─────────────────────────────────────────────────────
export interface Contribution {
  id: string;
  groupId: string;
  memberId: string;
  amount: number;
  expectedAmount: number;
  status: ContributionStatus;
  cycle: number;
  periodLabel: string;
  paymentDate: string | null;
  dueDate: string;
  notes: string;
  receiptNumber: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateContributionPayload {
  groupId: string;
  memberId: string;
  amount: number;
  expectedAmount: number;
  cycle: number;
  periodLabel: string;
  dueDate: string;
  notes?: string;
}

export interface RecordPaymentPayload {
  contributionId: string;
  amount: number;
  paymentDate: string;
  notes?: string;
}

// ─── Beneficiary ──────────────────────────────────────────────────────
export interface Beneficiary {
  id: string;
  groupId: string;
  memberId: string;
  cycle: number;
  scheduledDate: string;
  actualDate: string | null;
  amount: number;
  isPaid: boolean;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface BeneficiaryWithMember extends Beneficiary {
  member: Member;
}

// ─── Meeting ──────────────────────────────────────────────────────────
export interface Meeting {
  id: string;
  groupId: string;
  title: string;
  description: string;
  scheduledDate: string;
  location: string;
  isCompleted: boolean;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMeetingPayload {
  groupId: string;
  title: string;
  description?: string;
  scheduledDate: string;
  location?: string;
}

// ─── Notification ─────────────────────────────────────────────────────
export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, string>;
  scheduledDate: string;
  isRead: boolean;
  isSent: boolean;
  expoNotificationId: string | null;
  createdAt: string;
}

// ─── Settings ─────────────────────────────────────────────────────────
export interface Settings {
  id: string;
  currency: CurrencyCode;
  language: Language;
  themeMode: ThemeMode;
  biometricEnabled: boolean;
  autoBackup: boolean;
  autoBackupFrequency: 'daily' | 'weekly' | 'monthly';
  notificationsEnabled: boolean;
  contributionReminderDays: number;
  lastBackupDate?: string;
  updatedAt: string;
}

// ─── Backup ───────────────────────────────────────────────────────────
export interface BackupData {
  version: string;
  exportedAt: string;
  user: User;
  groups: Group[];
  members: Member[];
  contributions: Contribution[];
  beneficiaries: Beneficiary[];
  meetings: Meeting[];
  settings: Settings;
}

// ─── Dashboard ────────────────────────────────────────────────────────
export interface DashboardStats {
  totalBalance: number;
  groupCount: number;
  activeGroupCount: number;
  monthlyContributions: number;
  thisMonthPaid: number;
  thisMonthDue: number;
  nextBeneficiary: { member: Member; group: Group; date: string; amount: number } | null;
  recentContributions: (Contribution & { memberName: string; groupName: string })[];
  contributionsByMonth: { month: string; amount: number }[];
  groupDistribution: { groupName: string; amount: number; color: string }[];
}

// ─── Calendar ─────────────────────────────────────────────────────────
export interface CalendarEvent {
  id: string;
  type: 'meeting' | 'payment' | 'beneficiary';
  title: string;
  date: string;
  groupId: string;
  groupName: string;
  color: string;
  data: Meeting | Contribution | Beneficiary;
}

// ─── Reports ──────────────────────────────────────────────────────────
export interface ReportData {
  group: Group;
  members: MemberWithStats[];
  contributions: Contribution[];
  beneficiaries: BeneficiaryWithMember[];
  summary: {
    totalExpected: number;
    totalCollected: number;
    totalDistributed: number;
    collectionRate: number;
    lateCount: number;
    paidCount: number;
  };
}
