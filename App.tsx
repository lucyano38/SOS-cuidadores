import React, { useState, useEffect, ReactNode, ErrorInfo } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link, Outlet, useNavigate, useLocation } from 'react-router-dom';

/**
 * ==========================================================================================
 * SOS CUIDADORES BRASIL - VERSÃO 83 (A EDIÇÃO TITÂNIO TS - PAYWALL ATIVO)
 * ==========================================================================================
 * Data de Compilação: 04 de Abril de 2026
 * Mestre Idealizador: Luciano (Master Admin)
 * Desenvolvedor/Engenheiro: Gemini
 * ATUALIZAÇÃO: Refatoração completa para TypeScript (.tsx) com interfaces rigorosas.
 * ==========================================================================================
 */

// ------------------------------------------------------------------------------------------
// 1. CONFIGURAÇÃO E INICIALIZAÇÃO FIREBASE
// ------------------------------------------------------------------------------------------
import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, collection, doc, setDoc, onSnapshot, updateDoc, 
  addDoc, query, orderBy, limit, getDocFromServer, deleteDoc,
  FirestoreError
} from "firebase/firestore";
import { 
  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, 
  onAuthStateChanged, signOut, signInAnonymously, RecaptchaVerifier, 
  linkWithPhoneNumber, User as FirebaseAuthUser, ConfirmationResult
} from "firebase/auth";

// Configuração Oficial do Firebase (Lucyano)
const firebaseConfig = {
  apiKey: "AIzaSyBXpHrp7JURp2XDGtWvBZ9-KqRd5EIFln8",
  authDomain: "appcuidador-23628.firebaseapp.com",
  databaseURL: "https://appcuidador-23628-default-rtdb.firebaseio.com",
  projectId: "appcuidador-23628",
  storageBucket: "appcuidador-23628.firebasestorage.app",
  messagingSenderId: "240342026700",
  appId: "1:240342026700:web:69321c2ed49faecb1f3569",
  measurementId: "G-J3QMHV9V8V"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const fs = getFirestore(app); 
const auth = getAuth(app);    

// ------------------------------------------------------------------------------------------
// 2. TIPAGENS (INTERFACES TYPESCRIPT)
// ------------------------------------------------------------------------------------------
export interface UserData {
  id: string;
  uid?: string;
  nome?: string;
  email?: string;
  whatsapp?: string;
  cidade?: string;
  endereco?: string;
  localizacao?: string;
  localidade?: string;
  city?: string;
  address?: string;
  uf?: string;
  estado?: string;
  biografia?: string;
  descricao?: string;
  especialidades?: string[];
  tipo?: 'cuidador' | 'paciente' | string;
  premium?: boolean;
  identidadeVerificada?: boolean;
  celularVerificado?: boolean;
  fotoPerfil?: string;
  fotoDocumento?: string;
  documentoEnviado?: boolean;
  documentoAprovadoEm?: string;
  rating?: number;
  totalRatings?: number;
  [key: string]: any; 
}

export interface VagaData {
  id: string;
  uid?: string;
  titulo?: string;
  cidade?: string;
  desc?: string;
  autor?: string;
  whatsapp?: string;
  date?: string;
  ts?: number;
  [key: string]: any;
}

// ------------------------------------------------------------------------------------------
// 3. CONSTANTES MESTRES E LISTAS DE ESPECIALIDADES TÉCNICAS
// ------------------------------------------------------------------------------------------
const ADMIN_EMAILS: string[] = [
  "lucyano.pci@gmail.com",
  "geyson.sele@gmail.com" 
];

const LISTA_ESPECIALIDADES: string[] = [
  "Banho no Leito Profissional", "Troca de Fraldas e Higiene Íntima", "Curativos Simples e Pós-Op",
  "Curativos Complexos (Escaras Nível 3 e 4)", "Administração de Remédios Via Oral", "Acompanhamento Hospitalar 24h",
  "Cuidado com Idosos (Alzheimer/Demência)", "Cuidado Pediátrico Especializado", "Pós-Operatório Cirúrgico Geriátrico", 
  "Cozinha Adaptada (Dietas Enterais e Pastosas)", "Mobilidade Física e Transferência de Leito", "Monitoramento de Sinais Vitais (PA, SpO2)",
  "Higiene Pessoal, Cabelo e Conforto", "Prevenção de Quedas e Adaptação de Ambiente", "Acompanhamento em Consultas e Exames Externos",
  "Cuidado com Sondas (GTT / Gastrostomia)", "Reabilitação Motora Básica e Alongamentos", "Companhia, Lazer e Estímulo Cognitivo",
  "Cuidados Paliativos e Alívio de Dor Oncológica", "Gestão de Escaras (LPP - Grau I a IV)", "Monitoramento de Glicemia Capilar e Insulina",
  "Aspiração de Vias Aéreas Superiores", "Oxigenoterapia e Manuseio de Cilindros/Concentradores", "Cuidados com Ostomias (Colostomia/Ileostomia)",
  "Sondagem Vesical de Alívio (SVA)", "Sondagem Nasoenteral (Passagem e Fixação)", "Traqueostomia (Limpeza e Troca de Fixador)", "Diálise Peritoneal Domiciliar"
];

// ------------------------------------------------------------------------------------------
// 4. UTILITÁRIOS DE BLINDAGEM TÉCNICA E PERFORMANCE (O MOTOR DO SISTEMA)
// ------------------------------------------------------------------------------------------

const OperationType = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  LIST: 'list',
  GET: 'get',
  WRITE: 'write',
};

function handleFirestoreError(error: any, operationType: string, path: string): never {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email || undefined,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    await getDocFromServer(doc(fs, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. The client is offline.");
    }
  }
}
testConnection();

const renderSafe = (val: any, fallback: string = ""): string => {
  if (val === null || val === undefined || val === '') return fallback;
  let finalStr = "";
  if (typeof val === 'object') {
    if (val.seconds) return new Date(val.seconds * 1000).toLocaleDateString('pt-BR');
    if (Array.isArray(val)) return val.join(', ');
    if (val.cidade && val.estado) return `${val.cidade} - ${val.estado}`;
    if (val.cidade) return val.cidade;
    try { finalStr = JSON.stringify(val); } catch(e) { return fallback; }
  } else {
    finalStr = String(val);
  }
  return finalStr.replace(/^["']|["']$/g, '').trim();
};

const getLoc = (u?: UserData | null): string => {
  if (!u) return "Localização não informada";
  const local = u.cidade || u.endereco || u.localizacao || u.localidade || u.city || u.address || u.uf || u.estado;
  if (typeof local === 'string' && local.includes('{') && local.includes('cidade')) {
    try {
      const parsedObj = JSON.parse(local);
      if (parsedObj.cidade && parsedObj.estado) return `${parsedObj.cidade} - ${parsedObj.estado}`;
      if (parsedObj.cidade) return parsedObj.cidade;
    } catch(e) {}
  }
  let safeLocal = renderSafe(local, "Localização não informada");
  return safeLocal.replace(/^["']|["']$/g, '').trim();
};

const compressImage = (file: File): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = (event) => {
    const img = new Image();
    img.src = event.target?.result as string;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 1200; 
      let scaleSize = 1;
      if (img.width > MAX_WIDTH) scaleSize = MAX_WIDTH / img.width;
      canvas.width = img.width * scaleSize;
      canvas.height = img.height * scaleSize;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.8)); 
      } else {
        reject(new Error("Canvas context not available"));
      }
    };
    img.onerror = (e) => reject(e);
  };
});

// ------------------------------------------------------------------------------------------
// 5. BIBLIOTECA DE ÍCONES (TypeScript Interfaces)
// ------------------------------------------------------------------------------------------
interface IconProps {
  filled?: boolean;
  onClick?: () => void;
  size?: number;
}

const IconStar: React.FC<IconProps> = ({ filled, onClick, size = 18 }) => (
  <svg onClick={onClick} style={{cursor: onClick ? 'pointer' : 'default', transition: 'all 0.2s ease'}} width={size} height={size} viewBox="0 0 24 24" fill={filled ? "#FFD700" : "none"} stroke={filled ? "#FFD700" : "#cbd5e0"} strokeWidth="2.5">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);
const IconHeart = () => <svg width="26" height="26" viewBox="0 0 24 24" fill="#007b80"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>;
const IconCheck = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="#25D366"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>;
const IconId = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#007b80" strokeWidth="2.5"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="12" cy="10" r="3"/><path d="M7 20c0-2.5 2.2-4.5 5-4.5s5 2 5 4.5"/></svg>;
const IconBack = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#007b80" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>;
const IconEdit = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4L18.5 2.5z"></path></svg>;
const IconVerify = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="m9 12 2 2 4-4"></path></svg>;
const IconPhone = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>;
const IconCamera = () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#007b80" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>;
const IconSearch = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

// ------------------------------------------------------------------------------------------
// 6. COMPONENTES DE INTERFACE (UI) & ERROR BOUNDARY
// ------------------------------------------------------------------------------------------

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorInfo: string;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorInfo: "" };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, errorInfo: error.message };
  }

  render() {
    if (this.state.hasError) {
      let displayMessage = "Ocorreu um erro inesperado. Por favor, recarregue a página.";
      try {
        const parsed = JSON.parse(this.state.errorInfo);
        if (parsed.error && parsed.error.includes("insufficient permissions")) {
          displayMessage = "Você não tem permissão para acessar estes dados. Verifique seu login.";
        }
      } catch (e) {}

      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
          <div className="bg-white p-8 rounded-3xl shadow-xl border border-rose-100 max-w-md text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-2xl font-black text-slate-900 mb-4 uppercase">Ops! Algo deu errado</h2>
            <p className="text-slate-600 mb-6">{displayMessage}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="w-full bg-[#007b80] text-white py-4 rounded-xl font-bold uppercase tracking-wider shadow-lg shadow-[#007b80]/20"
            >
              Recarregar Página
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ------------------------------------------------------------------------------------------
// 7. MODAIS GLOBAIS
// ------------------------------------------------------------------------------------------

interface RatingDisplayProps {
  rating?: number;
  total?: number;
}
const RatingDisplayPanel: React.FC<RatingDisplayProps> = ({ rating = 0, total = 0 }) => {
  const safeRating = Number(rating) || 0;
  const safeTotal = Number(total) || 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      {[1, 2, 3, 4, 5].map(n => (
        <IconStar key={n} filled={n <= Math.round(safeRating)} />
      ))}
      {safeTotal > 0 && <span style={{ fontSize: '14px', color: '#64748b', marginLeft: '10px', fontWeight: '900' }}>({safeTotal} avaliações)</span>}
      {safeTotal === 0 && <span style={{ fontSize: '13px', color: '#94a3b8', marginLeft: '10px', fontWeight: 'bold' }}>Novo</span>}
    </div>
  );
};

interface AvaliacaoModalProps {
  profissional: UserData;
  userAuth: FirebaseAuthUser | null;
  onClose: () => void;
}
const AvaliacaoModal: React.FC<AvaliacaoModalProps> = ({ profissional, userAuth, onClose }) => {
  const [notaEstrelas, setNotaEstrelas] = useState<number>(0);
  const [comentarioTexto, setComentarioTexto] = useState<string>('');
  const [loadingAvaliacao, setLoadingAvaliacao] = useState<boolean>(false);

  const handleSubmitAvaliacao = async () => {
    if (!userAuth || userAuth.isAnonymous) return alert("Você precisa estar logado com uma conta de família para avaliar.");
    if (notaEstrelas === 0) return alert("Por favor, selecione uma nota de 1 a 5 estrelas.");
    if (comentarioTexto.length < 10) return alert("Escreva um comentário com pelo menos 10 caracteres.");
    
    setLoadingAvaliacao(true);
    try {
      await addDoc(collection(fs, "usuarios", profissional.id, "avaliacoes"), {
        autorId: userAuth.uid,
        nota: notaEstrelas,
        texto: comentarioTexto,
        data: new Date().toISOString()
      });
      const totalAntigo = profissional.totalRatings || 0;
      const mediaAntiga = profissional.rating || 0;
      const novoTotal = totalAntigo + 1;
      const novaMedia = ((mediaAntiga * totalAntigo) + notaEstrelas) / novoTotal;
      await updateDoc(doc(fs, "usuarios", profissional.id), {
        rating: novaMedia,
        totalRatings: novoTotal
      });
      alert("✅ Avaliação registrada com sucesso!");
      onClose();
    } catch (error: any) {
      alert("Erro ao registrar avaliação: " + error.message);
    }
    setLoadingAvaliacao(false);
  };

  return (
    <div style={styles.modalOverlay}>
      <div style={{...styles.modalContent, maxWidth: '550px'}}>
        <h3 style={styles.modalTitle}>Avaliar Profissional</h3>
        <p style={{fontSize: 15, color: '#64748b', marginBottom: 25}}>Deixe seu depoimento sobre <strong>{renderSafe(profissional.nome)}</strong>.</p>
        <div style={{display: 'flex', justifyContent: 'center', gap: 15, marginBottom: 30}}>
          {[1, 2, 3, 4, 5].map(n => (
            <IconStar key={n} filled={n <= notaEstrelas} size={40} onClick={() => setNotaEstrelas(n)} />
          ))}
        </div>
        <div style={{textAlign: 'left'}}>
          <label style={styles.labelFormMaster}>SEU DEPOIMENTO</label>
          <textarea 
            style={{...styles.inputStyle, height: 120}} 
            placeholder="Como foi o atendimento?" 
            value={comentarioTexto} 
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setComentarioTexto(e.target.value)} 
          />
        </div>
        <div style={{display:'flex', gap: 15, marginTop: 20}}>
           <button style={{...styles.btnPrimary, flex: 2}} onClick={handleSubmitAvaliacao} disabled={loadingAvaliacao}>
             {loadingAvaliacao ? "SALVANDO..." : "ENVIAR AVALIAÇÃO"}
           </button>
           <button style={{...styles.btnOutline, flex: 1}} onClick={onClose}>CANCELAR</button>
        </div>
      </div>
    </div>
  );
};

