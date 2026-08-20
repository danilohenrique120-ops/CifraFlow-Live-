/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type BioreactorStatus = 'vazio' | 'aguardando' | 'andamento' | 'concluido';

export interface Bioreactor {
  id: string; // BR-01 to BR-16
  name: string; // e.g., "BR 01"
  capacity: number; // 100, 500, 3000, 5000 Liters
  description: string; // e.g., "Preparo de meio, Limpeza, etc."
  productName: string; // Name of the product
  inoculationTime: string; // Horário de Inoculação (Planejado)
  inoculationRealizado?: string; // Horário de Inoculação (Realizado)
  inoculationDone?: boolean; // Checkbox Concluído

  transferTime: string; // Horário de Transferência (Planejado)
  transferRealizado?: string; // Horário de Transferência (Realizado)
  transferDone?: boolean; // Checkbox Concluído

  releaseTime: string; // Horário de Liberação para Envase (Planejado)
  releaseRealizado?: string; // Horário de Liberação para Envase (Realizado)
  releaseDone?: boolean; // Checkbox Concluído

  operator: string; // Responsible operator
  operatorActivity?: string; // Exact action or task the operator is performing
  status: BioreactorStatus;
  fillLevel: number; // Percentage: 0 to 100
  updatedAt: string; // ISO string
}

export interface WhiteboardNote {
  id: string;
  content: string;
  updatedBy: string;
  updatedAt: string;
}

export interface ShiftInfo {
  currentShift: string; // "Turno A", "Turno B", "Turno C"
  supervisor: string;
  date: string;
}
