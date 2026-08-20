/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Bioreactor } from '../types';

export interface ScheduleAlertInfo {
  hasAlert: boolean;
  stageName: string;
  timeText: string;
  diffMinutes: number;
  label: string;
  isUrgent: boolean;
  isOverdue: boolean;
}

export function checkScheduleAlert(
  bioreactor: Bioreactor,
  nowDate: Date = new Date()
): ScheduleAlertInfo | null {
  const currentDay = nowDate.getDate();
  const currentMonth = nowDate.getMonth() + 1; // 1-12
  const nowTotalMinutes = nowDate.getHours() * 60 + nowDate.getMinutes();

  const stages = [
    {
      name: 'Inoculação',
      val: bioreactor.inoculationTime,
      realizado: bioreactor.inoculationRealizado,
      done: bioreactor.inoculationDone,
    },
    {
      name: 'Transferência',
      val: bioreactor.transferTime,
      realizado: bioreactor.transferRealizado,
      done: bioreactor.transferDone,
    },
    {
      name: 'Liberação Envase',
      val: bioreactor.releaseTime,
      realizado: bioreactor.releaseRealizado,
      done: bioreactor.releaseDone,
    },
  ];

  const alerts: ScheduleAlertInfo[] = [];

  for (const stage of stages) {
    // If stage is marked as completed or has a non-empty realizado value, interrupt/suppress alert!
    if (stage.done) continue;
    if (stage.realizado && stage.realizado.trim() !== '' && !stage.realizado.includes('--:--')) continue;

    if (!stage.val || stage.val.includes('--:--')) continue;

    // Extract optional date DD/MM
    let isSameDay = true;
    let isPastDate = false;

    const dateMatch = stage.val.match(/(\d{1,2})\/(\d{1,2})/);
    if (dateMatch) {
      const day = parseInt(dateMatch[1], 10);
      const month = parseInt(dateMatch[2], 10);
      
      if (month < currentMonth || (month === currentMonth && day < currentDay)) {
        isPastDate = true;
        isSameDay = false;
      } else if (day === currentDay && month === currentMonth) {
        isSameDay = true;
      } else {
        // Future date, not today
        isSameDay = false;
      }
    }

    // Extract time HH:MM
    const timeMatch = stage.val.match(/(\d{1,2}):(\d{2})/);
    if (!timeMatch) continue;

    const hours = parseInt(timeMatch[1], 10);
    const minutes = parseInt(timeMatch[2], 10);
    if (isNaN(hours) || isNaN(minutes) || hours > 23 || minutes > 59) continue;

    const targetTotalMinutes = hours * 60 + minutes;
    const diff = targetTotalMinutes - nowTotalMinutes;
    const timeText = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

    // Case 1: Past date -> Definitely overdue
    if (isPastDate) {
      alerts.push({
        hasAlert: true,
        stageName: stage.name,
        timeText,
        diffMinutes: -9999,
        label: `ATRASADO - ${stage.name}: ${timeText} (Data anterior)`,
        isUrgent: true,
        isOverdue: true,
      });
      continue;
    }

    // Only process if it's today (or time without date assumed today)
    if (isSameDay) {
      // OVERDUE: Scheduled time was earlier today (e.g. between 1 min and 12 hours ago)
      if (diff < 0 && diff >= -720) {
        const absDiff = Math.abs(diff);
        let overdueText = '';
        if (absDiff < 60) {
          overdueText = `há ${absDiff} min`;
        } else {
          const h = Math.floor(absDiff / 60);
          const m = absDiff % 60;
          overdueText = m > 0 ? `há ${h}h ${m}m` : `há ${h}h`;
        }

        alerts.push({
          hasAlert: true,
          stageName: stage.name,
          timeText,
          diffMinutes: diff,
          label: `ATRASADO - ${stage.name}: ${timeText} (${overdueText})`,
          isUrgent: true,
          isOverdue: true,
        });
      }
      // UPCOMING / DUE SOON: Scheduled time is in the next 180 minutes (3 hours)
      else if (diff >= 0 && diff <= 180) {
        let statusDesc = '';
        if (diff === 0) {
          statusDesc = 'AGORA';
        } else if (diff < 60) {
          statusDesc = `em ${diff} min`;
        } else {
          const h = Math.floor(diff / 60);
          const m = diff % 60;
          statusDesc = m > 0 ? `em ${h}h ${m}m` : `em ${h}h`;
        }

        alerts.push({
          hasAlert: true,
          stageName: stage.name,
          timeText,
          diffMinutes: diff,
          label: `PRÓXIMO - ${stage.name}: ${timeText} (${statusDesc})`,
          isUrgent: diff <= 30,
          isOverdue: false,
        });
      }
    }
  }

  if (alerts.length === 0) return null;

  // Prioritize OVERDUE alerts first (sorted by most overdue - most negative diffMinutes)
  const overdueAlerts = alerts.filter((a) => a.isOverdue);
  if (overdueAlerts.length > 0) {
    overdueAlerts.sort((a, b) => a.diffMinutes - b.diffMinutes);
    return overdueAlerts[0];
  }

  // Otherwise pick the soonest upcoming alert
  alerts.sort((a, b) => a.diffMinutes - b.diffMinutes);
  return alerts[0];
}