interface UserSelfEditorModalProps {
  userData: UserData;
  onClose: () => void;
}
const UserSelfEditorModal: React.FC<UserSelfEditorModalProps> = ({ userData, onClose }) => {
  const [form, setForm] = useState<{
    nome: string;
    whatsapp: string;
    cidade: string;
    biografia: string;
    especialidades: string[];
  }>({
    nome: renderSafe(userData?.nome, ''),
    whatsapp: renderSafe(userData?.whatsapp, ''),
    cidade: getLoc(userData), 
    biografia: renderSafe(userData?.biografia || userData?.descricao, ''),
    especialidades: Array.isArray(userData?.especialidades) ? userData.especialidades : []
  });
  const [loading, setLoading] = useState<boolean>(false);

  const handleToggleEspecialidade = (esp: string) => {
    const newList = form.especialidades.includes(esp) 
      ? form.especialidades.filter((i: string) => i !== esp) 
      : [...form.especialidades, esp];
    setForm({...form, especialidades: newList});
  };

  const handleSaveSelf = async () => {
    if (!form.nome || form.nome.trim().length < 3) return alert("Erro: O Nome deve conter pelo menos 3 letras.");
    setLoading(true);
    try {
      await updateDoc(doc(fs, "usuarios", userData.id), { ...form });
      alert("✅ Perfil atualizado!");
      onClose();
    } catch (e) { alert("Erro ao salvar dados."); }
    setLoading(false);
  };

  return (
    <div style={styles.modalOverlay}>
      <div style={{...styles.modalContent, maxWidth: '600px'}}>
        <h3 style={styles.modalTitle}>Editar Meu Perfil</h3>
        <div style={{textAlign: 'left', maxHeight: '65vh', overflowY: 'auto', paddingRight: 10}}>
           <label style={styles.labelFormMaster}>NOME COMPLETO</label>
           <input style={styles.inputStyle} value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} />
           
           <label style={styles.labelFormMaster}>WHATSAPP</label>
           <input style={styles.inputStyle} value={form.whatsapp} onChange={e => setForm({...form, whatsapp: e.target.value})} type="tel" />
           
           <label style={styles.labelFormMaster}>CIDADE</label>
           <input style={styles.inputStyle} value={form.cidade} onChange={e => setForm({...form, cidade: e.target.value})} />
           
           <label style={styles.labelFormMaster}>BIOGRAFIA PROFISSIONAL</label>
           <textarea style={{...styles.inputStyle, height: 120}} value={form.biografia} onChange={e => setForm({...form, biografia: e.target.value})} placeholder="Conte um pouco sobre sua experiência..." />

           <label style={styles.labelFormMaster}>MINHAS ESPECIALIDADES</label>
           <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20}}>
              {LISTA_ESPECIALIDADES.map(es => {
                const isChecked = form.especialidades.includes(es);
                return (
                  <label key={es} style={{fontSize: 12, display: 'flex', alignItems: 'center', gap: 8, background: isChecked ? '#e6fffa' : '#f8fafc', padding: '10px', borderRadius: 12, border: '1px solid #e2e8f0', cursor: 'pointer'}}>
                    <input type="checkbox" checked={isChecked} onChange={() => handleToggleEspecialidade(es)} /> 
                    <span>{es}</span>
                  </label>
                )
              })}
           </div>
        </div>
        <div style={{display:'flex', gap: 15, marginTop: 30}}>
           <button style={{...styles.btnPrimary, flex: 2}} onClick={handleSaveSelf} disabled={loading}>{loading ? "GRAVANDO..." : "SALVAR ALTERAÇÕES"}</button>
           <button style={{...styles.btnOutline, flex: 1}} onClick={onClose}>CANCELAR</button>
        </div>
      </div>
    </div>
  );
};

interface MasterAdminGlobalEditorProps {
  userToEdit: UserData;
  onClose: () => void;
}
const MasterAdminGlobalEditor: React.FC<MasterAdminGlobalEditorProps> = ({ userToEdit, onClose }) => {
  const [form, setForm] = useState<Partial<UserData>>({ 
    ...userToEdit, 
    cidade: getLoc(userToEdit), 
    biografia: renderSafe(userToEdit?.biografia || userToEdit?.descricao, '') 
  });
  const [loading, setLoading] = useState<boolean>(false);

  const handleToggleMasterEspecialidade = (esp: string) => {
    const list = Array.isArray(form.especialidades) ? form.especialidades : [];
    const newList = list.includes(esp) ? list.filter(i => i !== esp) : [...list, esp];
    setForm({...form, especialidades: newList});
  };

  const handleSaveMasterEdits = async () => {
    if(!userToEdit.id) return;
    setLoading(true);
    try {
      await updateDoc(doc(fs, "usuarios", userToEdit.id), form);
      alert("✅ ATUALIZADO!");
      onClose();
    } catch (e) { alert("ERRO."); }
    setLoading(false);
  };

  return (
    <div style={styles.modalOverlay}>
      <div style={{...styles.modalContent, maxWidth: '680px'}}>
        <h3 style={{color: '#c53030', margin: '0 0 15px', fontSize: '26px', fontWeight: '900'}}>Painel Master</h3>
        <div style={{maxHeight: '60vh', overflowY: 'auto', textAlign: 'left', paddingRight: 10}}>
           <label style={styles.labelFormMaster}>NOME</label>
           <input style={styles.inputStyle} value={form.nome || ''} onChange={e => setForm({...form, nome: e.target.value})} />
           <label style={styles.labelFormMaster}>LOCALIZAÇÃO</label>
           <input style={styles.inputStyle} value={form.cidade || ''} onChange={e => setForm({...form, cidade: e.target.value})} />
           <label style={styles.labelFormMaster}>ESPECIALIDADES</label>
           <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 30}}>
              {LISTA_ESPECIALIDADES.map(es => {
                const isChecked = Array.isArray(form.especialidades) && form.especialidades.includes(es);
                return (
                  <label key={es} style={{fontSize: 11, display: 'flex', alignItems: 'center', gap: 8, background: isChecked ? '#e6fffa' : '#f8fafc', padding: '12px', borderRadius: 15, border: '1.5px solid #e2e8f0', cursor: 'pointer'}}>
                    <input type="checkbox" checked={isChecked} onChange={() => handleToggleMasterEspecialidade(es)} /> 
                    <span>{es}</span>
                  </label>
                )
              })}
           </div>
           <div style={{borderTop: '3px dashed #cbd5e0', paddingTop: 25, marginBottom: 30}}>
              <label style={styles.checkAdminItem}><input type="checkbox" checked={!!form.identidadeVerificada} onChange={e => setForm({...form, identidadeVerificada: e.target.checked})} /> IDENTIDADE VERIFICADA ✅</label>
              <label style={styles.checkAdminItem}><input type="checkbox" checked={!!form.celularVerificado} onChange={e => setForm({...form, celularVerificado: e.target.checked})} /> CELULAR VALIDADO 📱</label>
              <label style={styles.checkAdminItem}><input type="checkbox" checked={!!form.premium} onChange={e => setForm({...form, premium: e.target.checked})} /> PREMIUM ⭐</label>
           </div>
        </div>
        <button style={{...styles.btnPrimary, backgroundColor: '#c53030', marginTop: 15}} onClick={handleSaveMasterEdits} disabled={loading}>ATUALIZAR</button>
        <button style={styles.btnOutline} onClick={onClose}>CANCELAR</button>
      </div>
    </div>
  );
};

