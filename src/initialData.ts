/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Bioreactor } from './types';

export const initialBioreactors: Bioreactor[] = [
  {
    id: "BR-01",
    name: "BR 01",
    capacity: 100,
    description: "",
    productName: "",
    inoculationTime: "",
    transferTime: "",
    releaseTime: "",
    operator: "",
    status: "vazio",
    fillLevel: 0,
    updatedAt: new Date().toISOString()
  },
  {
    id: "BR-02",
    name: "BR 02",
    capacity: 100,
    description: "Multiplicação de Inóculo - Soja",
    productName: "Soja",
    inoculationTime: "08:15",
    transferTime: "16:30",
    releaseTime: "--:--",
    operator: "Satoshi Tanaka",
    status: "andamento",
    fillLevel: 65,
    updatedAt: new Date().toISOString()
  },
  {
    id: "BR-03",
    name: "BR 03",
    capacity: 100,
    description: "Inóculo Esterilizado e Resfriado",
    productName: "Dual Brady",
    inoculationTime: "06:00",
    transferTime: "10:15",
    releaseTime: "11:00",
    operator: "Maria Sousa",
    status: "concluido",
    fillLevel: 100,
    updatedAt: new Date().toISOString()
  },
  {
    id: "BR-04",
    name: "BR 04",
    capacity: 100,
    description: "Aguardando adição de meio estéril",
    productName: "Dual Azo",
    inoculationTime: "14:00",
    transferTime: "--:--",
    releaseTime: "--:--",
    operator: "Carlos Lima",
    status: "aguardando",
    fillLevel: 0,
    updatedAt: new Date().toISOString()
  },
  {
    id: "BR-05",
    name: "BR 05",
    capacity: 100,
    description: "",
    productName: "",
    inoculationTime: "",
    transferTime: "",
    releaseTime: "",
    operator: "",
    status: "vazio",
    fillLevel: 0,
    updatedAt: new Date().toISOString()
  },
  {
    id: "BR-06",
    name: "BR 06",
    capacity: 500,
    description: "Fase de crescimento mitótico",
    productName: "Dual Force",
    inoculationTime: "04:30",
    transferTime: "20:00",
    releaseTime: "--:--",
    operator: "Jean-Pierre",
    status: "andamento",
    fillLevel: 45,
    updatedAt: new Date().toISOString()
  },
  {
    id: "BR-07",
    name: "BR 07",
    capacity: 500,
    description: "Alimentação de Glicose e Fed-Batch",
    productName: "Premier",
    inoculationTime: "02:00",
    transferTime: "18:00",
    releaseTime: "19:30",
    operator: "Aline Santos",
    status: "andamento",
    fillLevel: 80,
    updatedAt: new Date().toISOString()
  },
  {
    id: "BR-08",
    name: "BR 08",
    capacity: 500,
    description: "Higienização e Enxágue Estéril",
    productName: "Dual Azo",
    inoculationTime: "--:--",
    transferTime: "--:--",
    releaseTime: "15:00",
    operator: "Roberto Dias",
    status: "aguardando",
    fillLevel: 15,
    updatedAt: new Date().toISOString()
  },
  {
    id: "BR-09",
    name: "BR 09",
    capacity: 500,
    description: "",
    productName: "",
    inoculationTime: "",
    transferTime: "",
    releaseTime: "",
    operator: "",
    status: "vazio",
    fillLevel: 0,
    updatedAt: new Date().toISOString()
  },
  {
    id: "BR-10",
    name: "BR 10",
    capacity: 500,
    description: "",
    productName: "",
    inoculationTime: "",
    transferTime: "",
    releaseTime: "",
    operator: "",
    status: "vazio",
    fillLevel: 0,
    updatedAt: new Date().toISOString()
  },
  {
    id: "BR-11",
    name: "BR 11",
    capacity: 5000,
    description: "Segunda fase de atenuação bioativa",
    productName: "Dual Force",
    inoculationTime: "06:00",
    transferTime: "19:00",
    releaseTime: "--:--",
    operator: "Daniela Costa",
    status: "andamento",
    fillLevel: 50,
    updatedAt: new Date().toISOString()
  },
  {
    id: "BR-12",
    name: "BR 12",
    capacity: 5000,
    description: "",
    productName: "",
    inoculationTime: "",
    transferTime: "",
    releaseTime: "",
    operator: "",
    status: "vazio",
    fillLevel: 0,
    updatedAt: new Date().toISOString()
  },
  {
    id: "BR-13",
    name: "BR 13",
    capacity: 5000,
    description: "",
    productName: "",
    inoculationTime: "",
    transferTime: "",
    releaseTime: "",
    operator: "",
    status: "vazio",
    fillLevel: 0,
    updatedAt: new Date().toISOString()
  },
  {
    id: "BR-14",
    name: "BR 14",
    capacity: 5000,
    description: "",
    productName: "",
    inoculationTime: "",
    transferTime: "",
    releaseTime: "",
    operator: "",
    status: "vazio",
    fillLevel: 0,
    updatedAt: new Date().toISOString()
  },
  {
    id: "BR-15",
    name: "BR 15",
    capacity: 3000,
    description: "Termofilia finalizada, aguarda liberação",
    productName: "Soja",
    inoculationTime: "05:00",
    transferTime: "13:00",
    releaseTime: "14:15",
    operator: "Patrícia Melo",
    status: "concluido",
    fillLevel: 100,
    updatedAt: new Date().toISOString()
  },
  {
    id: "BR-16",
    name: "BR 16",
    capacity: 3000,
    description: "",
    productName: "",
    inoculationTime: "",
    transferTime: "",
    releaseTime: "",
    operator: "",
    status: "vazio",
    fillLevel: 0,
    updatedAt: new Date().toISOString()
  }
];

export const initialWhiteboard: string = 
  "=== PASSAGEM DE TURNO - PLANTA DE FORMULAÇÃO ===\n\n" +
  "• Turno Atual (A): Planta está operando conforme cronograma semanal.\n\n" +
  "• Lembretes Importantes:\n" +
  "  1. Verificar calibração de pH no BR 07 antes da injeção de gliconatos.\n" +
  "  2. Reator BR 15 (Soja Premium) concluído e liberado para envase. Providenciar mangueiras sanitárias esterilizadas.\n" +
  "  3. Limpeza CIP no BR 08 deve terminar por volta das 15:00. Supervisor do Turno B deve validar o analítico de condutividade pós-enxágue.\n\n" +
  "• Notas Regulatórias:\n" +
  "  - Manter registro de temperatura de jaqueta a cada hora na planilha estéril física.";
