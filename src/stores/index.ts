// src/stores/index.ts
import { create } from "zustand";
import {
  User,
  Group,
  Member,
  Contribution,
  Beneficiary,
  Settings,
  DashboardStats,
  GroupWithStats,
  MemberWithStats,
  BeneficiaryWithMember,
  CreateUserPayload,
  CreateGroupPayload,
  CreateMemberPayload,
  CreateContributionPayload,
  RecordPaymentPayload,
  ThemeMode,
  Language,
  CurrencyCode,
} from "../types";
import { AuthService } from "../services/auth.service";
import {
  UserRepository,
  GroupRepository,
  MemberRepository,
  ContributionRepository,
  BeneficiaryRepository,
  MeetingRepository,
  SettingsRepository,
  DashboardRepository,
} from "../repositories";
import { ContributionService } from "../services/contribution.service";

// ─── Auth Store ───────────────────────────────────────────────────────
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasAccount: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  createAccount: (payload: CreateUserPayload) => Promise<void>;
  login: (pin: string) => Promise<boolean>;
  loginWithBiometric: () => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<boolean>;
  updatePin: (oldPin: string, newPin: string) => Promise<boolean>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  hasAccount: false,
  error: null,

  initialize: async () => {
    set({ isLoading: true, error: null });
    try {
      const hasAcc = await AuthService.hasAccount();
      const session = await AuthService.getSession();
      if (hasAcc && session) {
        const user = await UserRepository.getFirst();
        set({ user, isAuthenticated: false, hasAccount: true }); // require auth each launch
      } else if (hasAcc) {
        set({ hasAccount: true, isAuthenticated: false });
      } else {
        set({ hasAccount: false, isAuthenticated: false });
      }
    } catch (e) {
      set({ error: "Erreur d'initialisation" });
    } finally {
      set({ isLoading: false });
    }
  },

  createAccount: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const user = await AuthService.createUser(payload);
      await SettingsRepository.createDefaults();
      set({ user, isAuthenticated: true, hasAccount: true });
    } catch (e) {
      set({ error: "Erreur lors de la création du compte" });
      throw e;
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (pin) => {
    set({ error: null });
    const valid = await AuthService.verifyPin(pin);
    if (valid) {
      const user = await UserRepository.getFirst();
      await AuthService.setSession(user?.id ?? "");
      set({ user, isAuthenticated: true });
      return true;
    }
    set({ error: "PIN incorrect" });
    return false;
  },

  loginWithBiometric: async () => {
    const success = await AuthService.authenticateWithBiometric();
    if (success) {
      const user = await UserRepository.getFirst();
      await AuthService.setSession(user?.id ?? "");
      set({ user, isAuthenticated: true });
      return true;
    }
    return false;
  },

  logout: async () => {
    await AuthService.clearSession();
    set({ isAuthenticated: false, user: null, error: null });
  },

  updateProfile: async (data) => {
    try {
      const { user } = get();
      if (!user) return false;
      await UserRepository.update(user.id, data);
      const updated = await UserRepository.getById(user.id);
      set({ user: updated });
      return true;
    } catch {
      return false;
    }
  },

  updatePin: async (oldPin, newPin) => {
    return AuthService.updatePin(oldPin, newPin);
  },

  clearError: () => set({ error: null }),
}));

// ─── Settings Store ───────────────────────────────────────────────────
interface SettingsState {
  settings: Settings | null;
  themeMode: ThemeMode;
  load: () => Promise<void>;
  update: (data: Partial<Settings>) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: null,
  themeMode: "system",

  load: async () => {
    let s = await SettingsRepository.get();
    if (!s) s = await SettingsRepository.createDefaults();
    set({ settings: s, themeMode: s.themeMode });
  },

  update: async (data) => {
    await SettingsRepository.update(data);
    const s = await SettingsRepository.get();
    set({ settings: s, themeMode: s?.themeMode ?? "system" });
  },
}));

// ─── Dashboard Store ──────────────────────────────────────────────────
interface DashboardState {
  stats: DashboardStats | null;
  isLoading: boolean;
  load: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  stats: null,
  isLoading: false,

  load: async () => {
    set({ isLoading: true });
    try {
      const stats = await DashboardRepository.getStats();
      set({ stats });
    } finally {
      set({ isLoading: false });
    }
  },

  refresh: async () => {
    const stats = await DashboardRepository.getStats();
    set({ stats });
  },
}));

// ─── Groups Store ─────────────────────────────────────────────────────
interface GroupsState {
  groups: Group[];
  selectedGroup: GroupWithStats | null;
  isLoading: boolean;
  error: string | null;
  loadGroups: () => Promise<void>;
  loadGroupDetails: (id: string) => Promise<void>;
  createGroup: (payload: CreateGroupPayload) => Promise<Group>;
  updateGroup: (id: string, data: Partial<Group>) => Promise<void>;
  deleteGroup: (id: string) => Promise<void>;
  clearSelected: () => void;
}