interface AdminDocumentApprovalModalProps {
  userDoc: UserData;
  onClose: () => void;
}
const AdminDocumentApprovalModal: React.FC<AdminDocumentApprovalModalProps> = ({ userDoc, onClose }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const handleAprovarRG = async () => {
    setLoading(true);
    try {
      await updateDoc(doc(fs, "usuarios", userDoc.id), { identidadeVerificada: true, documentoAprovadoEm: new Date().toLocaleDateString('pt-BR') });
      alert("✅ APROVADO!"); onClose();
    } catch (e) { alert("Erro."); }
    setLoading(false);
  };
  const handleReprovarRG = async () => {
    if(!window.confirm("Reprovar?")) return;
    setLoading(true);
    try {
      await updateDoc(doc(fs, "usuarios", userDoc.id), { documentoEnviado: false, fotoDocumento: null });
      alert("Reprovado."); onClose();
    } catch (e) { alert("Erro."); }
    setLoading(false);
  };
  return (
    <div style={styles.modalOverlay}>
      <div style={{...styles.modalContent, maxWidth: '750px', backgroundColor: '#1a202c', color: 'white'}}>
        <h3 style={{margin: '0 0 10px', fontSize: 28, fontWeight: '900'}}>Auditoria de Identidade</h3>
        <div style={{width: '100%', height: '420px', backgroundColor: '#000', borderRadius: 25, overflow: 'hidden', marginBottom: 35, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
          {userDoc.fotoDocumento ? <img src={userDoc.fotoDocumento} style={{maxWidth: '100%', maxHeight: '100%', objectFit: 'contain'}} alt="RG" /> : <p>Sem imagem.</p>}
        </div>
        <div style={{display: 'flex', gap: 15}}>
          <button style={{...styles.btnPrimary, backgroundColor: '#16a34a', flex: 2}} onClick={handleAprovarRG} disabled={loading}>APROVAR</button>
          <button style={{...styles.btnOutline, color: '#fc8181', borderColor: '#fc8181', flex: 1}} onClick={handleReprovarRG} disabled={loading}>REPROVAR</button>
        </div>
        <button style={{background: 'none', border: 'none', color: '#a0aec0', marginTop: 25, cursor: 'pointer'}} onClick={onClose}>FECHAR</button>
      </div>
    </div>
  );
};

// ------------------------------------------------------------------------------------------
// 8. PÁGINAS INSTITUCIONAIS
// ------------------------------------------------------------------------------------------

const InstitucionalSobrePage: React.FC = () => (
  <div className="max-w-4xl mx-auto px-6 py-12 text-left">
    <h1 className="text-4xl font-black text-slate-800 mb-8">Sobre o SOS Cuidadores Brasil</h1>
    
    <div className="prose prose-slate max-w-none space-y-8 text-slate-600 leading-relaxed">
      <p className="text-lg">
        O SOS Cuidadores Brasil não é apenas uma plataforma digital; é um compromisso cívico com a vida, 
        com a dignidade do paciente e com a valorização do profissional de saúde ao domicílio. Fundado por 
        Luciano e Geyson, o portal nasceu da observação diária das dificuldades das famílias em encontrar 
        cuidadores qualificados em momentos de angústia e alta vulnerabilidade.
      </p>
      
      <p>
        A nossa tecnologia foi desenhada para criar uma ponte segura e direta entre quem precisa de ajuda urgente 
        e quem tem a vocação, o treino e a técnica para cuidar de vidas humanas.
      </p>

      <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">A Nossa Filosofia Master de Curadoria</h2>
        <p className="mb-6">
          Diferente de murais de emprego genéricos que aceitam qualquer registo sem critério, o SOS Cuidadores Brasil 
          implementou a Auditoria Master Humana. Acreditamos que a tecnologia deve servir à segurança. Cada profissional 
          que exibe o Selo Verde de Identidade passou por uma verificação manual rigorosa dos seus documentos (RG/CNH), 
          garantindo à família contratante que a pessoa que baterá à sua porta está civilmente identificada.
        </p>
        
        <ul className="space-y-4">
          <li className="flex gap-3">
            <span className="text-[#007b80] font-bold">●</span>
            <span><strong>Confiança Auditada (Selo de Identidade):</strong> Verificação manual minuciosa de documentos de identidade, bloqueando perfis falsos.</span>
          </li>
          <li className="flex gap-3">
            <span className="text-[#007b80] font-bold">●</span>
            <span><strong>Comunicação Validada (Selo de SMS):</strong> Autenticação via SMS com tecnologia Google Firebase para garantir que o número de WhatsApp pertence a uma pessoa real.</span>
          </li>
          <li className="flex gap-3">
            <span className="text-[#007b80] font-bold">●</span>
            <span><strong>Histórico Transparente (Sistema de Avaliações):</strong> A prova social é a nossa maior moeda. Famílias reais avaliam o atendimento, permitindo que os melhores profissionais sejam destacados e reconhecidos publicamente.</span>
          </li>
        </ul>
      </div>

      <p className="font-semibold text-slate-800">
        Hoje, o SOS Cuidadores Brasil orgulha-se de ser a maior, mais segura e mais transparente vitrine nacional para o setor de Home Care e Cuidadores de Idosos.
      </p>

      <section className="pt-8 border-t border-slate-200">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">Contato e Suporte Oficial</h2>
        <p className="mb-6">
          No SOS Cuidadores Brasil, o nosso compromisso é garantir que a sua experiência na procura ou oferta de cuidados seja a melhor e mais segura possível. 
          Se precisar de ajuda com a sua conta, tiver dúvidas sobre a plataforma, ou quiser reportar alguma conduta inadequada de um utilizador, a nossa equipa de Administração Master está à sua inteira disposição.
        </p>
        
        <h3 className="text-lg font-bold text-slate-800 mb-4">Canais de Atendimento:</h3>
        
        <div className="grid sm:grid-cols-2 gap-6 mb-8">
          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase mb-2">Suporte Geral e Dúvidas</p>
            <p className="text-[#007b80] font-bold break-all text-lg">lucyano.mbacomex@yahoo.com.br</p>
          </div>
          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase mb-2">Auditoria de Documentos e Segurança</p>
            <p className="text-[#007b80] font-bold break-all text-lg">lucyano.pci@gmail.com</p>
          </div>
        </div>
        
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
          <h4 className="font-bold text-slate-800 mb-2">Tempo de Resposta:</h4>
          <p className="text-sm italic">
            A nossa equipa empenha-se em analisar e responder a todas as solicitações, dúvidas ou denúncias no prazo máximo de 24 horas úteis.
          </p>
        </div>
      </section>
    </div>
  </div>
);

const InstitucionalPrivacidadePage: React.FC = () => (
  <div className="max-w-4xl mx-auto px-6 py-12 text-left">
    <h1 className="text-4xl font-black text-slate-800 mb-8">Política de Privacidade e Proteção de Dados (LGPD)</h1>
    
    <div className="prose prose-slate max-w-none space-y-8 text-slate-600 leading-relaxed">
      <p className="text-lg">
        O SOS Cuidadores Brasil leva a sua privacidade a sério. Operamos com o nível máximo de segurança em banco de dados, 
        atuando em total e irrestrita conformidade com a Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018 - LGPD).
      </p>

      <section>
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Tratamento e Finalidade dos Dados</h2>
        <p>
          Recolhemos apenas as informações estritamente necessárias (nome, cidade, contacto telefónico e e-mail) para 
          viabilizar a conexão entre famílias que procuram cuidadores e os profissionais disponíveis na plataforma. 
          Estes dados não são vendidos ou partilhados com terceiros para fins de marketing externo.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Criptografia e Blindagem de Documentos Pessoais</h2>
        <p className="mb-4">
          Sabemos da extrema sensibilidade de enviar fotos de documentos pessoais (RG/CNH) pela internet. Por isso, 
          as fotos enviadas pelos profissionais cuidadores são encriptadas e armazenadas em servidores isolados e 
          de alta segurança do Google Cloud (Firebase Storage).
        </p>
        <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 text-amber-900">
          <strong>Atenção:</strong> Estes arquivos sensíveis são visíveis exclusivamente pela Administração Master 
          (Luciano e Geyson) única e exclusivamente para o fim de auditoria e libertação do Selo de Identidade Verificada. 
          Sob nenhuma hipótese qualquer família, outro profissional ou visitante do site terá acesso visual às fotos 
          dos seus documentos de identificação.
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Proteção de Contato e Prevenção de Spam</h2>
        <p>
          Para proteger os nossos profissionais de robôs, golpes de WhatsApp ou assédio comercial, o número de telemóvel 
          do cuidador só é ativado e exibido como botão clicável para famílias que também realizaram um registo válido 
          na plataforma. Isto garante que o contacto recebido seja genuíno e originado de uma necessidade real de contratação.
        </p>
      </section>

      <section className="pt-6 border-t border-slate-200">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Direitos do Utilizador</h2>
        <p>
          A qualquer momento, o utilizador pode solicitar a eliminação definitiva, correção ou anonimização dos seus 
          dados e do seu perfil através do nosso canal de suporte.
        </p>
      </section>
    </div>
  </div>
);

const InstitucionalTermosPage: React.FC = () => (
  <div className="max-w-4xl mx-auto px-6 py-12 text-left">
    <h1 className="text-4xl font-black text-slate-800 mb-8">Termos de Uso e Responsabilidades</h1>
    
    <div className="prose prose-slate max-w-none space-y-10 text-slate-600 leading-relaxed">
      <p className="text-lg font-medium text-slate-700">
        Ao utilizar o portal SOS Cuidadores Brasil, o utilizador concorda com as seguintes diretrizes:
      </p>

      <section>
        <h2 className="text-2xl font-bold text-slate-800 mb-4">1. Da Intermediação Estritamente Tecnológica</h2>
        <p>
          O SOS Cuidadores Brasil atua, jurídica e operacionalmente, como um portal classificado digital de intermediação tecnológica. 
          Não somos uma agência de empregos, cooperativa, clínica médica ou sindicato. Fornecemos exclusivamente a infraestrutura 
          tecnológica para que a vitrine profissional ocorra com visibilidade e segurança.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-slate-800 mb-4">2. Da Inexistência de Vínculo Empregatício</h2>
        <p>
          Não existe qualquer subordinação, habitualidade ou vínculo empregatício (CLT) entre a plataforma SOS Cuidadores 
          e os profissionais nela registados. O portal não dita escalas, não exige cumprimento de horários e não retém 
          nenhuma percentagem, comissão ou taxa sobre os plantões fechados. O valor acordado entre a família e o cuidador 
          pertence 100% ao profissional.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-slate-800 mb-4">3. Da Negociação Soberana</h2>
        <p>
          Toda a negociação referente a valores de plantão (12x36, 24h, folguista), regras de convivência ao domicílio, 
          alimentação no local de trabalho, vale-transporte e formas de pagamento é de responsabilidade soberana, direta 
          e exclusiva entre o Contratante (Família) e o Contratado (Profissional). A plataforma não atua como mediadora 
          financeira ou contratual.
        </p>
      </section>

      <section className="bg-red-50 p-8 rounded-3xl border border-red-100">
        <h2 className="text-2xl font-bold text-red-900 mb-4">4. Direito Master de Auditoria e Banimento</h2>
        <p className="text-red-800">
          O SOS Cuidadores preza pela vida e integridade dos pacientes. A Administração Master reserva-se o direito 
          unilateral e inquestionável de suspender, ocultar ou banir permanentemente perfis profissionais ou de famílias 
          que apresentem documentos adulterados, conduta antiética comprovada, ou que acumulem avaliações negativas graves 
          que coloquem em risco a segurança física, moral ou emocional de pacientes vulneráveis.
        </p>
      </section>

    </div>
  </div>
);

const ArtigosHubPage: React.FC = () => {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState<string | null>(null);

  const guides = [
    {
      id: 'lesao-por-pressao',
      title: 'Guia Completo de Lesão por Pressão (Escaras)',
      desc: 'Da prevenção ao tratamento dos 4 estágios, domine a principal complicação em pacientes acamados.'
    },
    {
      id: 'reanimacao-cardiopulmonar',
      title: 'Protocolo de Reanimação Cardiopulmonar (RCP) para Leigos',
      desc: 'Aprenda os passos que salvam vidas em uma situação de parada cardiorrespiratória em adultos.'
    },
    {
      id: 'banho-no-leito',
      title: 'Técnica Profissional para Banho no Leito Humanizado',
      desc: 'Passo a passo para uma higiene segura, confortável e que respeita a dignidade do paciente.'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-black text-slate-800 mb-6 text-center">Central de Guias e Manuais</h1>
      <p className="text-lg text-slate-500 mb-12 text-center max-w-2xl mx-auto leading-relaxed">
        Conhecimento é a melhor ferramenta de um cuidador. Acesse nossos manuais técnicos, 
        elaborados por especialistas, para aprimorar suas habilidades e oferecer um cuidado de excelência.
      </p>

      <div className="space-y-6">
        {guides.map((guide) => (
          <div
            key={guide.id}
            onClick={() => navigate(`/artigos/${guide.id}`)}
            onMouseEnter={() => setHovered(guide.id)}
            onMouseLeave={() => setHovered(null)}
            className={`
              p-8 rounded-2xl border transition-all duration-200 cursor-pointer text-left
              ${hovered === guide.id 
                ? 'border-[#007b80] shadow-lg shadow-[#007b80]/10 -translate-y-0.5' 
                : 'border-slate-200 bg-white shadow-sm'}
            `}
          >
            <h3 className="text-xl font-bold text-slate-800 mb-2">{guide.title}</h3>
            <p className="text-slate-500 leading-relaxed">{guide.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const ArtigoLesaoPorPressao: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="max-w-3xl mx-auto px-6 py-12 text-left">
      <button 
        onClick={() => navigate('/artigos')}
        className="flex items-center gap-2 text-[#007b80] font-semibold mb-10 hover:opacity-80 transition-opacity"
      >
        <IconBack /> Voltar para a Central de Guias
      </button>

      <h1 className="text-4xl font-black text-slate-800 mb-12">Guia Completo de Lesão por Pressão (Escaras)</h1>

      <section className="mb-10">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">O Que é Lesão por Pressão (LPP)?</h2>
        <p className="text-slate-600 leading-relaxed">
          Lesão por Pressão, popularmente conhecida como "escara", é um dano localizado na pele e/ou tecidos moles subjacentes, 
          geralmente sobre uma proeminência óssea, como resultado de pressão intensa e/ou prolongada em combination com o cisalhamento (fricção).
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">Os 4 Estágios da LPP</h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="font-bold text-slate-800 mb-2">Estágio 1: Eritema Não Branqueável</h3>
            <p className="text-slate-600 leading-relaxed">
              A pele está intacta, mas apresenta uma área avermelhada que não clareia quando pressionada. Pode ser dolorosa, 
              firme, macia, mais quente ou mais fria em comparação com o tecido adjacente. Em peles escuras, a cor pode ser diferente, 
              mas a textura e temperatura são sinais chave.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-slate-800 mb-2">Estágio 2: Perda Parcial da Espessura da Pele</h3>
            <p className="text-slate-600 leading-relaxed">
              Apresenta-se como uma ferida superficial, como uma abrasão, bolha ou uma cratera rasa. O leito da ferida é vermelho-rosado, úmido. 
              Não há presença de esfacelo (tecido amarelo, necrótico) ou necrose.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-slate-800 mb-2">Estágio 3: Perda Total da Espessura da Pele</h3>
            <p className="text-slate-600 leading-relaxed">
              A gordura subcutânea pode ser visível, mas os ossos, tendões ou músculos não estão expostos. O esfacelo pode estar presente. 
              A profundidade varia pela localização anatômica.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-slate-800 mb-2">Estágio 4: Perda Total da Espessura dos Tecidos</h3>
            <p className="text-slate-600 leading-relaxed">
              Exposição de osso, tendão ou músculo. Esfacelo ou escara (necrose preta) podem estar presentes em partes do leito da ferida. 
              Frequentemente inclui túneis e fístulas.
            </p>
          </div>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">Prevenção: A Melhor Estratégia!</h2>
        <ul className="list-disc pl-5 space-y-4 text-slate-600 leading-relaxed">
          <li><strong>Mudança de Decúbito:</strong> Reposicionar o paciente a cada 2 horas é a regra de ouro. Alterne entre decúbito dorsal (costas), lateral direito e lateral esquerdo.</li>
          <li><strong>Inspeção da Pele:</strong> Verifique a pele diariamente, especialmente sobre as proeminências ósseas (calcanhares, quadril, sacro, cotovelos).</li>
          <li><strong>Hidratação da Pele:</strong> Use cremes hidratantes para manter a pele elástica e resistente.</li>
          <li><strong>Superfícies de Alívio de Pressão:</strong> Utilize colchões pneumáticos (colchão de ar) e almofadas especiais.</li>
          <li><strong>Nutrição e Hidratação:</strong> Uma dieta rica em proteínas e a ingestão adequada de líquidos são cruciais para a saúde da pele.</li>
        </ul>
      </section>
    </div>
  );
};

const ArtigoRCP: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="max-w-3xl mx-auto px-6 py-12 text-left">
      <button 
        onClick={() => navigate('/artigos')}
        className="flex items-center gap-2 text-[#007b80] font-semibold mb-10 hover:opacity-80 transition-opacity"
      >
        <IconBack /> Voltar para a Central de Guias
      </button>

      <h1 className="text-4xl font-black text-slate-800 mb-12 leading-tight">
        Protocolo de Reanimação Cardiopulmonar (RCP) para Leigos
      </h1>

      <section className="mb-10">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">1. Verifique a Segurança do Local</h2>
        <p className="text-slate-600 leading-relaxed">
          Antes de tudo, garanta que o ambiente é seguro para você e para a vítima. Verifique riscos de eletricidade, trânsito, etc.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">2. Verifique a Responsividade e a Respiração</h2>
        <p className="text-slate-600 leading-relaxed">
          Toque nos ombros da vítima e chame em voz alta: "Senhor? Você está bem?". Simultaneamente, observe se o tórax se eleva 
          (se há respiração) por não mais de 10 segundos. Se a vítima não responde e não respira ou tem apenas respiração agônica (gasping), ela precisa de RCP.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">3. Chame Ajuda (Ligue 192)</h2>
        <p className="text-slate-600 leading-relaxed">
          Se estiver sozinho, ligue para o SAMU (192) imediatamente. Se houver outra pessoa, peça para ela ligar enquanto você inicia a RCP. 
          Peça também por um Desfibrilador Externo Automático (DEA), se disponível.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">4. Inicie as Compressões Torácicas</h2>
        <ul className="list-disc pl-5 space-y-3 text-slate-600 leading-relaxed">
          <li>Ajoelhe-se ao lado da vítima.</li>
          <li>Posicione a base de uma de suas mãos no centro do tórax da vítima, na linha entre os mamilos. Coloque a outra mão sobre a primeira, entrelaçando os dedos.</li>
          <li>Mantenha os braços estendidos e os ombros diretamente acima de suas mãos.</li>
          <li>Comprima o tórax para baixo, com uma profundidade de 5 a 6 cm.</li>
          <li>Realize as compressões em um ritmo de 100 a 120 por minuto (o ritmo da música "Stayin' Alive" dos Bee Gees).</li>
          <li>Permita que o tórax retorne completamente à posição normal após cada compressão.</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">5. Continue a RCP</h2>
        <p className="text-slate-600 leading-relaxed">
          Continue as compressões sem interrupção até a chegada do socorro especializado, até a vítima mostrar sinais de vida, 
          ou até você ficar exausto. Se houver um DEA, siga as instruções do aparelho assim que ele chegar.
        </p>
      </section>

      <div className="p-6 bg-slate-50 rounded-xl border border-slate-200">
        <p className="text-slate-700 leading-relaxed">
          <strong>Importante:</strong> Para leigos, a recomendação atual é focar apenas nas compressões torácicas contínuas (Hands-Only CPR), 
          sem a necessidade de ventilações (respiração boca a boca), até a chegada de ajuda profissional.
        </p>
      </div>
    </div>
  );
};

const ArtigoBanhoNoLeito: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="max-w-3xl mx-auto px-6 py-12 text-left">
      <button 
        onClick={() => navigate('/artigos')}
        className="flex items-center gap-2 text-[#007b80] font-semibold mb-10 hover:opacity-80 transition-opacity"
      >
        <IconBack /> Voltar para a Central de Guias
      </button>

      <h1 className="text-4xl font-black text-slate-800 mb-12 leading-tight">
        Técnica Profissional para Banho no Leito Humanizado
      </h1>

      <section className="mb-10">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">1. Preparação do Ambiente e Material</h2>
        <p className="text-slate-600 leading-relaxed mb-4">
          Antes de começar, separe TUDO o que vai precisar para evitar deixar o paciente sozinho. Feche portas e janelas para evitar correntes de ar.
        </p>
        <ul className="list-disc pl-5 space-y-2 text-slate-600 leading-relaxed">
          <li>Duas bacias: uma com água morna e sabonete líquido neutro, outra apenas com água morna para enxágue.</li>
          <li>Luvas de procedimento.</li>
          <li>Toalhas macias e campo impermeável para não molhar a cama.</li>
          <li>Roupas de cama e roupas do paciente limpas.</li>
          <li>Material de higiene: sabonete, shampoo (se for lavar o cabelo), hidratante.</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">2. Comunicação e Privacidade</h2>
        <p className="text-slate-600 leading-relaxed">
          Explique ao paciente cada passo que você vai realizar. Mantenha-o coberto com um lençol, descobrindo apenas a parte do corpo que será higienizada. 
          Isso preserva a dignidade e o calor corporal.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">3. A Ordem Correta (Céfalo-caudal)</h2>
        <p className="text-slate-600 leading-relaxed mb-4">
          Siga uma ordem da "cabeça aos pés" para minimizar a contaminação.
        </p>
        <ol className="list-decimal pl-5 space-y-4 text-slate-600 leading-relaxed">
          <li><strong>Rosto:</strong> Use apenas água, sem sabão. Comece pelos olhos, do canto interno para o externo, usando uma parte diferente da compressa para cada olho.</li>
          <li><strong>Membros Superiores:</strong> Lave braços e axilas. Dê atenção especial às mãos.</li>
          <li><strong>Tórax e Abdômen:</strong> Lave com movimentos suaves. Em mulheres, higienize sob as mamas.</li>
          <li><strong>Membros Inferiores:</strong> Lave as pernas e, por fim, os pés, dando atenção especial entre os dedos.</li>
          <li><strong>Costas:</strong> Vire o paciente de lado, com segurança, e lave as costas e a região glútea.</li>
          <li><strong>Higiene Íntima (Genitais):</strong> Esta é a ÚLTIMA parte. Troque a água das bacias se necessário. Faça a limpeza sempre no sentido da frente para trás para evitar levar bactérias para a uretra.</li>
        </ol>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">4. Finalização e Conforto</h2>
        <p className="text-slate-600 leading-relaxed">
          Seque muito bem cada parte do corpo, especialmente as dobras de pele (axilas, virilhas, sob as mamas). 
          Aplique um creme hidratante para proteger a pele. Vista o paciente com roupas limpas e confortáveis e troque a roupa de cama. 
          Deixe o paciente em uma posição confortável e segura.
        </p>
      </section>
    </div>
  );
};

const PortalCursosProfissionaisPage: React.FC = () => {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 20px' }}>
      <h1 style={{ fontSize: 'clamp(28px, 5vw, 42px)', fontWeight: '900', color: '#1e293b', marginBottom: '15px', textTransform: 'uppercase', letterSpacing: '-1px' }}>
        Academia SOS <span style={{color: '#007b80'}}>Cuidadores</span>
      </h1>
      <p style={{ fontSize: '18px', color: '#64748b', marginBottom: '50px', maxWidth: '700px', lineHeight: '1.6' }}>
        Aprimore suas habilidades técnicas e conquiste melhores oportunidades com nossos cursos certificados e treinamentos de elite.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[
          { 
            title: "Cuidador de Idosos Master", 
            desc: "O curso mais completo do Brasil, com certificação nacional e foco em patologias complexas.", 
            price: "R$ 197,00",
            link: "https://go.hotmart.com/M104780028R"
          },
          { 
            title: "Primeiros Socorros Avançado", 
            desc: "Técnicas críticas de RCP, desengasgo e emergências domiciliares para profissionais de elite.", 
            price: "R$ 97,00",
            link: "#"
          },
          { 
            title: "Higiene e Conforto no Leito", 
            desc: "Técnicas profissionais de banho, troca de fraldas e prevenção de escaras (LPP).", 
            price: "R$ 77,00",
            link: "#"
          }
        ].map((curso, idx) => (
          <div 
            key={idx} 
            className={`bg-white p-8 rounded-[30px] border transition-all flex flex-col h-full ${hoverIdx === idx ? 'border-[#007b80] shadow-xl -translate-y-2' : 'border-slate-100 shadow-sm'}`}
            onMouseEnter={() => setHoverIdx(idx)}
            onMouseLeave={() => setHoverIdx(null)}
          >
            <div className="bg-teal-50 w-12 h-12 rounded-xl flex items-center justify-center mb-6 text-2xl">
              {idx === 0 ? '🎓' : (idx === 1 ? '🚑' : '🧼')}
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-4 uppercase tracking-tight">{curso.title}</h3>
            <p className="text-slate-500 leading-relaxed mb-8 flex-1 text-sm font-medium">{curso.desc}</p>
            <div className="flex items-center justify-between mt-auto pt-6 border-t border-slate-100">
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Investimento</span>
                <span className="text-xl font-black text-[#007b80]">{curso.price}</span>
              </div>
              <button 
                className="bg-[#007b80] text-white px-6 py-3 rounded-xl font-bold text-xs uppercase shadow-lg shadow-[#007b80]/10 hover:scale-105 transition-all"
                onClick={() => curso.link !== '#' && window.open(curso.link, "_blank")}
              >
                MATRICULAR
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ------------------------------------------------------------------------------------------
// 9. LAYOUT E NAVEGAÇÃO
// ------------------------------------------------------------------------------------------

interface LayoutProps {
  userAuth: FirebaseAuthUser | null;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ userAuth, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const isAdmin = userAuth && ADMIN_EMAILS.includes(userAuth.email || "");
  const hideNav = location.pathname.startsWith('/artigos/');

  const navLinks = [
    { path: '/', label: 'Cuidadores' },
    { path: '/vagas', label: 'Vagas' },
    { path: '/artigos', label: 'Guias' },
    { path: '/cursos', label: 'Cursos' },
    { path: '/perfil', label: 'Meu Painel' },
    ...(isAdmin ? [{ path: '/admin', label: 'ADMIN' }] : [])
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen flex flex-col">
      {!hideNav && (
        <>
          {/* CABEÇALHO DESKTOP (Escondido em Telemóveis) */}
          <header className="hidden md:flex fixed top-0 left-0 right-0 bg-white border-b border-slate-100 z-[1000] h-20 items-center shadow-sm">
            <div className="flex justify-between items-center w-full max-w-7xl mx-auto px-6">
              <Link to="/" className="no-underline text-[#007b80] font-black text-2xl">SOS Cuidadores</Link>
              <nav className="flex gap-6 items-center">
                {navLinks.map(link => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`no-underline text-base font-semibold transition-colors ${location.pathname === link.path ? 'text-[#007b80]' : 'text-slate-600'}`}
                  >
                    {link.label}
                  </Link>
                ))}
                {!userAuth ? (
                  <button onClick={() => navigate('/login')} className="bg-[#007b80] text-white border-none px-5 py-2 rounded-xl font-bold cursor-pointer hover:opacity-90 transition-opacity">Login</button>
                ) : (
                  <button onClick={onLogout} className="bg-transparent text-red-500 border-2 border-red-500 px-5 py-2 rounded-xl font-bold cursor-pointer hover:bg-red-50 transition-colors">Sair</button>
                )}
              </nav>
            </div>
          </header>

          {/* CABEÇALHO MÓVEL (Minimalista no topo) */}
          <header className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-slate-100 z-[1000] h-16 flex items-center justify-center shadow-sm">
             <Link to="/" className="no-underline text-[#007b80] font-black text-xl tracking-tight">SOS CUIDADORES</Link>
          </header>
        </>
      )}

      <main style={{ paddingTop: hideNav ? 20 : 80, paddingBottom: hideNav ? 50 : 100 }} className="flex-grow px-4 md:px-6">
        <Outlet />
      </main>

      {!hideNav && (
        <>
          {/* RODAPÉ DESKTOP (Escondido em Telemóveis) */}
          <footer className="hidden md:block bg-slate-900 text-slate-400 py-12 mt-auto">
            <div className="max-w-6xl mx-auto px-6">
              <div className="grid md:grid-cols-3 gap-12 mb-12">
                <div>
                  <h3 className="text-white font-black text-xl mb-4">SOS Cuidadores</h3>
                  <p className="text-sm leading-relaxed">
                    A maior e mais segura vitrine de cuidadores do Brasil. 
                    Conectando famílias e profissionais com transparência e auditoria humana.
                  </p>
                </div>
                <div>
                  <h4 className="text-white font-bold mb-4">Institucional</h4>
                  <ul className="space-y-2 text-sm">
                    <li><Link to="/sobre" className="hover:text-white transition-colors">Sobre o SOS Cuidadores</Link></li>
                    <li><Link to="/privacidade" className="hover:text-white transition-colors">Política de Privacidade (LGPD)</Link></li>
                    <li><Link to="/termos" className="hover:text-white transition-colors">Termos de Uso</Link></li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-white font-bold mb-4">Suporte</h4>
                  <ul className="space-y-2 text-sm">
                    <li>Email: lucyano.mbacomex@yahoo.com.br</li>
                    <li>Segurança: lucyano.pci@gmail.com</li>
                  </ul>
                </div>
              </div>
              <div className="pt-8 border-t border-slate-800 text-center text-xs">
                <p>© 2026 SOS Cuidadores Brasil. Todos os direitos reservados.</p>
              </div>
            </div>
          </footer>

          {/* MENU MÓVEL INFERIOR (Estilo Aplicação de Telemóvel) */}
          <footer className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0f172a] p-4 flex justify-around items-center z-[1000] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] rounded-t-[30px]">
            <Link to="/" className={`flex flex-col items-center gap-1 ${isActive('/') ? 'text-[#007b80] scale-110' : 'text-slate-400'} transition-all`}>
              <IconSearch />
              <span className="text-[10px] font-black uppercase tracking-tighter">Buscar</span>
            </Link>
            <Link to="/vagas" className={`flex flex-col items-center gap-1 ${isActive('/vagas') ? 'text-[#007b80] scale-110' : 'text-slate-400'} transition-all`}>
              <span className="text-xl leading-none">📋</span>
              <span className="text-[10px] font-black uppercase tracking-tighter">Vagas</span>
            </Link>
            <Link to="/perfil" className={`flex flex-col items-center gap-1 ${isActive('/perfil') ? 'text-[#007b80] scale-110' : 'text-slate-400'} transition-all`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${isActive('/perfil') ? 'border-[#007b80] bg-[#007b80]/10' : 'border-slate-400 bg-transparent'}`}>👤</div>
              <span className="text-[10px] font-black uppercase tracking-tighter">Painel</span>
            </Link>
          </footer>
        </>
      )}
    </div>
  );
};

// ------------------------------------------------------------------------------------------
// 10. PÁGINAS DINÂMICAS
// ------------------------------------------------------------------------------------------

interface HomePageProps {
  usuarios: UserData[];
  userAuth: FirebaseAuthUser | null;
  userData: UserData | null;
}
const HomePage: React.FC<HomePageProps> = ({ usuarios, userAuth, userData }) => {
  const [termoBusca, setTermoBusca] = useState<string>('');
  const [abaListagem, setAbaListagem] = useState<'cuidadores' | 'paciente'>('cuidadores'); 
  const [modalAvaliacaoTarget, setModalAvaliacaoTarget] = useState<UserData | null>(null); 
  const [hoverCard, setHoverCard] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleContatoZap = (u: UserData) => {
    // 1. TRAVA DE LOGIN BÁSICA
    if (!userAuth || userAuth.isAnonymous) {
      alert("Identifique-se primeiro para liberar o contato.");
      return navigate('/login');
    }

    // =======================================================================
    // 2. BARREIRA FINANCEIRA MASTER (PAYWALL)
    // Se o usuário logado for Cuidador e NÃO for Premium
    // =======================================================================
    if (userData?.tipo === 'cuidador' && !userData?.premium) {
      const querAssinar = window.confirm(
        "🔒 ACESSO PREMIUM NECESSÁRIO\n\n" +
        "Famílias acessam gratuitamente, mas Profissionais precisam do Plano Premium (R$ 9,90/mês) para liberar a conexão via WhatsApp com outros perfis.\n\n" +
        "Deseja ativar seu Plano Premium agora?"
      );
      if (querAssinar) {
        // Altere para o seu link real da Hotmart ou Mercado Pago
        window.open("https://go.hotmart.com/SEU_LINK_AQUI", "_blank"); 
      }
      return; 
    }

    // 3. LIBERAÇÃO: Abre o WhatsApp se passou pelas travas
    const num = renderSafe(u.whatsapp).replace(/\D/g, '');
    window.open(`https://wa.me/55${num}`, '_blank');
  };

  const filtrados = usuarios.filter(u => {
    const s = termoBusca.toLowerCase();
    const nome = renderSafe(u.nome).toLowerCase();
    const local = getLoc(u).toLowerCase();
    const matchBusca = local.includes(s) || nome.includes(s);
    const matchAba = u.tipo === (abaListagem === 'cuidadores' ? 'cuidador' : 'paciente');
    return matchBusca && matchAba && nome.length > 0;
  });

  return (
    <div>
      <section style={styles.heroBanner}>
        <h1 style={styles.heroTitle}>SOS CUIDADORES</h1>
        <p style={styles.heroSubtitle}>Cuidadores de confiança para o bem-estar da sua família.</p>
        {!userAuth && (
          <button 
            onClick={() => navigate('/login')} 
            className="mt-8 bg-white text-[#007b80] px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-wider shadow-2xl hover:scale-105 transition-all"
          >
            Cadastre aqui
          </button>
        )}
      </section>

      <section className="flex flex-col md:flex-row gap-4 mb-10 max-w-4xl mx-auto">
        <div 
          className="flex-1 bg-[#f0f9ff] border-2 border-[#007b80] rounded-[30px] p-6 text-center flex flex-col items-center gap-2 transition-all cursor-default"
          style={{
            transform: hoverCard === 'familia' ? 'translateY(-5px)' : 'none',
            boxShadow: hoverCard === 'familia' ? '0 10px 25px rgba(0,123,128,0.1)' : 'none'
          }}
          onMouseEnter={() => setHoverCard('familia')}
          onMouseLeave={() => setHoverCard(null)}
        >
          <div className="text-2xl">💎</div>
          <h3 className="text-xl font-black text-[#1e293b] uppercase">PARA FAMÍLIAS</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            <strong>100% Grátis</strong> para divulgar suas vagas e necessidades.
          </p>
        </div>
        <div 
          className="flex-1 bg-[#fffdf0] border-2 border-[#fbbf24] rounded-[30px] p-6 text-center flex flex-col items-center gap-2 transition-all cursor-default"
          style={{
            transform: hoverCard === 'cuidador' ? 'translateY(-5px)' : 'none',
            boxShadow: hoverCard === 'cuidador' ? '0 10px 25px rgba(251,191,36,0.1)' : 'none'
          }}
          onMouseEnter={() => setHoverCard('cuidador')}
          onMouseLeave={() => setHoverCard(null)}
        >
          <div className="text-2xl">⭐</div>
          <h3 className="text-xl font-black text-[#1e293b] uppercase">PARA CUIDADORES</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Acesso <strong>Premium 100%</strong> liberado a todos os contatos.
          </p>
        </div>
      </section>

      <div className="flex bg-slate-100 p-1 rounded-2xl mb-6 max-w-md mx-auto">
        <button onClick={() => setAbaListagem('cuidadores')} className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${abaListagem === 'cuidadores' ? 'bg-white shadow-sm text-[#007b80]' : 'text-slate-500'}`}>CUIDADORES</button>
        <button onClick={() => setAbaListagem('paciente')} className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${abaListagem === 'paciente' ? 'bg-white shadow-sm text-[#007b80]' : 'text-slate-500'}`}>VAGAS</button>
      </div>
      <div className="relative max-w-2xl mx-auto mb-10">
        <input 
          className="w-full p-5 pl-12 rounded-2xl border-2 border-slate-100 focus:border-[#007b80] outline-none transition-all shadow-sm text-slate-700 font-medium" 
          placeholder="Busque por nome do cuidador ou cidade..." 
          value={termoBusca} 
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTermoBusca(e.target.value)} 
        />
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
          <IconSearch />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 w-full">
        {filtrados.length > 0 ? (
          filtrados.map(usr => (
            <div 
              key={usr.id} 
              className={`bg-white p-8 rounded-[30px] border transition-all flex flex-col h-full ${usr.premium ? 'border-2 border-[#007b80] shadow-lg shadow-[#007b80]/5' : 'border-slate-100 shadow-sm hover:shadow-md'}`}
              style={{ transform: hoverCard === usr.id ? 'translateY(-5px)' : 'none' }}
              onMouseEnter={() => setHoverCard(usr.id)}
              onMouseLeave={() => setHoverCard(null)}
            >
              <div className="flex gap-5 mb-6 items-center">
                <div className="w-20 h-20 rounded-full border-2 border-[#007b80] overflow-hidden bg-slate-50 flex items-center justify-center shrink-0">
                  {usr.fotoPerfil ? <img src={usr.fotoPerfil} className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : <div className="text-2xl">👤</div>}
                </div>
                <div className="text-left flex-1 min-w-0">
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight truncate flex items-center gap-1">
                    {renderSafe(usr.nome)} {usr.identidadeVerificada && <IconVerify />}
                  </h3>
                  <p className="text-sm text-slate-500 font-medium truncate">{getLoc(usr)}</p>
                </div>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed mb-6 text-left line-clamp-3 flex-1 italic">
                "{renderSafe(usr.biografia || usr.descricao, "Profissional com vasta experiência em cuidados gerais e acompanhamento de pacientes.")}"
              </p>

              <div className="mb-6 flex justify-between items-center">
                <RatingDisplayPanel rating={usr.rating} total={usr.totalRatings} />
                <div className="flex gap-1">
                  {usr.identidadeVerificada && <span className="text-sky-500" title="RG Verificado"><IconVerify /></span>}
                  {usr.celularVerificado && <span className="text-green-500" title="Celular Verificado"><IconPhone /></span>}
                </div>
              </div>

              <div className="flex gap-3 mt-auto">
                 <button className="flex-1 bg-[#007b80] text-white py-3 rounded-xl font-bold text-xs uppercase shadow-md shadow-[#007b80]/10 hover:scale-105 transition-all" onClick={() => handleContatoZap(usr)}>WHATSAPP</button>
                 <button className="flex-1 bg-white border-2 border-slate-100 text-slate-500 py-3 rounded-xl font-bold text-xs uppercase hover:border-[#007b80] hover:text-[#007b80] transition-all" onClick={() => setModalAvaliacaoTarget(usr)}>AVALIAÇÕES</button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center bg-white rounded-[40px] border-2 border-dashed border-slate-100">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-black text-slate-900 uppercase mb-2">Nenhum cuidador encontrado</h3>
            <p className="text-slate-500 font-medium">Tente buscar por outra cidade ou nome.</p>
          </div>
        )}
      </div>
      {modalAvaliacaoTarget && <AvaliacaoModal profissional={modalAvaliacaoTarget} userAuth={userAuth} onClose={() => setModalAvaliacaoTarget(null)} />}
    </div>
  );
};

interface VagasPageProps {
  vagas: VagaData[];
  userAuth: FirebaseAuthUser | null;
  userData: UserData | null;
}
const VagasPage: React.FC<VagasPageProps> = ({ vagas, userAuth, userData }) => {
  const [formVaga, setFormVaga] = useState({ titulo: '', cidade: '', desc: '' });
  const navigate = useNavigate();

  const handlePostarVaga = async () => {
    if (!userAuth || userAuth.isAnonymous) return navigate('/login');
    try {
      await addDoc(collection(fs, 'vagas'), { 
        ...formVaga, 
        uid: userAuth.uid, 
        autor: renderSafe(userData?.nome), 
        whatsapp: renderSafe(userData?.whatsapp), 
        date: new Date().toLocaleDateString('pt-BR'), 
        ts: Date.now() 
      });
      alert("Publicada!"); 
      setFormVaga({ titulo: '', cidade: '', desc: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'vagas');
    }
  };

  const handleContatoVaga = (v: VagaData) => {
    // 1. TRAVA DE LOGIN
    if (!userAuth || userAuth.isAnonymous) {
      alert("Identifique-se primeiro para ver o contato desta vaga.");
      return navigate('/login');
    }

    // =======================================================================
    // 2. BARREIRA FINANCEIRA MASTER (PAYWALL PARA VAGAS)
    // Se o usuário logado for Cuidador e NÃO for Premium
    // =======================================================================
    if (userData?.tipo === 'cuidador' && !userData?.premium) {
      const querAssinar = window.confirm(
        "🔒 ACESSO PREMIUM NECESSÁRIO\n\n" +
        "Para visualizar o WhatsApp das famílias e se candidatar às vagas, é necessário ter o Plano Premium (R$ 9,90/mês).\n\n" +
        "Deseja ativar seu Plano Premium agora?"
      );
      if (querAssinar) {
        // Altere para o seu link real da Hotmart ou Mercado Pago
        window.open("https://go.hotmart.com/SEU_LINK_AQUI", "_blank");
      }
      return; 
    }

    // 3. LIBERAÇÃO
    const num = renderSafe(v.whatsapp).replace(/\D/g, '');
    const mensagem = encodeURIComponent(`Olá! Vi sua vaga para "${renderSafe(v.titulo)}" no SOS Cuidadores Brasil e tenho interesse.`);
    window.open(`https://wa.me/55${num}?text=${mensagem}`, '_blank');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h2 className="text-3xl font-black text-slate-900 mb-8 uppercase tracking-tight">Mural de Vagas</h2>
      {userData?.tipo === 'paciente' && (
        <div className="bg-white p-8 rounded-[30px] border border-slate-100 shadow-xl mb-12 space-y-4">
          <h3 className="text-xl font-black text-[#007b80] uppercase mb-4">Publicar Nova Vaga</h3>
          <input className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-[#007b80] outline-none transition-all" placeholder="Título da Vaga (ex: Cuidador para Idoso)" value={formVaga.titulo} onChange={e => setFormVaga({...formVaga, titulo: e.target.value})} />
          <input className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-[#007b80] outline-none transition-all" placeholder="Cidade / Bairro" value={formVaga.cidade} onChange={e => setFormVaga({...formVaga, cidade: e.target.value})} />
          <textarea className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-[#007b80] outline-none transition-all h-32" placeholder="Descreva as necessidades, horários e requisitos..." value={formVaga.desc} onChange={e => setFormVaga({...formVaga, desc: e.target.value})} />
          <button className="w-full bg-[#007b80] text-white p-5 rounded-2xl font-black text-lg uppercase tracking-wider shadow-lg shadow-[#007b80]/20 hover:scale-[1.01] transition-all" onClick={handlePostarVaga}>PUBLICAR VAGA AGORA</button>
        </div>
      )}
      <div className="space-y-6">
        {vagas.map(v => (
          <div key={v.id} className="bg-white p-8 rounded-[30px] border border-slate-100 shadow-sm hover:shadow-md transition-all">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{renderSafe(v.titulo)}</h3>
              <span className="bg-slate-100 px-4 py-2 rounded-full text-xs font-bold text-slate-500 whitespace-nowrap">
                📍 {renderSafe(v.cidade)} | {renderSafe(v.date)}
              </span>
            </div>
            <p className="text-slate-600 leading-relaxed mb-6 whitespace-pre-wrap">{renderSafe(v.desc)}</p>
            <button 
              className="flex items-center gap-2 bg-[#007b80] text-white px-8 py-3 rounded-xl font-bold uppercase text-sm shadow-lg shadow-[#007b80]/10 hover:scale-105 transition-all" 
              onClick={() => handleContatoVaga(v)}
            >
              CONTATAR FAMÍLIA
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// ------------------------------------------------------------------------------------------
// 11. ADMIN
// ------------------------------------------------------------------------------------------

interface AdminDashboardProps {
  usuarios: UserData[];
  userAuth: FirebaseAuthUser | null;
}
const AdminDashboard: React.FC<AdminDashboardProps> = ({ usuarios, userAuth }) => {
  const [termoAdmin, setTermoAdmin] = useState<string>('');
  const [filtro, setFiltro] = useState<string>('todos');
  const [edMaster, setEdMaster] = useState<UserData | null>(null);
  const [auditoriaDoc, setAuditoriaDoc] = useState<UserData | null>(null);

  const filtrados = usuarios.filter(u => {
    const matchBusca = renderSafe(u.nome).toLowerCase().includes(termoAdmin.toLowerCase()) || 
                       renderSafe(u.email).toLowerCase().includes(termoAdmin.toLowerCase());
    
    if (filtro === 'rg') return matchBusca && u.documentoEnviado && !u.identidadeVerificada;
    if (filtro === 'sms') return matchBusca && !u.celularVerificado;
    if (filtro === 'premium') return matchBusca && u.premium;
    return matchBusca;
  });

  return (
    <div className="text-left max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-rose-600 text-3xl md:text-4xl font-black mb-2 uppercase tracking-tight">Dashboard Master</h1>
      <p className="text-slate-500 text-lg mb-10 font-medium">Bem-vindo, Mestre {userAuth?.email}.</p>

      <div className="flex flex-wrap gap-3 mb-10">
        {['todos', 'rg', 'sms', 'premium'].map(f => (
          <button 
            key={f}
            onClick={() => setFiltro(f)} 
            className={`px-6 py-3 rounded-xl font-bold text-xs uppercase transition-all border-2 ${filtro === f ? 'bg-sky-50 border-[#007b80] text-[#007b80]' : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200'}`}
          >
            {f === 'todos' ? `TODOS (${usuarios.length})` : f === 'rg' ? 'RG PENDENTE' : f === 'sms' ? 'SMS PENDENTE' : 'PREMIUM'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-[30px] border border-slate-100 shadow-xl overflow-hidden">
        <div className="hidden md:grid grid-cols-5 gap-4 p-6 bg-slate-50 border-bottom border-slate-100 font-black text-slate-900 text-xs uppercase tracking-wider">
          <div className="col-span-2">Usuário</div>
          <div className="text-center">Status RG</div>
          <div className="text-center">Status SMS</div>
          <div className="text-center">Ações</div>
        </div>

        <div className="divide-y divide-slate-50">
          {filtrados.map(u => (
            <div key={u.id} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-6 items-center hover:bg-slate-50 transition-colors">
              <div className="col-span-2">
                <strong className="block text-slate-900 uppercase font-black tracking-tight">{renderSafe(u.nome)}</strong>
                <span className="block text-xs text-slate-500 font-medium truncate">{renderSafe(u.email)}</span>
                <span className="block text-[10px] text-slate-400 font-mono mt-1">ID: {u.uid || u.id}</span>
              </div>
              <div className="flex md:block justify-between items-center">
                <span className="md:hidden text-[10px] font-bold text-slate-400 uppercase">Status RG:</span>
                <div className="text-center">
                  {u.identidadeVerificada ? (
                    <span className="bg-sky-50 text-sky-600 px-3 py-1 rounded-full text-[10px] font-bold border border-sky-100">VERIFICADO</span>
                  ) : (
                    u.documentoEnviado ? (
                      <span className="bg-rose-50 text-rose-600 px-3 py-1 rounded-full text-[10px] font-bold border border-rose-100 cursor-pointer animate-pulse" onClick={() => setAuditoriaDoc(u)}>ANALISAR</span>
                    ) : (
                      <span className="bg-slate-50 text-slate-400 px-3 py-1 rounded-full text-[10px] font-bold border border-slate-100">N/A</span>
                    )
                  )}
                </div>
              </div>
              <div className="flex md:block justify-between items-center">
                <span className="md:hidden text-[10px] font-bold text-slate-400 uppercase">Status SMS:</span>
                <div className="text-center">
                  {u.celularVerificado ? (
                    <span className="bg-sky-50 text-sky-600 px-3 py-1 rounded-full text-[10px] font-bold border border-sky-100">VALIDADO</span>
                  ) : (
                    <span className="bg-rose-50 text-rose-600 px-3 py-1 rounded-full text-[10px] font-bold border border-rose-100">PENDENTE</span>
                  )}
                </div>
              </div>
              <div className="flex md:block justify-center">
                <button className="w-full md:w-auto bg-white border-2 border-slate-100 text-slate-600 px-6 py-2 rounded-xl text-[10px] font-black uppercase hover:border-[#007b80] hover:text-[#007b80] transition-all" onClick={() => setEdMaster(u)}>GERENCIAR</button>
              </div>
            </div>
          ))}
          {filtrados.length === 0 && <div className="p-20 text-center text-slate-400 font-medium italic">Nenhum usuário encontrado com este filtro.</div>}
        </div>
      </div>

      {edMaster && <MasterAdminGlobalEditor userToEdit={edMaster} onClose={() => setEdMaster(null)} />}
      {auditoriaDoc && <AdminDocumentApprovalModal userDoc={auditoriaDoc} onClose={() => setAuditoriaDoc(null)} />}
    </div>
  );
};

// ------------------------------------------------------------------------------------------
// 12. PERFIL
// ------------------------------------------------------------------------------------------

interface PerfilPageProps {
  userAuth: FirebaseAuthUser | null;
  userData: UserData | null;
  usuarios: UserData[];
  onLogout: () => void;
}
const PerfilPage: React.FC<PerfilPageProps> = ({ userAuth, userData, usuarios, onLogout }) => {
  const [abaAtiva, setAbaAtiva] = useState<'perfil' | 'master'>('perfil');
  const [loadingRG, setLoadingRG] = useState<boolean>(false);
  const [loadingFotoPerfil, setLoadingFotoPerfil] = useState<boolean>(false);
  const [abrirEditor, setAbrirEditor] = useState<boolean>(false);
  
  // SMS States
  const [loadingSMS, setLoadingSMS] = useState<boolean>(false);
  const [showSmsInput, setShowSmsInput] = useState<boolean>(false);
  const [smsCode, setSmsCode] = useState<string>('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  const handleUploadRG = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if(!file) return;
    setLoadingRG(true);
    try {
      const img = await compressImage(file); 
      if (userData?.id) {
        await updateDoc(doc(fs, "usuarios", userData.id), { fotoDocumento: img, documentoEnviado: true });
        alert("Enviado para auditoria!");
      }
    } catch(err) { alert("Erro ao enviar."); }
    setLoadingRG(false);
  };

  const handleUploadFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if(!file) return;
    setLoadingFotoPerfil(true);
    try {
      const img = await compressImage(file);
      if (userData?.id) {
        await updateDoc(doc(fs, "usuarios", userData.id), { fotoPerfil: img });
      }
    } catch(err) { alert("Erro ao atualizar foto."); }
    setLoadingFotoPerfil(false);
  };

  const handleSendSms = async () => {
    if (!userData?.whatsapp) return alert("WhatsApp não informado.");
    if (!auth.currentUser) return;
    setLoadingSMS(true);
    try {
      const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' });
      const phone = "+55" + userData.whatsapp.replace(/\D/g, '');
      const result = await linkWithPhoneNumber(auth.currentUser, phone, verifier);
      setConfirmationResult(result);
      setShowSmsInput(true);
      alert("Código enviado via SMS!");
    } catch (err: any) {
      alert("Erro ao enviar SMS: " + err.message);
    }
    setLoadingSMS(false);
  };

  const handleVerifySms = async () => {
    if (!confirmationResult || !smsCode) return;
    setLoadingSMS(true);
    try {
      await confirmationResult.confirm(smsCode);
      if (userData?.id) {
        await updateDoc(doc(fs, "usuarios", userData.id), { celularVerificado: true });
        alert("✅ Celular verificado com sucesso!");
        setShowSmsInput(false);
      }
    } catch (err) {
      alert("Código inválido ou expirado.");
    }
    setLoadingSMS(false);
  };

  if (!userAuth || userAuth.isAnonymous) return <div className="p-12 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-slate-500 font-bold">🔐 Faça login para acessar seu painel.</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div id="recaptcha-container"></div>
      {ADMIN_EMAILS.includes(userAuth.email || "") && (
        <div className="flex bg-slate-100 p-1 rounded-2xl mb-10 max-w-md mx-auto">
          <button onClick={() => setAbaAtiva('perfil')} className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${abaAtiva === 'perfil' ? 'bg-white shadow-sm text-[#007b80]' : 'text-slate-500'}`}>MEU PAINEL</button>
          <button onClick={() => setAbaAtiva('master')} className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${abaAtiva === 'master' ? 'bg-white shadow-sm text-[#007b80]' : 'text-slate-500'}`}>ADMINISTRAÇÃO</button>
        </div>
      )}

      {abaAtiva === 'perfil' && (
        <>
          {/* Header de Perfil */}
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12 mb-12 text-center md:text-left">
            <label className="relative cursor-pointer group">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-[#007b80] overflow-hidden bg-slate-100 flex items-center justify-center shadow-lg transition-transform group-hover:scale-105">
                {userData?.fotoPerfil ? (
                  <img src={userData.fotoPerfil} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="text-4xl">👤</div>
                )}
              </div>
              {loadingFotoPerfil && <div className="absolute inset-0 bg-white/70 rounded-full flex items-center justify-center font-bold text-[#007b80] animate-pulse">...</div>}
              <input type="file" className="hidden" onChange={handleUploadFoto} accept="image/*" />
              <div className="absolute -bottom-2 -right-2 bg-[#007b80] text-white p-2 rounded-full shadow-md">
                <IconCamera />
              </div>
            </label>
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-2 uppercase tracking-tight">
                {renderSafe(userData?.nome)}
              </h1>
              <p className="text-lg text-slate-500 font-medium mb-4">
                {getLoc(userData)}
              </p>
              <div className="flex justify-center md:justify-start mb-6">
                <RatingDisplayPanel rating={userData?.rating} total={userData?.totalRatings} />
              </div>
              <button className="flex items-center gap-2 px-6 py-3 border-2 border-[#007b80] text-[#007b80] rounded-xl font-bold text-sm uppercase hover:bg-[#007b80] hover:text-white transition-all mx-auto md:mx-0" onClick={() => setAbrirEditor(true)}>
                <IconEdit /> EDITAR PERFIL
              </button>
            </div>
          </div>

          {/* Seção SMS */}
          <div className="bg-sky-50 rounded-3xl p-8 mb-6 border border-sky-100">
            <h3 className="text-xl font-black text-slate-900 mb-4 uppercase tracking-tight">Validação de Celular (SMS)</h3>
            <p className="text-slate-600 leading-relaxed mb-6">
              Valide seu número para receber o selo de confiança e garantir que as famílias possam te contatar.
            </p>
            <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
              <div className="font-bold text-slate-500">
                Status: <span className={userData?.celularVerificado ? 'text-green-600' : 'text-slate-400'}>
                  {userData?.celularVerificado ? 'VALIDADO 📱' : 'PENDENTE'}
                </span>
              </div>
              {!userData?.celularVerificado && !showSmsInput && (
                <button className="w-full sm:w-auto bg-[#007b80] text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-[#007b80]/20 hover:scale-105 transition-all" onClick={handleSendSms} disabled={loadingSMS}>
                  {loadingSMS ? 'ENVIANDO...' : 'VALIDAR VIA SMS'}
                </button>
              )}
            </div>
            {showSmsInput && (
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <input 
                  className="flex-1 p-4 rounded-xl border-2 border-sky-200 focus:border-[#007b80] outline-none transition-all" 
                  placeholder="Código de 6 dígitos" 
                  value={smsCode} 
                  onChange={e => setSmsCode(e.target.value)} 
                />
                <button className="bg-[#007b80] text-white px-8 py-4 rounded-xl font-bold shadow-lg shadow-[#007b80]/20" onClick={handleVerifySms} disabled={loadingSMS}>
                  {loadingSMS ? '...' : 'CONFIRMAR'}
                </button>
              </div>
            )}
          </div>

          {/* Seção RG */}
          <div className="bg-white rounded-3xl p-8 mb-6 border border-slate-100 shadow-sm">
            <h3 className="text-xl font-black text-slate-900 mb-4 uppercase tracking-tight">Verificação de Identidade (RG)</h3>
            <p className="text-slate-600 leading-relaxed mb-6">
              Envie uma foto nítida do seu RG (frente e verso) para receber o selo de verificação e aumentar a confiança das famílias.
            </p>
            <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
              <div className="font-bold text-slate-500">
                Status Atual: <span className={userData?.identidadeVerificada ? 'text-green-600' : (userData?.documentoEnviado ? 'text-amber-600' : 'text-slate-400')}>
                  {userData?.identidadeVerificada ? 'VERIFICADO ✅' : (userData?.documentoEnviado ? 'EM ANÁLISE ⏳' : 'NÃO ENVIADO')}
                </span>
              </div>
              {!userData?.identidadeVerificada && (
                <label className="w-full sm:w-auto bg-[#007b80] text-white px-8 py-3 rounded-xl font-bold text-center cursor-pointer shadow-lg shadow-[#007b80]/20 hover:scale-105 transition-all">
                  {loadingRG ? 'ENVIANDO...' : 'ENVIAR FOTO DO RG'}
                  <input type="file" className="hidden" onChange={handleUploadRG} accept="image/*" />
                </label>
              )}
            </div>
          </div>

          {/* Seção Biografia */}
          <div className="bg-white rounded-3xl p-8 mb-6 border border-slate-100 shadow-sm">
            <h3 className="text-xl font-black text-slate-900 mb-4 uppercase tracking-tight">Minha Biografia Profissional</h3>
            <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
              {renderSafe(userData?.biografia || userData?.descricao) || "Sua biografia ainda não foi preenchida. Clique em 'Editar Perfil' para adicionar sua experiência."}
            </p>
          </div>

          {/* Seção Especialidades */}
          <div className="bg-white rounded-3xl p-8 mb-12 border border-slate-100 shadow-sm">
            <h3 className="text-xl font-black text-slate-900 mb-4 uppercase tracking-tight">Minhas Especialidades Técnicas</h3>
            {Array.isArray(userData?.especialidades) && userData.especialidades.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {userData.especialidades.map(esp => (
                  <span key={esp} className="bg-slate-100 px-4 py-2 rounded-lg text-sm font-bold text-slate-600">
                    {esp}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 italic">Nenhuma especialidade selecionada. Edite seu perfil para adicioná-las.</p>
            )}
          </div>

          {/* Botão Sair */}
          <button className="w-full py-5 bg-rose-600 text-white rounded-2xl font-black text-lg uppercase tracking-wider shadow-lg shadow-rose-600/20 hover:bg-rose-700 transition-all mb-12" onClick={onLogout}>
            SAIR DO SISTEMA (LOGOUT)
          </button>
        </>
      )}

      {abaAtiva === 'master' && <AdminDashboard usuarios={usuarios} userAuth={userAuth} />}
      {abrirEditor && userData && <UserSelfEditorModal userData={userData} onClose={() => setAbrirEditor(false)} />}
    </div>
  );
};

// ------------------------------------------------------------------------------------------
// 13. AUTH
// ------------------------------------------------------------------------------------------

const LoginPage: React.FC = () => {
  const [modo, setModo] = useState<'login' | 'cad'>('login');
  const [email, setEmail] = useState<string>('');
  const [senha, setSenha] = useState<string>('');
  const [concordouLGPD, setConcordouLGPD] = useState<boolean>(false);
  const [form, setForm] = useState<{ nome: string; zap: string; cidade: string; tipo: 'cuidador' | 'paciente', biografia: string, especialidades: string[] }>({ nome: '', zap: '', cidade: '', tipo: 'cuidador', biografia: '', especialidades: [] });
  const navigate = useNavigate();
  
  const handleToggleEspecialidade = (esp: string) => {
    const newList = form.especialidades.includes(esp) 
      ? form.especialidades.filter((i: string) => i !== esp) 
      : [...form.especialidades, esp];
    setForm({...form, especialidades: newList});
  };

  const handleAuth = async () => {
    if (modo === 'cad' && !concordouLGPD) {
      alert("Para sua segurança e conformidade jurídica, você deve ler e concordar com a Política de Privacidade (LGPD) e os Termos de Uso.");
      return;
    }
    try {
      if(modo === 'cad') {
        const cred = await createUserWithEmailAndPassword(auth, email, senha);
        await setDoc(doc(fs, "usuarios", cred.user.uid), { 
          ...form, 
          whatsapp: form.zap,
          uid: cred.user.uid, 
          rating: 0, 
          totalRatings: 0, 
          identidadeVerificada: false, 
          celularVerificado: false, 
          email: email.toLowerCase(), 
          premium: false, 
          dataCadastro: new Date().toISOString(), 
          documentoEnviado: false, 
          concordouLGPD: true 
        });
        alert("✅ Conta criada com sucesso! \n\nAgora você será direcionado ao seu Painel para completar seu perfil enviando sua foto do RG e validando seu SMS.");
        navigate('/perfil');
      } else { 
        await signInWithEmailAndPassword(auth, email, senha); 
        navigate('/');
      }
    } catch(err: any) { 
      alert(err.message); 
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white p-8 md:p-10 rounded-[30px] border border-slate-100 shadow-xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight mb-2">{modo === 'login' ? 'Bem-vindo' : 'Criar Conta'}</h2>
          <p className="text-slate-500 font-medium">{modo === 'login' ? 'Acesse sua conta para continuar' : 'Junte-se à maior rede de cuidadores'}</p>
        </div>
        
        <div className="space-y-4">
          {modo === 'cad' && (
            <>
              <div className="flex bg-slate-100 p-1 rounded-xl mb-4">
                <button onClick={() => setForm({...form, tipo: 'cuidador'})} className={`flex-1 py-2 rounded-lg font-bold text-xs transition-all ${form.tipo === 'cuidador' ? 'bg-white shadow-sm text-[#007b80]' : 'text-slate-500'}`}>SOU CUIDADOR</button>
                <button onClick={() => setForm({...form, tipo: 'paciente'})} className={`flex-1 py-2 rounded-lg font-bold text-xs transition-all ${form.tipo === 'paciente' ? 'bg-white shadow-sm text-[#007b80]' : 'text-slate-500'}`}>SOU FAMÍLIA</button>
              </div>
              <input className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-[#007b80] outline-none transition-all" placeholder="Nome Completo" value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} />
              <input className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-[#007b80] outline-none transition-all" placeholder="WhatsApp (com DDD)" value={form.zap} onChange={e => setForm({...form, zap: e.target.value})} />
              <input className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-[#007b80] outline-none transition-all" placeholder="Sua Cidade" value={form.cidade} onChange={e => setForm({...form, cidade: e.target.value})} />
              
              {form.tipo === 'cuidador' && (
                <>
                  <textarea 
                    className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-[#007b80] outline-none transition-all h-24" 
                    placeholder="Descreva suas atividades e experiência profissional..." 
                    value={form.biografia} 
                    onChange={e => setForm({...form, biografia: e.target.value})} 
                  />
                  
                  <div className="bg-slate-50 p-4 rounded-xl border-2 border-slate-100 text-left">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-3">Especialidades Técnicas (Selecione)</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-2">
                      {LISTA_ESPECIALIDADES.map(es => {
                        const isChecked = form.especialidades.includes(es);
                        return (
                          <label key={es} className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${isChecked ? 'bg-teal-50 border-teal-200 text-teal-800 font-semibold' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
                            <input type="checkbox" className="hidden" checked={isChecked} onChange={() => handleToggleEspecialidade(es)} />
                            <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${isChecked ? 'bg-[#007b80] border-[#007b80] text-white' : 'border border-slate-300'}`}>
                              {isChecked && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                            </div>
                            <span className="leading-tight">{es}</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                </>
              )}
            </>
          )}
          <input className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-[#007b80] outline-none transition-all" placeholder="Seu melhor e-mail" value={email} onChange={e => setEmail(e.target.value)} />
          <input className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-[#007b80] outline-none transition-all" type="password" placeholder="Sua senha" value={senha} onChange={e => setSenha(e.target.value)} />
          
          {modo === 'cad' && (
            <label className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
              <input type="checkbox" className="mt-1 w-5 h-5 accent-[#007b80]" checked={concordouLGPD} onChange={e => setConcordouLGPD(e.target.checked)} />
              <span className="text-xs text-slate-600 leading-relaxed font-medium">
                Li e concordo com a <strong>Política de Privacidade (LGPD)</strong> e os <strong>Termos de Uso</strong> da plataforma.
              </span>
            </label>
          )}

          <button className="w-full bg-[#007b80] text-white p-5 rounded-2xl font-black text-lg uppercase tracking-wider shadow-lg shadow-[#007b80]/20 hover:scale-[1.02] active:scale-[0.98] transition-all" onClick={handleAuth}>
            {modo === 'login' ? 'ENTRAR AGORA' : 'FINALIZAR CADASTRO'}
          </button>
          
          <button 
            className="w-full bg-transparent border-none text-slate-500 font-bold text-sm hover:text-[#007b80] transition-colors pt-4" 
            onClick={() => setModo(modo === 'login' ? 'cad' : 'login')}
          >
            {modo === 'login' ? 'Ainda não tem conta? Cadastre-se aqui' : 'Já possui uma conta? Faça login'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ------------------------------------------------------------------------------------------
// 14. ESTILOS
// ------------------------------------------------------------------------------------------

const styles = {
  heroBanner: { 
    background: 'linear-gradient(135deg, #007b80 0%, #004d4d 100%)', 
    padding: 'clamp(40px, 8vw, 100px) 20px', 
    color: '#fff', 
    textAlign: 'center' as const, 
    marginBottom: 'clamp(20px, 5vw, 60px)',
    borderRadius: '0 0 30px 30px',
    boxShadow: '0 10px 30px rgba(0,123,128,0.2)',
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    boxSizing: 'border-box' as const,
    minHeight: 'clamp(250px, 35vh, 400px)'
  },
  heroTitle: {
    fontSize: 'clamp(28px, 8vw, 64px)',
    fontWeight: '900',
    margin: '0 0 20px 0',
    textAlign: 'center' as const,
    textTransform: 'uppercase' as const,
    lineHeight: '1.1'
  },
  heroSubtitle: {
    fontSize: 'clamp(14px, 4vw, 20px)',
    opacity: 0.95,
    fontWeight: '400',
    maxWidth: '800px',
    lineHeight: '1.4'
  },
  inputStyle: { width: '100%', padding: 12, borderRadius: 8, border: '1px solid #ddd', marginBottom: 15, boxSizing: 'border-box' as const },
  labelFormMaster: { display: 'block', fontSize: 11, fontWeight: 'bold', color: '#666', marginBottom: 5 },
  modalOverlay: { position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 },
  modalContent: { 
    backgroundColor: '#fff', 
    padding: 'clamp(20px, 5vw, 40px)', 
    borderRadius: 24, 
    width: 'min(95%, 600px)', 
    maxHeight: '90vh', 
    overflowY: 'auto' as const,
    position: 'relative' as const
  },
  modalTitle: { fontSize: 20, marginBottom: 15, fontWeight: 'bold' },
  btnPrimary: { width: '100%', backgroundColor: '#007b80', color: '#fff', border: 'none', padding: 15, borderRadius: 10, fontWeight: 'bold', cursor: 'pointer' },
  btnOutline: { width: '100%', background: 'none', border: '1px solid #ddd', padding: 10, borderRadius: 10, cursor: 'pointer' },
  checkAdminItem: { display: 'block', padding: 10, background: '#f8fafc', borderRadius: 10, marginBottom: 10 },
};

// ------------------------------------------------------------------------------------------
// 15. APP ENTRY POINT
// ------------------------------------------------------------------------------------------

export default function App() {
  const [userAuth, setUserAuth] = useState<FirebaseAuthUser | null>(null);
  const [usuarios, setUsuarios] = useState<UserData[]>([]);
  const [vagas, setVagas] = useState<VagaData[]>([]);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, u => { 
      setUserAuth(u); 
    });
    const unsubUsers = onSnapshot(collection(fs, "usuarios"), snap => {
      setUsuarios(snap.docs.map(d => ({id: d.id, ...d.data()} as UserData)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "usuarios");
    });
    const unsubVagas = onSnapshot(query(collection(fs, 'vagas'), orderBy('ts', 'desc')), snap => {
      setVagas(snap.docs.map(d => ({id: d.id, ...d.data()} as VagaData)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "vagas");
    });
    return () => { unsubAuth(); unsubUsers(); unsubVagas(); };
  }, []);

  const userData = usuarios.find(u => u.uid === userAuth?.uid) || null;
  const handleLogout = () => signOut(auth);
  const isAdmin = userAuth && ADMIN_EMAILS.includes(userAuth.email || "");

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout userAuth={userAuth} onLogout={handleLogout} />}>
            <Route index element={<HomePage usuarios={usuarios} userAuth={userAuth} userData={userData} />} />
            <Route path="vagas" element={<VagasPage vagas={vagas} userAuth={userAuth} userData={userData} />} />
            <Route path="perfil" element={<PerfilPage userAuth={userAuth} userData={userData} usuarios={usuarios} onLogout={handleLogout} />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="artigos" element={<ArtigosHubPage />} />
            <Route path="artigos/lesao-por-pressao" element={<ArtigoLesaoPorPressao />} />
            <Route path="artigos/reanimacao-cardiopulmonar" element={<ArtigoRCP />} />
            <Route path="artigos/banho-no-leito" element={<ArtigoBanhoNoLeito />} />
            {isAdmin && <Route path="admin" element={<AdminDashboard usuarios={usuarios} userAuth={userAuth}/>} />}
            <Route path="sobre" element={<InstitucionalSobrePage />} />
            <Route path="privacidade" element={<InstitucionalPrivacidadePage />} />
            <Route path="termos" element={<InstitucionalTermosPage />} />
            <Route path="cursos" element={<PortalCursosProfissionaisPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

// ------------------------------------------------------------------------------------------
// 16. INICIALIZAÇÃO DO REACT (O MOTOR DE RENDERIZAÇÃO)
// ------------------------------------------------------------------------------------------
const rootElement = document.getElementById('root');
if (rootElement && !rootElement.dataset.rendered) {
  rootElement.dataset.rendered = 'true';
  createRoot(rootElement).render(<App />);
}
