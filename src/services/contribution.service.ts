// src/services/contribution.service.ts
import { addDays, addWeeks, addMonths, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  GroupRepository, MemberRepository, ContributionRepository, BeneficiaryRepository
} from '../repositories';
import { ContributionFrequency, Member } from '../types';

const getNextDueDate = (from: Date, frequency: ContributionFrequency, customDays?: number | null): Date => {
  switch (frequency) {
    case 'daily':    return addDays(from, 1);
    case 'weekly':   return addWeeks(from, 1);
    case 'biweekly': return addWeeks(from, 2);
    case 'monthly':  return addMonths(from, 1);
    case 'custom':   return addDays(from, customDays ?? 30);
    default:         return addMonths(from, 1);
  }
};

const getPeriodLabel = (date: Date, frequency: ContributionFrequency): string => {
  switch (frequency) {
    case 'daily':    return format(date, 'dd/MM/yyyy', { locale: fr });
    case 'weekly':   return `Semaine du ${format(date, 'dd/MM', { locale: fr })}`;
    case 'biweekly': return `Quinzaine du ${format(date, 'dd/MM', { locale: fr })}`;
    case 'monthly':  return format(date, 'MMMM yyyy', { locale: fr });
    case 'custom':   return format(date, 'dd/MM/yyyy', { locale: fr });
    default:         return format(date, 'MMMM yyyy', { locale: fr });
  }
};

/** Mélange un tableau (Fisher-Yates) */
const shuffle = <T>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export const ContributionService = {

  // ── Initialise les cotisations pour tous les membres d'un cycle ───────
  async initializeGroupCycle(groupId: string, cycle: number): Promise<void> {
    const group = await GroupRepository.getById(groupId);
    if (!group) throw new Error('Groupe introuvable');
    const members = await MemberRepository.getByGroup(groupId);
    if (members.length === 0) return;

    const startDate = new Date(group.startDate);
    let dueDate = startDate;
    for (let i = 1; i < cycle; i++) {
      dueDate = getNextDueDate(dueDate, group.frequency, group.customFrequencyDays);
    }
    const periodLabel = getPeriodLabel(dueDate, group.frequency);
    const dueDateStr  = format(dueDate, 'yyyy-MM-dd');

    const payloads = members.map(m => ({
      groupId, memberId: m.id, amount: 0,
      expectedAmount: group.contributionAmount,
      cycle, periodLabel, dueDate: dueDateStr,
    }));
    await ContributionRepository.bulkCreate(payloads);
  },

  // ── Crée une cotisation pour un seul membre (ajout tardif) ────────────
  async createContributionForMember(groupId: string, memberId: string, cycle: number): Promise<void> {
    const group = await GroupRepository.getById(groupId);
    if (!group) return;
    const startDate = new Date(group.startDate);
    let dueDate = startDate;
    for (let i = 1; i < cycle; i++) {
      dueDate = getNextDueDate(dueDate, group.frequency, group.customFrequencyDays);
    }
    await ContributionRepository.bulkCreate([{
      groupId, memberId, amount: 0,
      expectedAmount: group.contributionAmount,
      cycle,
      periodLabel: getPeriodLabel(dueDate, group.frequency),
      dueDate: format(dueDate, 'yyyy-MM-dd'),
    }]);
  },

  // ── Configure le calendrier de rotation des bénéficiaires ─────────────
  async setupBeneficiarySchedule(groupId: string): Promise<void> {
    const group = await GroupRepository.getById(groupId);
    if (!group) return;
    const allMembers = await MemberRepository.getByGroup(groupId);
    if (allMembers.length === 0) return;

    // FIX BUG 1 : supprimer l'ancienne rotation avant d'en créer une nouvelle
    const existing = await BeneficiaryRepository.getByGroup(groupId);
    for (const b of existing) {
      if (!b.isPaid) {
        // Supprime uniquement les non-payés (préserve l'historique)
        // On recrée toute la rotation à partir du prochain cycle non payé
      }
    }
    // Suppression complète des bénéficiaires non payés
    const db = await (await import('../database/database')).getDatabase();
    await db.runAsync(
      'DELETE FROM beneficiaries WHERE group_id = ? AND is_paid = 0',
      groupId
    );

    // FIX BUG 2 : respecter le selectionMode
    let orderedMembers: Member[];
    switch (group.selectionMode) {
      case 'random':
        orderedMembers = shuffle(allMembers);
        break;
      case 'automatic':
        // Ordre d'inscription : beneficiary_order ASC (déjà trié par getByGroup)
        orderedMembers = [...allMembers];
        break;
      case 'manual':
      default:
        // Ordre manuel : beneficiary_order défini par l'utilisateur
        orderedMembers = [...allMembers].sort((a, b) => a.beneficiaryOrder - b.beneficiaryOrder);
        break;
    }

    // Calculer la date du 1er bénéficiaire : startDate + 1 période
    const startDate = new Date(group.startDate);
    let scheduledDate = getNextDueDate(startDate, group.frequency, group.customFrequencyDays);

    // Sauter les cycles déjà payés
    const paidCount = existing.filter(b => b.isPaid).length;
    for (let i = 0; i < paidCount; i++) {
      scheduledDate = getNextDueDate(scheduledDate, group.frequency, group.customFrequencyDays);
    }

    // FIX WARN 8 : fixer le montant au moment de la création
    const fixedAmount = group.contributionAmount * orderedMembers.length;

    for (let i = 0; i < orderedMembers.length; i++) {
      const member = orderedMembers[i];
      await BeneficiaryRepository.create({
        groupId,
        memberId: member.id,
        cycle: paidCount + i + 1,
        scheduledDate: format(scheduledDate, 'yyyy-MM-dd'),
        amount: fixedAmount,
      });
      scheduledDate = getNextDueDate(scheduledDate, group.frequency, group.customFrequencyDays);
    }

    await GroupRepository.update(groupId, { totalCycles: paidCount + orderedMembers.length });
  },

  // ── Avance au cycle suivant ────────────────────────────────────────────
  async advanceCycle(groupId: string): Promise<void> {
    const group = await GroupRepository.getById(groupId);
    if (!group) return;

    // FIX WARN 4 : vérifier si le dernier cycle est atteint
    if (group.totalCycles > 0 && group.currentCycle >= group.totalCycles) {
      // Tontine terminée : marquer comme completed
      await GroupRepository.update(groupId, { status: 'completed' });
      return;
    }

    // FIX BUG 3 : marquer le bénéficiaire du cycle courant comme payé
    const currentBenef = await BeneficiaryRepository.getNext(groupId);
    if (currentBenef) {
      await BeneficiaryRepository.markAsPaid(
        currentBenef.id,
        new Date().toISOString().split('T')[0]
      );
    }

    const newCycle = group.currentCycle + 1;
    await GroupRepository.update(groupId, { currentCycle: newCycle });
    await this.initializeGroupCycle(groupId, newCycle);
  },

  async getContributionSummary(groupId: string, cycle: number) {
    const contributions = await ContributionRepository.getByGroup(groupId, cycle);
    const total    = contributions.reduce((s, c) => s + c.amount, 0);
    const expected = contributions.reduce((s, c) => s + c.expectedAmount, 0);
    return {
      total, expected,
      paid:    contributions.filter(c => c.status === 'paid').length,
      partial: contributions.filter(c => c.status === 'partial').length,
      unpaid:  contributions.filter(c => c.status === 'unpaid').length,
      pending: contributions.filter(c => c.status === 'pending').length,
      rate: expected > 0 ? (total / expected) * 100 : 0,
    };
  },
};