export const useGroupsStore = create<GroupsState>((set, get) => ({
  groups: [],
  selectedGroup: null,
  isLoading: false,
  error: null,

  loadGroups: async () => {
    set({ isLoading: true, error: null });
    try {
      const groups = await GroupRepository.getAll();
      set({ groups });
    } catch (e) {
      set({ error: "Erreur lors du chargement des groupes" });
    } finally {
      set({ isLoading: false });
    }
  },

  loadGroupDetails: async (id) => {
    set({ isLoading: true });
    try {
      const group = await GroupRepository.getWithStats(id);
      set({ selectedGroup: group });
    } finally {
      set({ isLoading: false });
    }
  },

  createGroup: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const group = await GroupRepository.create(payload);
      // No members yet at creation — contributions will be created when members are added
      await get().loadGroups();
      return group;
    } catch (e) {
      set({ error: "Erreur lors de la création du groupe" });
      throw e;
    } finally {
      set({ isLoading: false });
    }
  },

  updateGroup: async (id, data) => {
    await GroupRepository.update(id, data);
    await get().loadGroups();
    if (get().selectedGroup?.id === id) {
      await get().loadGroupDetails(id);
    }
  },

  deleteGroup: async (id) => {
    await GroupRepository.delete(id);
    set((state) => ({
      groups: state.groups.filter((g) => g.id !== id),
      selectedGroup: null,
    }));
  },

  clearSelected: () => set({ selectedGroup: null }),
}));

// ─── Members Store ────────────────────────────────────────────────────
interface MembersState {
  members: MemberWithStats[];
  isLoading: boolean;
  error: string | null;
  loadMembers: (groupId: string, cycle?: number) => Promise<void>;
  addMember: (payload: CreateMemberPayload) => Promise<Member>;
  updateMember: (id: string, data: Partial<Member>) => Promise<void>;
  removeMember: (id: string) => Promise<void>;
  reorderBeneficiaries: (
    groupId: string,
    orderedIds: string[]
  ) => Promise<void>;
}

export const useMembersStore = create<MembersState>((set, get) => ({
  members: [],
  isLoading: false,
  error: null,

  loadMembers: async (groupId, cycle = 1) => {
    set({ isLoading: true, error: null });
    try {
      const members = await MemberRepository.getByGroupWithStats(
        groupId,
        cycle
      );
      set({ members });
    } catch {
      set({ error: "Erreur lors du chargement des membres" });
    } finally {
      set({ isLoading: false });
    }
  },

  addMember: async (payload) => {
    const member = await MemberRepository.create(payload);
    const group = await GroupRepository.getById(payload.groupId);
    if (group) {
      // Create contribution ONLY for this new member on current cycle
      await ContributionService.createContributionForMember(
        payload.groupId,
        member.id,
        group.currentCycle
      );
    }
    return member;
  },

  updateMember: async (id, data) => {
    await MemberRepository.update(id, data);
  },

  removeMember: async (id) => {
    await MemberRepository.delete(id);
    set((state) => ({ members: state.members.filter((m) => m.id !== id) }));
  },

  reorderBeneficiaries: async (groupId, orderedIds) => {
    await MemberRepository.reorderBeneficiaries(groupId, orderedIds);
  },
}));

// ─── Contributions Store ──────────────────────────────────────────────
interface ContributionsState {
  contributions: Contribution[];
  isLoading: boolean;
  error: string | null;
  loadContributions: (groupId: string, cycle?: number) => Promise<void>;
  recordPayment: (payload: RecordPaymentPayload) => Promise<void>;
  advanceCycle: (groupId: string) => Promise<void>;
}

export const useContributionsStore = create<ContributionsState>((set, get) => ({
  contributions: [],
  isLoading: false,
  error: null,

  loadContributions: async (groupId, cycle) => {
    set({ isLoading: true, error: null });
    try {
      const contributions = await ContributionRepository.getByGroup(
        groupId,
        cycle
      );
      set({ contributions });
    } finally {
      set({ isLoading: false });
    }
  },

  recordPayment: async (payload) => {
    set({ isLoading: true });
    try {
      await ContributionRepository.recordPayment(payload);
      // Reload contributions so UI reflects the payment immediately
      const { contributions } = get();
      if (contributions.length > 0) {
        const groupId = contributions[0]?.groupId;
        if (groupId) {
          const updated = await ContributionRepository.getByGroup(groupId);
          set({ contributions: updated });
        }
      }
    } finally {
      set({ isLoading: false });
    }
  },

  advanceCycle: async (groupId) => {
    await ContributionService.advanceCycle(groupId);
  },
}));

// ─── Beneficiaries Store ──────────────────────────────────────────────
interface BeneficiariesState {
  beneficiaries: BeneficiaryWithMember[];
  isLoading: boolean;
  load: (groupId: string) => Promise<void>;
  markPaid: (id: string) => Promise<void>;
  setup: (groupId: string) => Promise<void>;
}

export const useBeneficiariesStore = create<BeneficiariesState>((set, get) => ({
  beneficiaries: [],
  isLoading: false,

  load: async (groupId) => {
    set({ isLoading: true });
    try {
      const beneficiaries = await BeneficiaryRepository.getByGroup(groupId);
      set({ beneficiaries });
    } finally {
      set({ isLoading: false });
    }
  },

  markPaid: async (id) => {
    const today = new Date().toISOString().split("T")[0];
    // Capture groupId from current state BEFORE any async operation
    const target = get().beneficiaries.find((b) => b.id === id);
    const groupId = target?.groupId;
    // Persist to DB
    await BeneficiaryRepository.markAsPaid(id, today);
    // Reload full list from DB so order and flags are correct
    if (groupId) {
      const bens = await BeneficiaryRepository.getByGroup(groupId);
      set({ beneficiaries: bens });
    } else {
      // Fallback: optimistic update
      set((state) => ({
        beneficiaries: state.beneficiaries.map((b) =>
          b.id === id ? { ...b, isPaid: true, actualDate: today } : b
        ),
      }));
    }
  },

  setup: async (groupId) => {
    await ContributionService.setupBeneficiarySchedule(groupId);
    const beneficiaries = await BeneficiaryRepository.getByGroup(groupId);
    set({ beneficiaries });
  },
}));
