/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Bioreactor, BioreactorStatus } from './types';
import { BioreactorCard } from './components/BioreactorCard';
import { BioreactorModal } from './components/BioreactorModal';
import { ProductDashboard } from './components/ProductDashboard';
import { Whiteboard } from './components/Whiteboard';
import { initialBioreactors, initialWhiteboard } from './initialData';
import { db, isFirebaseConfigured, handleFirestoreError, OperationType } from './firebase';
import { doc, collection, onSnapshot, setDoc, getDocs, writeBatch } from 'firebase/firestore';
import {
  Database,
  CloudLightning,
  Activity,
  FileText,
  Clock,
  Search,
  Filter,
  CheckCircle,
  HelpCircle,
  Bot,
  AlertTriangle,
  Flame,
  LayoutDashboard,
  Cpu,
  ShieldAlert,
  Wifi,
  User
} from 'lucide-react';

export default function App() {
  // Main Bioreactors State
  const [bioreactors, setBioreactors] = useState<Bioreactor[]>([]);
  // Whiteboard Content State
  const [whiteboardText, setWhiteboardText] = useState('');
  const [whiteboardAuthor, setWhiteboardAuthor] = useState('Operador de Turno');
  // Manager Notes State
  const initialManagerNotes = '1. Diretriz Semanal: Priorizar esterilização CIP nos reatores de 5000L.\n2. Auditoria CGMP agendada para quinta-feira.\n3. Manter calibração de pH e OD rigorosamente atualizada.';
  const [managerNotesText, setManagerNotesText] = useState('');
  const [managerAuthor, setManagerAuthor] = useState('Gestão Industrial');
  // Shift Control Panel State
  const [shift, setShift] = useState('Turno A (Manhã: 06h - 14h)');
  const [supervisor, setSupervisor] = useState('Dra. Helena Rangel');

  // Interactive UI states
  const [activeTab, setActiveTab] = useState<'bioreactors' | 'whiteboard' | 'manager_notes'>('bioreactors');
  const [selectedBioreactor, setSelectedBioreactor] = useState<Bioreactor | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [systemTime, setSystemTime] = useState(new Date());

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCapacity, setFilterCapacity] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Firebase connection logging
  const [dbState, setDbState] = useState<'connected' | 'local'>('local');

  // Update real-time clock
  useEffect(() => {
    const timer = setInterval(() => {
      setSystemTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync / Initialization logic: Firestore Realtime vs LocalStorage Fallback
  useEffect(() => {
    if (isFirebaseConfigured && db) {
      setDbState('connected');
      
      const seedDatabaseIfEmpty = async () => {
        try {
          const snapshot = await getDocs(collection(db, 'bioreactors'));
          if (snapshot.empty) {
            console.log("Banco de dados vazio detectado. Semeando dados iniciais dos biorreatores...");
            const batch = writeBatch(db);
            
            // Seed 16 initial bioreactors
            initialBioreactors.forEach((reactor) => {
              const docRef = doc(db, 'bioreactors', reactor.id);
              batch.set(docRef, reactor);
            });
            
            // Seed whiteboard global note
            const whiteboardRef = doc(db, 'whiteboard', 'global');
            batch.set(whiteboardRef, {
              id: 'global',
              content: initialWhiteboard,
              updatedBy: 'Supervisor Helena',
              updatedAt: new Date().toISOString()
            });

            // Seed production meta shift data
            const shiftRef = doc(db, 'meta', 'shift');
            batch.set(shiftRef, {
              shift: 'Turno A (Manhã: 06h - 14h)',
              supervisor: 'Dra. Helena Rangel',
              updatedAt: new Date().toISOString()
            });

            await batch.commit();
            console.log("Banco de dados semeado com sucesso!");
          }
        } catch (error) {
          console.error("Erro ao semear banco de dados:", error);
        }
      };

      seedDatabaseIfEmpty();

      // Listen to bioreactors sub-collection real-time snapshots
      const unsubscribeBioreactors = onSnapshot(collection(db, 'bioreactors'), (snapshot) => {
        const items: Bioreactor[] = [];
        snapshot.forEach((d) => {
          items.push(d.data() as Bioreactor);
        });
        // Sort BR-01 to BR-16
        items.sort((a, b) => a.id.localeCompare(b.id));
        if (items.length > 0) {
          setBioreactors(items);
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'bioreactors');
      });

      // Listen to whiteboard global document
      const unsubscribeWhiteboard = onSnapshot(doc(db, 'whiteboard', 'global'), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setWhiteboardText(data.content || '');
          setWhiteboardAuthor(data.updatedBy || 'Operador de Turno');
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'whiteboard/global');
      });

      // Listen to manager notes document
      const unsubscribeManagerNotes = onSnapshot(doc(db, 'whiteboard', 'manager'), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setManagerNotesText(data.content || '');
          setManagerAuthor(data.updatedBy || 'Gestão Industrial');
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'whiteboard/manager');
      });

      // Listen to shift operational parameters
      const unsubscribeShift = onSnapshot(doc(db, 'meta', 'shift'), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setShift(data.shift || '');
          setSupervisor(data.supervisor || '');
        }
      });

      return () => {
        unsubscribeBioreactors();
        unsubscribeWhiteboard();
        unsubscribeManagerNotes();
        unsubscribeShift();
      };
    } else {
      // Local storage fallback path
      setDbState('local');
      console.log("Iniciando no modo local com localStorage.");

      // Check for cached bio data
      const cachedReactors = localStorage.getItem('bioreactors_data');
      if (cachedReactors) {
        setBioreactors(JSON.parse(cachedReactors));
      } else {
        setBioreactors(initialBioreactors);
        localStorage.setItem('bioreactors_data', JSON.stringify(initialBioreactors));
      }

      // Check for cached whiteboard
      const cachedWhiteboard = localStorage.getItem('whiteboard_data');
      const cachedWhiteboardAuthor = localStorage.getItem('whiteboard_author_data');
      if (cachedWhiteboard !== null) {
        setWhiteboardText(cachedWhiteboard);
        setWhiteboardAuthor(cachedWhiteboardAuthor || 'Operador Conectado');
      } else {
        setWhiteboardText(initialWhiteboard);
        setWhiteboardAuthor('Supervisor Helena');
        localStorage.setItem('whiteboard_data', initialWhiteboard);
        localStorage.setItem('whiteboard_author_data', 'Supervisor Helena');
      }

      // Check for cached manager notes
      const cachedManagerNotes = localStorage.getItem('manager_notes_data');
      const cachedManagerAuthor = localStorage.getItem('manager_author_data');
      if (cachedManagerNotes !== null) {
        setManagerNotesText(cachedManagerNotes);
        setManagerAuthor(cachedManagerAuthor || 'Gestão Industrial');
      } else {
        setManagerNotesText(initialManagerNotes);
        setManagerAuthor('Gestão Industrial');
        localStorage.setItem('manager_notes_data', initialManagerNotes);
        localStorage.setItem('manager_author_data', 'Gestão Industrial');
      }

      // Check for cached shift info
      const cachedShift = localStorage.getItem('shift_data');
      const cachedSupervisor = localStorage.getItem('supervisor_data');
      if (cachedShift) setShift(cachedShift);
      if (cachedSupervisor) setSupervisor(cachedSupervisor);

      // Listen for window storage changes so multi-tabs mirror instantly!
      const syncTabs = (e: StorageEvent) => {
        if (e.key === 'bioreactors_data' && e.newValue) {
          setBioreactors(JSON.parse(e.newValue));
        }
        if (e.key === 'whiteboard_data' && e.newValue !== null) {
          setWhiteboardText(e.newValue);
        }
        if (e.key === 'whiteboard_author_data' && e.newValue) {
          setWhiteboardAuthor(e.newValue);
        }
        if (e.key === 'manager_notes_data' && e.newValue !== null) {
          setManagerNotesText(e.newValue);
        }
        if (e.key === 'manager_author_data' && e.newValue) {
          setManagerAuthor(e.newValue);
        }
        if (e.key === 'shift_data' && e.newValue) {
          setShift(e.newValue);
        }
        if (e.key === 'supervisor_data' && e.newValue) {
          setSupervisor(e.newValue);
        }
      };

      window.addEventListener('storage', syncTabs);
      return () => window.removeEventListener('storage', syncTabs);
    }
  }, []);

  // Save changes to single station
  const handleSaveBioreactor = async (updated: Bioreactor) => {
    // Optimistic local update
    const nextList = bioreactors.map((r) => (r.id === updated.id ? updated : r));
    setBioreactors(nextList);
    localStorage.setItem('bioreactors_data', JSON.stringify(nextList));

    if (isFirebaseConfigured && db) {
      // Production Cloud Save
      try {
        await setDoc(doc(db, 'bioreactors', updated.id), updated, { merge: true });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `bioreactors/${updated.id}`);
      }
    }
  };

  // Save changes to Whiteboard
  const handleSaveWhiteboard = async (newText: string) => {
    setWhiteboardText(newText);
    localStorage.setItem('whiteboard_data', newText);
    localStorage.setItem('whiteboard_author_data', whiteboardAuthor);

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'whiteboard', 'global'), {
          id: 'global',
          content: newText,
          updatedBy: whiteboardAuthor,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'whiteboard/global');
      }
    }
  };

  // Turn metadata editing
  const handleUpdateShift = async (shiftName: string) => {
    setShift(shiftName);
    if (isFirebaseConfigured && db) {
      await setDoc(doc(db, 'meta', 'shift'), {
        shift: shiftName,
        supervisor,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } else {
      localStorage.setItem('shift_data', shiftName);
    }
  };

  const handleUpdateSupervisor = async (supervisorName: string) => {
    setSupervisor(supervisorName);
    setWhiteboardAuthor(supervisorName);
    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'meta', 'shift'), {
          shift,
          supervisor: supervisorName,
          updatedAt: new Date().toISOString()
        }, { merge: true });
        await setDoc(doc(db, 'whiteboard', 'global'), {
          updatedBy: supervisorName,
        }, { merge: true });
      } catch (err) {
        console.error('Erro ao atualizar supervisor:', err);
      }
    } else {
      localStorage.setItem('supervisor_data', supervisorName);
      localStorage.setItem('whiteboard_author_data', supervisorName);
    }
  };

  const updateWhiteboardAuthor = (authorName: string) => {
    setWhiteboardAuthor(authorName);
    setSupervisor(authorName);
    localStorage.setItem('whiteboard_author_data', authorName);
    localStorage.setItem('supervisor_data', authorName);
  };

  // Manager Notes Handlers
  const handleSaveManagerNotes = async (newText: string) => {
    setManagerNotesText(newText);
    localStorage.setItem('manager_notes_data', newText);
    localStorage.setItem('manager_author_data', managerAuthor);

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'whiteboard', 'manager'), {
          id: 'manager',
          content: newText,
          updatedBy: managerAuthor,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'whiteboard/manager');
      }
    }
  };

  const handleUpdateManagerAuthor = async (authorName: string) => {
    setManagerAuthor(authorName);
    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'whiteboard', 'manager'), {
          updatedBy: authorName,
        }, { merge: true });
      } catch (err) {
        console.error('Erro ao atualizar gestor:', err);
      }
    } else {
      localStorage.setItem('manager_author_data', authorName);
    }
  };

  const updateManagerAuthor = (authorName: string) => {
    setManagerAuthor(authorName);
    localStorage.setItem('manager_author_data', authorName);
  };

  // Advanced cycle demo simulators (for physical showcase verification)
  const handleRunSimulationStep = async () => {
    // Randomly updates or advances processes on bioreactors
    const advancedReactors = bioreactors.map((reactor) => {
      if (reactor.status === 'vazio') {
        const startProb = Math.random() < 0.2;
        if (startProb) {
          const products = ["Vacina FitoGard", "BioBacil Complex", "LactoStim Express", "Enzima BioNox-5"];
          const operators = ["Carlos Lima", "Satoshi Tanaka", "Maria Sousa", "Aline Santos", "Roberto Dias"];
          return {
            ...reactor,
            status: 'aguardando' as BioreactorStatus,
            productName: products[Math.floor(Math.random() * products.length)],
            description: "Aguardando Carga de Nutrientes",
            operator: operators[Math.floor(Math.random() * operators.length)],
            fillLevel: 10,
            inoculationTime: "Previsto: " + new Date(Date.now() + 1800000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            updatedAt: new Date().toISOString()
          };
        }
      } else if (reactor.status === 'aguardando') {
        const fillProb = Math.random() < 0.35;
        if (fillProb) {
          return {
            ...reactor,
            status: 'andamento' as BioreactorStatus,
            description: "Alimentação de meio em regime Fed-Batch",
            fillLevel: 45,
            transferTime: new Date(Date.now() + 7200000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            updatedAt: new Date().toISOString()
          };
        }
      } else if (reactor.status === 'andamento') {
        if (reactor.fillLevel < 100) {
          // Increment volume fermentation status dynamically
          const nextLevel = Math.min(100, reactor.fillLevel + Math.floor(Math.random() * 20) + 5);
          const isFinished = nextLevel >= 100;
          return {
            ...reactor,
            fillLevel: nextLevel,
            status: (isFinished ? 'concluido' : 'andamento') as BioreactorStatus,
            description: isFinished ? "Lote Finalizado. Pronto para colheita" : "Amostragem analítica de densidade celular",
            releaseTime: isFinished ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : reactor.releaseTime,
            updatedAt: new Date().toISOString()
          };
        }
      } else if (reactor.status === 'concluido') {
        const harvestProb = Math.random() < 0.25;
        if (harvestProb) {
          return {
            ...reactor,
            status: 'vazio' as BioreactorStatus,
            productName: "",
            description: "",
            operator: "",
            fillLevel: 0,
            inoculationTime: "",
            transferTime: "",
            releaseTime: "",
            updatedAt: new Date().toISOString()
          };
        }
      }
      return reactor;
    });

    setBioreactors(advancedReactors);
    if (!isFirebaseConfigured) {
      localStorage.setItem('bioreactors_data', JSON.stringify(advancedReactors));
    } else {
      // Commit batch
      const batch = writeBatch(db);
      advancedReactors.forEach((r) => {
        batch.set(doc(db, 'bioreactors', r.id), r);
      });
      await batch.commit();
    }
  };

  const handleResetSimulator = async () => {
    if (window.confirm("Deseja redefinir todo o painel de biorreatores para as fases padrão?")) {
      setBioreactors(initialBioreactors);
      setWhiteboardText(initialWhiteboard);
      setWhiteboardAuthor('Supervisor Helena');
      setShift('Turno A (Manhã: 06h - 14h)');
      setSupervisor('Dra. Helena Rangel');

      if (!isFirebaseConfigured) {
        localStorage.setItem('bioreactors_data', JSON.stringify(initialBioreactors));
        localStorage.setItem('whiteboard_data', initialWhiteboard);
        localStorage.setItem('whiteboard_author_data', 'Supervisor Helena');
        localStorage.setItem('shift_data', 'Turno A (Manhã: 06h - 14h)');
        localStorage.setItem('supervisor_data', 'Dra. Helena Rangel');
      } else {
        const batch = writeBatch(db);
        initialBioreactors.forEach((reactor) => {
          batch.set(doc(db, 'bioreactors', reactor.id), reactor);
        });
        batch.set(doc(db, 'whiteboard', 'global'), {
          id: 'global',
          content: initialWhiteboard,
          updatedBy: 'Supervisor Helena',
          updatedAt: new Date().toISOString()
        });
        batch.set(doc(db, 'meta', 'shift'), {
          shift: 'Turno A (Manhã: 06h - 14h)',
          supervisor: 'Dra. Helena Rangel',
          updatedAt: new Date().toISOString()
        });
        await batch.commit();
      }
    }
  };

  // Formulate filtered and searched list
  const filteredBioreactors = bioreactors.filter((reactor) => {
    // Search filter matching
    const matchesSearch =
      reactor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reactor.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reactor.operator.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (reactor.description && reactor.description.toLowerCase().includes(searchTerm.toLowerCase()));

    // Capacity matching
    const matchesCapacity = filterCapacity === 'all' || reactor.capacity === parseInt(filterCapacity);

    // Status matching
    const matchesStatus = filterStatus === 'all' || reactor.status === filterStatus;

    return matchesSearch && matchesCapacity && matchesStatus;
  });

  // Calculate dynamic statistics
  const bioreactorCount = bioreactors.length;
  const inProcessCount = bioreactors.filter((r) => r.status === 'andamento').length;
  const completedCount = bioreactors.filter((r) => r.status === 'concluido').length;
  const standbyCount = bioreactors.filter((r) => r.status === 'vazio' || r.status === 'aguardando').length;
  
  const totalVolumeInProcess = bioreactors.reduce((acc, r) => {
    if (r.status === 'andamento' || r.status === 'concluido') {
      return acc + Math.round((r.capacity * r.fillLevel) / 100);
    }
    return acc;
  }, 0);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-150 font-sans p-4 md:p-8 flex flex-col justify-between selection:bg-zinc-700 selection:text-white selection:bg-opacity-50">
      
      {/* 1. TOP HEADER PANEL / CONSOLE PANEL */}
      <header 
        className="w-full rounded-xl border border-zinc-700 p-4 mb-6 flex flex-col lg:flex-row items-center justify-between gap-4"
        style={{
          boxShadow: '0 4px 20px rgba(0,0,0,0.4), inset 0 1px 2px rgba(255,255,255,0.05)',
          backgroundImage: 'radial-gradient(circle at 50% 120%, #1e293b 0%, #0f172a 100%)'
        }}
      >
        
        {/* Left Side: Brand label, real-time sync status and title */}
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-gradient-to-br from-zinc-200 to-zinc-400 border border-zinc-500 rounded-lg shadow-md flex items-center justify-center">
            <Cpu className="w-6 h-6 text-slate-900 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 border border-cyan-800 rounded-sm">
                Planta Líder
              </span>
              <span 
                className={`inline-flex items-center gap-1.5 text-[10px] font-mono font-black px-2.5 py-0.5 rounded-full border tracking-wider uppercase ${
                  dbState === 'connected'
                    ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                    : 'bg-amber-950/90 text-amber-300 border-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.3)]'
                }`}
                title={dbState === 'connected' ? 'Conectado ao Firebase: Todas as alterações são sincronizadas em tempo real em todas as telas da fábrica!' : 'Modo local no navegador'}
              >
                <span className={`w-2 h-2 rounded-full ${dbState === 'connected' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                {dbState === 'connected' ? 'TEMPO REAL ONLINE' : 'MODO LOCAL'}
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold text-zinc-100 tracking-tight">
              Programação Diária de Biorreatores
            </h1>
          </div>
        </div>

        {/* Right Side: Shift Info + Digital System Hour Clock */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="font-mono text-xs text-zinc-300 bg-zinc-950/80 px-3.5 py-2 rounded-lg border border-zinc-800 shadow-inner flex flex-col justify-center">
            <div className="text-[9px] uppercase font-bold text-zinc-500 flex items-center gap-1">
              <User className="w-3 h-3 text-zinc-400" />
              Turno & Supervisor
            </div>
            <div className="text-xs font-bold text-zinc-200 mt-0.5 truncate max-w-[240px]">
              {shift.split('(')[0].trim() || 'Turno A'} • <span className="text-cyan-400">{supervisor || 'Não atribuído'}</span>
            </div>
          </div>

          <div className="font-mono text-xs text-zinc-400 bg-zinc-950/80 p-2.5 rounded-lg border border-zinc-800 text-center shadow-inner">
            <div className="text-[9px] uppercase font-bold text-zinc-550 flex items-center justify-center gap-1">
              <Clock className="w-3 h-3" />
              Relógio do Sistema
            </div>
            <div className="text-sm font-bold tracking-wider text-lime-400 mt-1">
              {systemTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
          </div>
        </div>

      </header>

      {/* NAV TABS SELECTOR */}
      <nav className="w-full flex items-center gap-3 mb-6 border-b border-zinc-800 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('bioreactors')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-extrabold text-sm uppercase tracking-wider transition cursor-pointer shrink-0 ${
            activeTab === 'bioreactors'
              ? 'bg-zinc-800 text-lime-400 border border-zinc-700 shadow-md'
              : 'bg-zinc-950 text-zinc-400 hover:text-white hover:bg-zinc-900 border border-zinc-800'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>Matriz de Biorreatores ({bioreactorCount})</span>
        </button>

        {/* Quadro de Avisos (Turno) */}
        <button
          onClick={() => setActiveTab('whiteboard')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-extrabold text-sm uppercase tracking-wider transition cursor-pointer relative shrink-0 ${
            whiteboardText && whiteboardText.trim().length > 0
              ? activeTab === 'whiteboard'
                ? 'bg-amber-400 text-zinc-950 border border-amber-300 shadow-lg shadow-amber-500/20 ring-2 ring-amber-400/30'
                : 'bg-amber-950/80 text-amber-300 border border-amber-600/80 hover:bg-amber-900/90 hover:text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
              : activeTab === 'whiteboard'
                ? 'bg-zinc-800 text-zinc-300 border border-zinc-700 shadow-md'
                : 'bg-zinc-950/60 text-zinc-600 border border-zinc-850 hover:text-zinc-400 hover:bg-zinc-900 opacity-60'
          }`}
        >
          <FileText className={`w-5 h-5 ${whiteboardText && whiteboardText.trim().length > 0 ? (activeTab === 'whiteboard' ? 'text-zinc-950' : 'text-amber-400') : 'text-zinc-500'}`} />
          <span>Quadro de Avisos</span>
          {whiteboardText && whiteboardText.trim().length > 0 ? (
            <span className={`px-2 py-0.5 text-xs font-mono font-black rounded-full ${
              activeTab === 'whiteboard' ? 'bg-zinc-950 text-amber-400' : 'bg-amber-400 text-zinc-950 animate-pulse'
            }`}>
              COM ANOTAÇÃO
            </span>
          ) : (
            <span className="text-xs font-mono text-zinc-600 font-normal ml-1">(Vazio)</span>
          )}
        </button>

        {/* Avisos do Gestor */}
        <button
          onClick={() => setActiveTab('manager_notes')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-extrabold text-sm uppercase tracking-wider transition cursor-pointer relative shrink-0 ${
            managerNotesText && managerNotesText.trim().length > 0
              ? activeTab === 'manager_notes'
                ? 'bg-indigo-500 text-white border border-indigo-400 shadow-lg shadow-indigo-500/20 ring-2 ring-indigo-400/30'
                : 'bg-indigo-950/80 text-indigo-300 border border-indigo-600/80 hover:bg-indigo-900/90 hover:text-indigo-200 shadow-[0_0_12px_rgba(99,102,241,0.25)]'
              : activeTab === 'manager_notes'
                ? 'bg-zinc-800 text-zinc-300 border border-zinc-700 shadow-md'
                : 'bg-zinc-950/60 text-zinc-600 border border-zinc-850 hover:text-zinc-400 hover:bg-zinc-900 opacity-60'
          }`}
        >
          <ShieldAlert className={`w-5 h-5 ${managerNotesText && managerNotesText.trim().length > 0 ? (activeTab === 'manager_notes' ? 'text-white' : 'text-indigo-400') : 'text-zinc-500'}`} />
          <span>Avisos do Gestor</span>
          {managerNotesText && managerNotesText.trim().length > 0 ? (
            <span className={`px-2 py-0.5 text-xs font-mono font-black rounded-full ${
              activeTab === 'manager_notes' ? 'bg-zinc-950 text-indigo-300' : 'bg-indigo-400 text-zinc-950 animate-pulse'
            }`}>
              COM DIRETRIZ
            </span>
          ) : (
            <span className="text-xs font-mono text-zinc-600 font-normal ml-1">(Vazio)</span>
          )}
        </button>
      </nav>

      {activeTab === 'bioreactors' && (
        <>
          {/* 2. UNIFIED WORKSTATION & PRODUCT DASHBOARD */}
          <ProductDashboard
            bioreactors={bioreactors}
            totalVolumeInProcess={totalVolumeInProcess}
            inProcessCount={inProcessCount}
            completedCount={completedCount}
            standbyCount={standbyCount}
            activeFilter={searchTerm}
            onSelectProductFilter={(prodName) => {
              setSearchTerm((prev) => (prev.toLowerCase().trim() === prodName.toLowerCase().trim() ? '' : prodName));
            }}
          />

          {/* 3. SHIELD CONTROL: SEARCH BAR, CAPACITIES AND STATUS FILTERING */}
          <section className="w-full rounded-xl bg-zinc-950/80 p-4 mb-6 border border-zinc-800 flex flex-col md:flex-row gap-4 items-center justify-between shadow-inner">
            
            {/* Left: Input Text Search */}
            <div className="relative w-full md:max-w-md">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5">
                <Search className="w-4 h-4 text-zinc-400" />
              </span>
              <input
                type="text"
                placeholder="Filtrar por produto, operador, número ou mnemônico..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 font-sans text-sm bg-zinc-900 border border-zinc-750 rounded-xl text-white focus:outline-none focus:border-zinc-500 placeholder:text-zinc-500"
              />
            </div>

            {/* Right: Select Matrix Category Filters */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {/* Capacity Filter */}
              <div className="flex items-center space-x-2 bg-zinc-900 px-3.5 py-2 rounded-xl border border-zinc-750">
                <Filter className="w-4 h-4 text-zinc-400" />
                <select
                  value={filterCapacity}
                  onChange={(e) => setFilterCapacity(e.target.value)}
                  className="bg-transparent border-none text-sm font-medium text-white focus:outline-none cursor-pointer"
                >
                  <option value="all" className="bg-zinc-900 text-white">Vol: Todos</option>
                  <option value="100" className="bg-zinc-900 text-white">100 Litros</option>
                  <option value="500" className="bg-zinc-900 text-white">500 Litros</option>
                  <option value="3000" className="bg-zinc-900 text-white">3.000 Litros</option>
                  <option value="5000" className="bg-zinc-900 text-white">5.000 Litros</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center space-x-2 bg-zinc-900 px-3.5 py-2 rounded-xl border border-zinc-750">
                <Activity className="w-4 h-4 text-zinc-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-transparent border-none text-sm font-medium text-white focus:outline-none cursor-pointer"
                >
                  <option value="all" className="bg-zinc-900 text-white">Status: Todos</option>
                  <option value="vazio" className="bg-zinc-900 text-white">Fase: Vazio</option>
                  <option value="aguardando" className="bg-zinc-900 text-white">Fase: Em preparo</option>
                  <option value="andamento" className="bg-zinc-900 text-white">Fase: Em cultivo</option>
                  <option value="concluido" className="bg-zinc-900 text-white">Fase: Liberado p/ envase</option>
                </select>
              </div>

              {/* Simulator Actions trigger */}
              <div className="flex space-x-2 shrink-0">
                <button
                  onClick={handleResetSimulator}
                  className="px-3.5 py-2 bg-zinc-950 hover:bg-zinc-900 text-zinc-400 font-mono text-xs uppercase font-bold tracking-wider rounded-xl border border-zinc-800 transition cursor-pointer"
                  title="Redefine o status de todos os 16 reatores para o modelo inicial básico"
                >
                  Resetar Painel
                </button>
              </div>
            </div>

          </section>

          {/* 4. MAIN WORKSPACE / REACTOR GRID */}
          <main className="w-full flex-1 mb-8">
            
            {/* Render Bioreactor grid match result summary counter */}
            <div className="flex justify-between items-center text-sm font-mono text-zinc-400 mb-5 px-1">
              <span className="font-bold">MATRIZ INDUSTRIAL (16 POSTOS ATIVOS)</span>
              <span>Exibindo: <strong className="text-zinc-100 font-black">{filteredBioreactors.length}</strong> de <strong className="text-cyan-400 font-black">{bioreactorCount}</strong> biorreatores</span>
            </div>

            {filteredBioreactors.length > 0 ? (
              <div className="space-y-12">
                {[100, 500, 3000, 5000].map((capacity) => {
                  const reactorsOfCapacity = filteredBioreactors.filter(r => r.capacity === capacity);
                  if (reactorsOfCapacity.length === 0) return null;

                  return (
                    <div key={capacity} className="space-y-5">
                      {/* Row Header with capacity badge and steel background accent */}
                      <div className="flex items-center space-x-3 border-b border-zinc-800 pb-3">
                        <div className="px-3.5 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-lime-400 font-mono text-sm font-black tracking-wider">
                          {capacity.toLocaleString()} Litros
                        </div>
                        <span className="text-sm text-zinc-300 font-mono font-medium">
                          {capacity === 100 && "Estações de Pré-Inoculação (BR 01 ao BR 05)"}
                          {capacity === 500 && "Estações de Fermentação Piloto (BR 06 ao BR 10)"}
                          {capacity === 3000 && "Estações de Produção Intermediária (BR 15 e BR 16)"}
                          {capacity === 5000 && "Estações de Alta Capacidade Geral (BR 11 ao BR 14)"}
                        </span>
                      </div>

                      {/* Horizontal aligned reactor list with larger cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
                        {reactorsOfCapacity.map((reactor) => (
                          <BioreactorCard
                            key={reactor.id}
                            bioreactor={reactor}
                            onClick={() => {
                              setSelectedBioreactor(reactor);
                              setIsModalOpen(true);
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 p-8 rounded-xl border border-zinc-800 bg-zinc-950/40 text-center space-y-3">
                <AlertTriangle className="w-12 h-12 text-zinc-600" />
                <p className="text-sm text-zinc-300 font-bold">Nenhum biorreator corresponde aos filtros de seleção selecionados.</p>
                <p className="text-xs text-zinc-500">Tente buscar por termos mais genéricos ou desmarque filtros de capacidade.</p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterCapacity('all');
                    setFilterStatus('all');
                  }}
                  className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-750 text-white font-semibold text-xs rounded-lg mt-2 transition"
                >
                  Ver Todos Reatores
                </button>
              </div>
            )}

          </main>
        </>
      )}

      {/* 5. DEDICATED WHITEBOARD TAB VIEW (TURNO) */}
      {activeTab === 'whiteboard' && (
        <main className="w-full flex-1 mb-8 mt-2 min-h-[550px]">
          <Whiteboard
            title="Quadro de Avisos & Passagem de Turno"
            subtitle="RELIABILIDADE OPERACIONAL • ATUALIZAÇÃO EM TEMPO REAL"
            headerBadgeBg="bg-red-600 border-red-700"
            placeholder="Digite aqui as anotações do dia, recomendações CGMP, observações de lotes, pendências de calibração ou avisos operacionais urgentes..."
            emptyText="Quadro vazio. Clique em Editar para inserir anotações de passagem de turno."
            content={whiteboardText}
            onSave={handleSaveWhiteboard}
            updatedBy={whiteboardAuthor}
            onUpdateUser={updateWhiteboardAuthor}
            shift={shift}
            onUpdateShift={handleUpdateShift}
            supervisor={supervisor}
            onUpdateSupervisor={handleUpdateSupervisor}
          />
        </main>
      )}

      {/* 5. DEDICATED MANAGER NOTES TAB VIEW */}
      {activeTab === 'manager_notes' && (
        <main className="w-full flex-1 mb-8 mt-2 min-h-[550px]">
          <Whiteboard
            title="Avisos do Gestor & Diretrizes Estratégicas"
            subtitle="DIRETRIZES DA GERÊNCIA • ORIENTAÇÕES E METAS DE PRODUÇÃO"
            headerBadgeBg="bg-indigo-600 border-indigo-700"
            placeholder="Digite aqui os avisos da gestão, metas da semana, recomendações de auditoria ou diretrizes operacionais prioritárias..."
            emptyText="Nenhum aviso registrado pela gestão no momento. Clique em Editar para cadastrar novas diretrizes."
            content={managerNotesText}
            onSave={handleSaveManagerNotes}
            updatedBy={managerAuthor}
            onUpdateUser={updateManagerAuthor}
            supervisor={managerAuthor}
            onUpdateSupervisor={handleUpdateManagerAuthor}
          />
        </main>
      )}

      {/* 6. COMPLIANCE FOOTER SIGNATURE */}
      <footer className="w-full border-t border-zinc-800 pt-4 pb-2 text-center text-xs text-zinc-500 font-mono">
        <p>© 2026 Planta de Formulação Biológica S.A. Todos os direitos reservados. Interface em conformidade com ISO 13485 e FDA 21 CFR Part 11.</p>
        <p className="text-[10px] text-zinc-650 mt-1">Concebido sob o layout Aço Inox Industrial Clean para uso em monitores de toque e terminais HMI de chão de fábrica.</p>
      </footer>

      {/* 7. FORMULATION MODAL FORM */}
      <BioreactorModal
        bioreactor={selectedBioreactor}
        isOpen={isModalOpen}
        onClose={() => {
          setSelectedBioreactor(null);
          setIsModalOpen(false);
        }}
        onSave={handleSaveBioreactor}
      />

    </div>
  );
}
