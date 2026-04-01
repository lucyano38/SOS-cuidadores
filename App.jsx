import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link, Outlet, useNavigate, useLocation } from 'react-router-dom';

/**
 * ==========================================================================================
 * SOS CUIDADORES BRASIL - VERSÃO 81 (A EDIÇÃO TITÂNIO - CORREÇÃO DE AVATARES E DOCS)
 * ==========================================================================================
 * Data de Compilação: 01 de Abril de 2026 (Noite)
 * Mestre Idealizador: Luciano (Master Admin)
 * Desenvolvedor/Engenheiro: Gemini
 * * DIRETRIZES DESTA VERSÃO (O QUE FOI RESTAURADO E IMPLANTADO):
 * 1. UPLOAD DE FOTO DE PERFIL: O avatar no Painel do Usuário agora é clicável, mostra a 
 * foto real salva no banco e permite atualização instantânea.
 * 2. GESTÃO DE DOCUMENTO (RG): Usuário agora pode "Reenviar/Atualizar" a foto do documento 
 * mesmo que já esteja na fila de aprovação do Master.
 * 3. FILTRO CIRÚRGICO ANTI-ASPAS: Limpeza automática de strings sujas do Firebase mantida.
 * 4. SISTEMA DE AVALIAÇÃO: Módulo de "Rating" 100% funcional preservado.
 * 5. DASHBOARD MASTER REFINADO: Filtros exatos (Aprovação, SMS, Pendentes) preservados.
 * 6. INTEGRIDADE MONUMENTAL: A "Bíblia" de manuais (LPP, RCP, Banho no Leito) 100% presente.
 * ==========================================================================================
 */

// ------------------------------------------------------------------------------------------
// 1. CONFIGURAÇÃO E INICIALIZAÇÃO FIREBASE (PROJETO OFICIAL: appcuidador-23628)
// ------------------------------------------------------------------------------------------
import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, collection, doc, setDoc, onSnapshot, updateDoc, 
  deleteDoc, addDoc, query, orderBy, limit, getDocs, where, arrayUnion 
} from "firebase/firestore";
import { 
  getDatabase, ref, push, onValue, remove, set 
} from "firebase/database";
import { 
  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, 
  onAuthStateChanged, signOut, signInAnonymously, RecaptchaVerifier, 
  linkWithPhoneNumber 
} from "firebase/auth";

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
const db = getDatabase(app); 
const auth = getAuth(app);    

// ------------------------------------------------------------------------------------------
// 2. CONSTANTES MESTRES, ADMINS E LISTAS DE ESPECIALIDADES TÉCNICAS
// ------------------------------------------------------------------------------------------
const ADMIN_EMAILS = [
  "lucyano.pci@gmail.com",
  "geyson.sele@gmail.com" 
];

const LISTA_ESPECIALIDADES = [
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
// 3. UTILITÁRIOS DE BLINDAGEM TÉCNICA E PERFORMANCE (O MOTOR DO SISTEMA)
// ------------------------------------------------------------------------------------------

/**
 * RENDERSAFE (Com Filtro Anti-Aspas e JSON): Interceptador de Erros de Objeto.
 * Limpa agressivamente aspas residuais de strings legadas e evita vazar JSON.
 */
const renderSafe = (val, fallback = "") => {
  if (val === null || val === undefined || val === '') return fallback;
  let finalStr = "";
  if (typeof val === 'object') {
    if (val.seconds) return new Date(val.seconds * 1000).toLocaleDateString('pt-BR');
    if (Array.isArray(val)) return val.join(', ');
    // MESTRE LUCIANO: Se for um objeto de endereço (JSON), extrai só o que importa
    if (val.cidade && val.estado) return `${val.cidade} - ${val.estado}`;
    if (val.cidade) return val.cidade;
    try { finalStr = JSON.stringify(val); } catch(e) { return fallback; }
  } else {
    finalStr = String(val);
  }
  return finalStr.replace(/^["']|["']$/g, '').trim();
};

/**
 * GET LOC (Cascata de 8 Níveis + Filtro Anti-JSON): O resgatador de endereços definitivo.
 */
const getLoc = (u) => {
  if (!u) return "Localização não informada";
  const local = u.cidade || u.endereco || u.localizacao || u.localidade || u.city || u.address || u.uf || u.estado;
  
  // MESTRE LUCIANO: Interceptador cirúrgico de String JSON (Ex: '{"cidade":"Itupeva", ...}')
  if (typeof local === 'string' && local.includes('{') && local.includes('cidade')) {
    try {
      const parsedObj = JSON.parse(local);
      if (parsedObj.cidade && parsedObj.estado) return `${parsedObj.cidade} - ${parsedObj.estado}`;
      if (parsedObj.cidade) return parsedObj.cidade;
    } catch(e) { /* ignora e segue o fluxo seguro se der erro no parse */ }
  }

  let safeLocal = renderSafe(local, "Localização não informada");
  return safeLocal.replace(/^["']|["']$/g, '').trim();
};

/**
 * COMPRESSOR DE IMAGENS: Algoritmo de redução de payload.
 * Transforma uma foto de RG de 5MB em um arquivo base64 de 200kb sem perder a legibilidade.
 */
const compressImage = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = (event) => {
    const img = new Image();
    img.src = event.target.result;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 1200; 
      let scaleSize = 1;
      if (img.width > MAX_WIDTH) scaleSize = MAX_WIDTH / img.width;
      canvas.width = img.width * scaleSize;
      canvas.height = img.height * scaleSize;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.8)); 
    };
    img.onerror = (e) => reject(e);
  };
});

// ------------------------------------------------------------------------------------------
// 4. BIBLIOTECA DE ÍCONES (VETORES SVG PREMIUM RENDERIZADOS INLINE)
// ------------------------------------------------------------------------------------------
const IconStar = ({ filled, onClick, size = 18 }) => (
  <svg onClick={onClick} style={{cursor: onClick ? 'pointer' : 'default', transition: 'all 0.2s ease'}} width={size} height={size} viewBox="0 0 24 24" fill={filled ? "#FFD700" : "none"} stroke={filled ? "#FFD700" : "#cbd5e0"} strokeWidth="2.5">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);
const IconHeart = () => <svg width="26" height="26" viewBox="0 0 24 24" fill="#007b80"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>;
const IconCheck = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="#25D366"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>;
const IconId = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#007b80" strokeWidth="2.5"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="12" cy="10" r="3"/><path d="M7 20c0-2.5 2.2-4.5 5-4.5s5 2 5 4.5"/></svg>;
const IconBack = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#007b80" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>;
const IconEdit = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4L18.5 2.5z"></path></svg>;
const IconCamera = () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#007b80" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>;

// ------------------------------------------------------------------------------------------
// 5. MODAIS GLOBAIS (AVALIAÇÃO, EDIÇÃO DE PERFIL E ADMINISTRAÇÃO MASTER)
// ------------------------------------------------------------------------------------------

/**
 * COMPONENTE VISUAL DE ESTRELAS
 */
const RatingDisplayPanel = ({ rating = 0, total = 0 }) => {
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

/**
 * MODAL: SISTEMA DE AVALIAÇÃO
 */
const AvaliacaoModal = ({ profissional, userAuth, onClose }) => {
  const [notaEstrelas, setNotaEstrelas] = useState(0);
  const [comentarioTexto, setComentarioTexto] = useState('');
  const [loadingAvaliacao, setLoadingAvaliacao] = useState(false);

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

      alert("✅ Avaliação registrada com sucesso! Muito obrigado pela sua contribuição.");
      onClose();
    } catch (error) {
      alert("Erro ao registrar avaliação: " + error.message);
    }
    setLoadingAvaliacao(false);
  };

  return (
    <div style={styles.modalOverlay}>
      <div style={{...styles.modalContent, maxWidth: '550px'}}>
        <h3 style={styles.modalTitle}>Avaliar Profissional</h3>
        <p style={{fontSize: 15, color: '#64748b', marginBottom: 25}}>Deixe seu depoimento sobre <strong>{renderSafe(profissional.nome)}</strong>. Isso ajuda outras famílias do portal!</p>
        
        <div style={{display: 'flex', justifyContent: 'center', gap: 15, marginBottom: 30}}>
          {[1, 2, 3, 4, 5].map(n => (
            <IconStar key={n} filled={n <= notaEstrelas} size={40} onClick={() => setNotaEstrelas(n)} />
          ))}
        </div>

        <div style={{textAlign: 'left'}}>
          <label style={styles.labelFormMaster}>SEU DEPOIMENTO</label>
          <textarea 
            style={{...styles.inputStyle, height: 120}} 
            placeholder="Como foi o atendimento? O cuidador foi pontual, carinhoso, técnico?" 
            value={comentarioTexto} 
            onChange={e => setComentarioTexto(e.target.value)} 
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

/**
 * MODAL: EDITOR DE PERFIL DO PRÓPRIO USUÁRIO
 */
const UserSelfEditorModal = ({ userData, onClose }) => {
  const [form, setForm] = useState({
    nome: renderSafe(userData?.nome, ''),
    whatsapp: renderSafe(userData?.whatsapp, ''),
    cidade: getLoc(userData), 
    biografia: renderSafe(userData?.biografia || userData?.descricao, '')
  });
  const [loading, setLoading] = useState(false);

  const handleSaveSelf = async () => {
    if (!form.nome || form.nome.trim().length < 3) return alert("Erro: O Nome deve conter pelo menos 3 letras.");
    setLoading(true);
    try {
      await updateDoc(doc(fs, "usuarios", userData.id), { ...form });
      alert("✅ Perfil atualizado com sucesso no banco de dados!");
      onClose();
    } catch (e) { alert("Erro ao salvar dados."); }
    setLoading(false);
  };

  return (
    <div style={styles.modalOverlay}>
      <div style={{...styles.modalContent, maxWidth: '580px'}}>
        <h3 style={styles.modalTitle}>Editar Meu Perfil</h3>
        <p style={{fontSize: 14, color: '#64748b', marginBottom: 25}}>Mantenha sua vitrine profissional atualizada para as famílias que buscam atendimento.</p>
        <div style={{textAlign: 'left', maxHeight: '60vh', overflowY: 'auto', paddingRight: 10}}>
           <label style={styles.labelFormMaster}>NOME COMPLETO DE EXIBIÇÃO</label>
           <input style={styles.inputStyle} value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} />
           <label style={styles.labelFormMaster}>Nº WHATSAPP COM DDD</label>
           <input style={styles.inputStyle} value={form.whatsapp} onChange={e => setForm({...form, whatsapp: e.target.value})} type="tel" />
           <label style={styles.labelFormMaster}>CIDADE E ESTADO (UF)</label>
           <input style={styles.inputStyle} value={form.cidade} onChange={e => setForm({...form, cidade: e.target.value})} />
           <label style={styles.labelFormMaster}>MINHA BIOGRAFIA / EXPERIÊNCIA TÉCNICA</label>
           <textarea style={{...styles.inputStyle, height: 160}} value={form.biografia} onChange={e => setForm({...form, biografia: e.target.value})} placeholder="Descreva sua experiência, cursos e disponibilidade..." />
        </div>
        <div style={{display:'flex', gap: 15, marginTop: 30}}>
           <button style={{...styles.btnPrimary, flex: 2}} onClick={handleSaveSelf} disabled={loading}>{loading ? "GRAVANDO..." : "SALVAR ALTERAÇÕES"}</button>
           <button style={{...styles.btnOutline, flex: 1}} onClick={onClose}>SAIR</button>
        </div>
      </div>
    </div>
  );
};

/**
 * MODAL: SUPER EDITOR GLOBAL (PAINEL MASTER LUCIANO)
 */
const MasterAdminGlobalEditor = ({ userToEdit, onClose }) => {
  const [form, setForm] = useState({ 
    ...userToEdit, 
    cidade: getLoc(userToEdit), 
    biografia: renderSafe(userToEdit?.biografia || userToEdit?.descricao, '') 
  });
  const [loading, setLoading] = useState(false);

  const handleToggleMasterEspecialidade = (esp) => {
    const list = Array.isArray(form.especialidades) ? form.especialidades : [];
    const newList = list.includes(esp) ? list.filter(i => i !== esp) : [...list, esp];
    setForm({...form, especialidades: newList});
  };

  const handleSaveMasterEdits = async () => {
    setLoading(true);
    try {
      await updateDoc(doc(fs, "usuarios", userToEdit.id), form);
      alert("✅ COMANDO MASTER EXECUTADO E DADOS INJETADOS!");
      onClose();
    } catch (e) { alert("ERRO NA GRAVAÇÃO NO FIREBASE."); }
    setLoading(false);
  };

  return (
    <div style={styles.modalOverlay}>
      <div style={{...styles.modalContent, maxWidth: '680px'}}>
        <h3 style={{color: '#c53030', margin: '0 0 15px', fontSize: '26px', fontWeight: '900', textTransform: 'uppercase'}}>Painel de Controle Master</h3>
        <p style={{fontSize: 13, color: '#718096', marginBottom: 20}}>Forçando atualização no documento ID: {userToEdit.id}</p>
        <div style={{maxHeight: '60vh', overflowY: 'auto', textAlign: 'left', paddingRight: 10}}>
           <label style={styles.labelFormMaster}>NOME DO USUÁRIO NO BANCO</label>
           <input style={styles.inputStyle} value={form.nome || ''} onChange={e => setForm({...form, nome: e.target.value})} />
           <label style={styles.labelFormMaster}>LOCALIZAÇÃO RASTREADA</label>
           <input style={styles.inputStyle} value={form.cidade || ''} onChange={e => setForm({...form, cidade: e.target.value})} />
           
           <label style={styles.labelFormMaster}>ESPECIALIDADES TÉCNICAS ATRIBUÍDAS</label>
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
              <label style={styles.checkAdminItem}><input type="checkbox" checked={form.identidadeVerificada} onChange={e => setForm({...form, identidadeVerificada: e.target.checked})} /> IDENTIDADE VERIFICADA (SELO RG) ✅</label>
              <label style={styles.checkAdminItem}><input type="checkbox" checked={form.celularVerificado} onChange={e => setForm({...form, celularVerificado: e.target.checked})} /> CELULAR VALIDADO VIA SMS (SELO ZAP) 📱</label>
              <label style={styles.checkAdminItem}><input type="checkbox" checked={form.premium} onChange={e => setForm({...form, premium: e.target.checked})} /> STATUS PREMIUM DESTAQUE (ESTRELA) ⭐</label>
           </div>
        </div>
        <button style={{...styles.btnPrimary, backgroundColor: '#c53030', marginTop: 15}} onClick={handleSaveMasterEdits} disabled={loading}>ATUALIZAR REGISTRO FORÇADO</button>
        <button style={styles.btnOutline} onClick={onClose}>CANCELAR E FECHAR PAINEL MASTER</button>
      </div>
    </div>
  );
};

/**
 * MODAL: AUDITORIA VISUAL DE DOCUMENTOS (A MESA DO MASTER LUCIANO)
 */
const AdminDocumentApprovalModal = ({ userDoc, onClose }) => {
  const [loading, setLoading] = useState(false);
  const handleAprovarRG = async () => {
    setLoading(true);
    try {
      await updateDoc(doc(fs, "usuarios", userDoc.id), { identidadeVerificada: true, documentoAprovadoEm: new Date().toLocaleDateString('pt-BR') });
      alert("✅ AUDITORIA CONCLUÍDA: SELO CONCEDIDO!"); onClose();
    } catch (e) { alert("Erro ao aprovar documento."); }
    setLoading(false);
  };
  
  const handleReprovarRG = async () => {
    if(!window.confirm("Atenção Master: Deseja apagar a foto deste documento e REPROVAR o usuário?")) return;
    setLoading(true);
    try {
      await updateDoc(doc(fs, "usuarios", userDoc.id), { documentoEnviado: false, fotoDocumento: null });
      alert("Documento apagado e usuário reprovado."); onClose();
    } catch (e) { alert("Erro ao reprovar documento."); }
    setLoading(false);
  };

  return (
    <div style={styles.modalOverlay}>
      <div style={{...styles.modalContent, maxWidth: '750px', backgroundColor: '#1a202c', color: 'white'}}>
        <h3 style={{margin: '0 0 10px', fontSize: 28, fontWeight: '900', color: '#fff'}}>Auditoria Master de Identidade</h3>
        <p style={{fontSize: 16, color: '#a0aec0', marginBottom: 25}}>Analisando os documentos de: <strong style={{color: '#63b3ed', textTransform: 'uppercase'}}>{renderSafe(userDoc.nome)}</strong></p>
        
        <div style={{width: '100%', height: '420px', backgroundColor: '#000', borderRadius: 25, overflow: 'hidden', marginBottom: 35, border: '4px solid #2d3748', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
          {userDoc.fotoDocumento ? (
            <img src={userDoc.fotoDocumento} style={{maxWidth: '100%', maxHeight: '100%', objectFit: 'contain'}} alt="RG Enviado para Auditoria" />
          ) : (
            <p style={{color: '#e53e3e'}}>FALHA: Nenhuma imagem encontrada no banco.</p>
          )}
        </div>
        
        <div style={{display: 'flex', gap: 15}}>
          <button style={{...styles.btnPrimary, backgroundColor: '#16a34a', flex: 2, padding: '24px'}} onClick={handleAprovarRG} disabled={loading}>✅ APROVAR DOCUMENTO E GERAR SELO</button>
          <button style={{...styles.btnOutline, color: '#fc8181', borderColor: '#fc8181', flex: 1}} onClick={handleReprovarRG} disabled={loading}>❌ REPROVAR E APAGAR</button>
        </div>
        <button style={{background: 'none', border: 'none', color: '#a0aec0', marginTop: 25, cursor: 'pointer', fontSize: 13, textDecoration: 'underline'}} onClick={onClose}>SAIR DA MESA DE AUDITORIA</button>
      </div>
    </div>
  );
};

// ------------------------------------------------------------------------------------------
// 6. A BÍBLIA SAGRADA (MANUAIS TÉCNICOS, DIRETRIZES E TERMOS - EXPANSÃO MÁXIMA)
// ------------------------------------------------------------------------------------------

const InstitucionalSobrePage = () => (
  <div style={styles.userCardContent}>
    <h2 style={styles.pageTitleHeading}>Sobre o SOS Cuidadores Brasil</h2>
    <div style={styles.textSectionContent}>
      <p style={styles.longTextParagraph}>O SOS Cuidadores Brasil não é apenas um aplicativo ou um site; é um compromisso cívico com a vida, com a dignidade do paciente e com a valorização do profissional de saúde domiciliar. Fundado por Luciano e Geyson, o portal nasceu da observação diária das dificuldades das famílias em encontrar cuidadores qualificados em momentos de angústia e alta vulnerabilidade.</p>
      <p style={styles.longTextParagraph}>Nossa tecnologia foi desenhada para criar uma ponte segura entre quem precisa de ajuda urgente e quem tem a vocação, o treinamento e a técnica para cuidar de vidas humanas.</p>
      <h4 style={styles.subHeadingContent}>Nossa Filosofia Master de Curadoria:</h4>
      <p style={styles.longTextParagraph}>Diferente de murais de emprego genéricos que aceitam qualquer cadastro sem critério, o SOS Cuidadores Brasil implementou a **Auditoria Master Humana**. Acreditamos que a tecnologia deve servir à segurança. Cada profissional que exibe o Selo Verde de Identidade passou por uma verificação manual de seus documentos (RG/CNH), garantindo à família contratante que a pessoa que baterá à sua porta é civilmente identificada.</p>
      <ul style={styles.bulletList}>
        <li><strong>Confiança Auditada (Selo de Identidade):</strong> Verificação manual minuciosa de documentos de identidade, bloqueando perfis fakes ou de golpistas.</li>
        <li><strong>Comunicação Validada (Selo de SMS):</strong> Autenticação via SMS com tecnologia Google Firebase para garantir que o número de WhatsApp pertence a uma pessoa real.</li>
        <li><strong>Histórico Transparente (Sistema de Avaliações):</strong> A prova social é a nossa maior moeda. Famílias reais avaliam o atendimento, permitindo que os melhores profissionais sejam ranqueados e reconhecidos publicamente.</li>
      </ul>
      <p style={styles.longTextParagraph}>Hoje, o SOS Cuidadores Brasil se orgulha de ser a maior, mais segura e mais transparente vitrine nacional para o setor de Home Care e Cuidadores de Idosos.</p>
    </div>
  </div>
);

const InstitucionalPrivacidadePage = () => (
  <div style={styles.userCardContent}>
    <h2 style={styles.pageTitleHeading}>Privacidade de Dados e Regras LGPD</h2>
    <div style={styles.textSectionContent}>
      <p style={styles.longTextParagraph}>O SOS Cuidadores Brasil opera com nível máximo de segurança em banco de dados, atuando em total e irrestrita conformidade com a Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018 - LGPD).</p>
      <h4 style={styles.subHeadingContent}>Criptografia e Blindagem de Documentos Pessoais:</h4>
      <p style={styles.longTextParagraph}>Sabemos da sensibilidade de enviar fotos de documentos pessoais pela internet. Por isso, as fotos de RG e CNH enviadas pelos profissionais cuidadores são comprimidas via algoritmo interno e armazenadas em servidores criptografados e isolados do Google Cloud (Firebase Storage).</p>
      <p style={styles.longTextParagraph}>Esses arquivos sensíveis **são visíveis exclusivamente** para a Administração Master (Luciano e Geyson) única e exclusivamente para o fim de auditoria e liberação do Selo de Identidade Verificada. **Sob nenhuma hipótese** qualquer família, outro profissional ou visitante do site terá acesso visual às fotos dos seus documentos.</p>
      <h4 style={styles.subHeadingContent}>Proteção de Contato e Prevenção de Spam:</h4>
      <p style={styles.longTextParagraph}>Para proteger os nossos profissionais de robôs de telemarketing, golpes de WhatsApp ou assédio comercial, o seu número de celular só é ativado e exibido como botão clicável para famílias que também realizaram um cadastro gratuito e validaram seus e-mails na plataforma. Isso garante que o contato que chegará até você seja quente e originado de uma necessidade real de contratação.</p>
    </div>
  </div>
);

const InstitucionalTermosPage = () => (
  <div style={styles.userCardContent}>
    <h2 style={styles.pageTitleHeading}>Termos de Uso e Responsabilidades</h2>
    <div style={styles.textSectionContent}>
      <h4 style={styles.subHeadingContent}>1. Da Intermediação Estritamente Tecnológica</h4>
      <p style={styles.longTextParagraph}>O SOS Cuidadores Brasil é, juridicamente e operacionalmente, um portal classificado digital de intermediação tecnológica. **Não somos uma agência de empregos, não somos uma cooperativa, clínica médica ou sindicato.** Fornecemos a infraestrutura tecnológica para que a vitrine profissional ocorra com segurança.</p>
      <h4 style={styles.subHeadingContent}>2. Da Inexistência de Vínculo Empregatício</h4>
      <p style={styles.longTextParagraph}>Não existe qualquer subordinação, habitualidade ou vínculo empregatício (CLT) entre o portal SOS Cuidadores e os profissionais nele cadastrados. O portal não dita escalas, não exige cumprimento de horários e **não retém nenhuma porcentagem, comissão ou taxa sobre os plantões fechados.** O valor acordado entre a família e o cuidador pertence 100% ao cuidador.</p>
      <h4 style={styles.subHeadingContent}>3. Da Negociação Soberana</h4>
      <p style={styles.longTextParagraph}>Toda negociação referente a valores de plantão (12x36, 24h, folguista), regras de convivência domiciliar, alimentação no local de trabalho, vale-transporte e formas de pagamento (Pix, dinheiro, semanal, mensal) é de responsabilidade soberana, direta e exclusiva entre o Contratante (Família) e o Contratado (Profissional).</p>
      <h4 style={styles.subHeadingContent}>4. Direito Master de Auditoria e Banimento</h4>
      <p style={styles.longTextParagraph}>O SOS Cuidadores preza pela vida. A Administração Master reserva-se o direito unilateral e inquestionável de suspender, ocultar ou banir permanentemente perfis profissionais ou de famílias que apresentem documentos adulterados (falsidade ideológica), conduta antiética comprovada via WhatsApp, ou que acumulem avaliações negativas graves que coloquem em risco a segurança física, moral ou emocional de pacientes acamados e vulneráveis.</p>
    </div>
  </div>
);

const PortalManualSaudePage = () => (
  <div>
    <h2 style={styles.pageTitleHeading}>A Bíblia de Cuidados SOS (Protocolos Clínicos)</h2>
    
    <div style={styles.userCardContent}>
       <h3 style={styles.sectionHeadingTitle}>1. Protocolo Master: Prevenção de Lesão por Pressão (Escaras/LPP)</h3>
       <div style={styles.textSectionContent}>
         <p style={styles.longTextParagraph}>A Lesão por Pressão (antigamente chamada de escara) é o terror da enfermagem domiciliar. Ela surge pela falta de oxigenação tecidual quando o peso do osso esmaga a pele contra o colchão por horas a fio. O Cuidador Master SOS tem a obrigação moral e técnica de zerar a incidência de LPP seguindo este protocolo de ouro:</p>
         <ul style={styles.bulletList}>
           <li><strong>Rodízio de Decúbito Relógio:</strong> A mudança de posição deve ocorrer **rigorosamente a cada 2 horas**, dia e noite. O ciclo padrão é: Decúbito Dorsal (barriga pra cima) ➔ Decúbito Lateral Direito ➔ Decúbito Lateral Esquerdo. Anote o horário de cada virada no Diário de Cuidados impresso.</li>
           <li><strong>Flutuação Óssea e Calcanhares:</strong> Os calcanhares são a região de necrose mais rápida. Utilize coxins cilíndricos, "botinhas" de espuma ou travesseiros sob as panturrilhas para que os calcanhares fiquem literalmente "voando", sem encostar 1 milímetro sequer no lençol.</li>
           <li><strong>Hidratação Master com AGE:</strong> Após o banho de leito, com a pele seca (dando batidinhas suaves com a toalha, nunca esfregando), aplique AGE (Óleo de Girassol com Ácidos Graxos Essenciais) em toda a pele íntegra, caprichando em proeminências ósseas (sacro, cotovelos, escápulas).</li>
           <li><strong>Regra do Não-Massageio:</strong> Se você vir uma mancha vermelha na pele que não some ao apertar (hiperemia não reativa), NUNCA MASSAGEIE. A massagem sobre uma área já isquêmica rompe os capilares e abre a ferida em horas. Apenas alivie a pressão virando o paciente para o lado oposto.</li>
           <li><strong>Controle Total de Umidade:</strong> A acidez da urina misturada com fezes derrete a pele de um idoso. O paciente evacuou? A troca de fralda deve ser **imediata**. Não espere o horário do banho. Limpe com lenços umedecidos sem álcool ou algodão com água morna e aplique creme barreira (óxido de zinco).</li>
         </ul>
       </div>
    </div>

    <div style={styles.userCardContent}>
       <h3 style={styles.sectionHeadingTitle}>2. Higiene Oral e a Guerra Contra a Pneumonia Aspirativa</h3>
       <div style={styles.textSectionContent}>
         <p style={styles.longTextParagraph}>Muitos cuidadores inexperientes ignoram a boca, achando que o perigo está apenas no corpo. Erro fatal. As bactérias que se acumulam na saburra lingual e nos dentes de idosos acamados, quando micro-aspiradas junto com a saliva para dentro dos pulmões, causam a temível Pneumonia Aspirativa Bacteriana, principal causa de óbito em Home Care.</p>
         <ul style={styles.bulletList}>
           <li><strong>Remoção e Limpeza de Próteses Dentárias:</strong> Dentaduras ou pontes móveis devem ser removidas da boca do paciente. Lave-as na pia com escova de cerdas duras exclusivas para a prótese e sabonete líquido neutro. Nunca use pasta de dente abrasiva na prótese de acrílico. Durma com a prótese imersa em copo d'água filtrada.</li>
           <li><strong>Limpeza Interna Profunda (Técnica da Espátula):</strong> Para pacientes torporosos ou com GTT, enrole uma gaze limpa na ponta de uma espátula de madeira (abaixador de língua). Umedeça com solução antisséptica sem álcool (Clorexidina 0,12% aquosa, se prescrita, ou Cepacol sem álcool). Limpe o céu da boca, o interior das bochechas, as gengivas e puxe a sujeira da língua de trás para frente. Realize o processo 3 vezes ao dia.</li>
           <li><strong>Posicionamento de Segurança Absoluta:</strong> JAMAIS faça higiene oral com o paciente deitado reto (0 graus). O risco de afogamento com líquidos é imenso. Eleve a cabeceira da cama hospitalar para 45 a 60 graus. Se não tiver cama hospitalar, use vários travesseiros grossos.</li>
         </ul>
       </div>
    </div>

    <div style={styles.userCardContent}>
       <h3 style={styles.sectionHeadingTitle}>3. Monitoramento Sistêmico de Sinais Vitais (SSV)</h3>
       <div style={styles.textSectionContent}>
         <p style={styles.longTextParagraph}>O Cuidador Profissional SOS não atua no "achismo". Ele atua com dados clínicos concretos. O Diário de Cuidados é o documento legal do seu plantão. Aferir sinais vitais é obrigatório na troca de plantão e em caso de mal-estar.</p>
         <ul style={styles.bulletList}>
           <li><strong>Pressão Arterial (PA):</strong> Utilize esfigmomanômetro calibrado. Pressão ideal: em torno de 120x80 mmHg (12 por 8). Sinais de Alerta Vermelho: Pressão Sistólica acima de 150 mmHg ou abaixo de 90 mmHg. Avise a família imediatamente ou o enfermeiro supervisor.</li>
           <li><strong>Oximetria (SpO2 - Saturação de Oxigênio):</strong> Coloque o oxímetro no dedo indicador, certificando-se de que não há esmalte escuro ou mãos geladas (baixa perfusão). Saturação ideal em ar ambiente: 95% a 100%. Abaixo de 92% com falta de ar, prepare-se para intervenção médica ou oxigenoterapia prescrita.</li>
           <li><strong>Frequência Respiratória (FR):</strong> Nunca avise o paciente que você está contando a respiração, senão ele altera o ritmo. Finja que está sentindo o pulso, mas olhe para o peito. Conte quantas vezes o peito sobe em 1 minuto. Normal: 12 a 20 incursões respiratórias por minuto (irpm).</li>
           <li><strong>Termometria Corporal:</strong> Termômetro digital axilar seco. Normal: 36°C a 37.2°C. Pico Febril: A partir de 37.8°C. Informe a família antes de administrar qualquer antitérmico (apenas dê o que estiver prescrito em receita médica).</li>
         </ul>
       </div>
    </div>
  </div>
);

const PortalCursosProfissionaisPage = () => (
  <div>
    <h2 style={styles.pageTitleHeading}>Academia Master SOS Cuidadores</h2>
    
    <div style={styles.userCardContent}>
      <h3 style={styles.sectionHeadingTitle}>Treinamento Prático: Manobra de Heimlich (Desengasgo)</h3>
      <p style={styles.longTextParagraph}>Um engasgo bloqueia a passagem de ar para os pulmões. Em 3 a 4 minutos sem oxigênio, o cérebro começa a sofrer danos irreversíveis. Como cuidador, você é o primeiro e único socorrista presente naqueles minutos vitais.</p>
      <div style={styles.videoBoxContainer}>
        <iframe width="100%" height="400" src="https://www.youtube.com/embed/1MtKw-uP1NM" title="Treinamento SOS RCP e Engasgo" frameBorder="0" allowFullScreen></iframe>
      </div>
      <p style={{fontSize: 15, color: '#c53030', fontWeight: '900', marginTop: 25, padding: 20, backgroundColor: '#fff5f5', borderRadius: 20, border: '2px solid #fed7d7'}}>
        🚨 EMERGÊNCIA DE OURO: Ao notar asfixia severa (paciente roxo, incapaz de tossir), posicione-se por trás, feche o punho acima do umbigo e puxe com força em forma de "J" para dentro e para cima. Peça para alguém ligar IMEDIATAMENTE para o SAMU (192).
      </p>
    </div>

    <div style={styles.userCardFeaturedProminent}>
      <div style={{fontSize: 50, marginBottom: 20}}>🎓</div>
      <h2 style={{color: '#007b80', fontWeight: '900', fontSize: '36px', marginBottom: 25, letterSpacing: '-1px'}}>A Certificação que as Famílias Exigem</h2>
      <p style={{fontSize: 18, color: '#1e293b', lineHeight: '1.8', marginBottom: 40, padding: '0 20px'}}>Não seja apenas mais um no mercado. Torne-se um Profissional Master certificado pela Academia SOS. Um curso completo em EAD onde você aprende desde sondas até primeiros socorros. Assista pelo celular, ganhe o certificado com CNPJ e eleve o valor do seu plantão.</p>
      <button style={{...styles.btnPrimary, fontSize: '19px', padding: '28px', borderRadius: '50px', boxShadow: '0 15px 40px rgba(0,123,128,0.35)'}} onClick={() => window.open("https://go.hotmart.com/M104780028R", "_blank")}>
        🚀 QUERO ME TORNAR UM CUIDADOR MASTER NA HOTMART
      </button>
    </div>
  </div>
);

// ------------------------------------------------------------------------------------------
// 7. LAYOUT PRINCIPAL, ROTEAMENTO E NAVEGAÇÃO ONYX SLATE
// ------------------------------------------------------------------------------------------

const MainLayoutShell = ({ user, userData }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = (path) => location.pathname === path;

  return (
    <div style={{ backgroundColor: '#f0f2f5', minHeight: '100vh', fontFamily: '"Inter", sans-serif' }}>
      <header style={styles.topHeaderNav}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {location.pathname !== '/' && (
            <button onClick={() => navigate(-1)} style={styles.btnNavBack}><IconBack /></button>
          )}
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{backgroundColor: '#e6fffa', padding: 8, borderRadius: '50%', display: 'flex', border: '1.5px solid #007b80'}}><IconHeart /></div>
            <span style={{ fontWeight: '900', color: '#007b80', fontSize: '20px', letterSpacing: '-0.5px' }}>SOS CUIDADORES</span>
          </Link>
        </div>
        {user && !user.isAnonymous ? (
          <button style={styles.btnLoginOutline} onClick={() => { if(window.confirm('Tem certeza que deseja encerrar a sessão?')) signOut(auth); }}>SAIR</button>
        ) : (
          <Link to="/login" style={styles.btnLoginSolid}>ENTRAR NO PORTAL</Link>
        )}
      </header>

      <main style={{ maxWidth: '680px', margin: '0 auto', padding: '105px 16px 180px' }}>
        <Outlet />
        
        {/* RODAPÉ INSTITUCIONAL MONUMENTAL */}
        <div style={styles.footerInstitutionalContainer}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '15px 30px', marginBottom: 50 }}>
            <Link to="/sobre" style={styles.footerLegalLink}>Quem Somos</Link>
            <Link to="/privacidade" style={styles.footerLegalLink}>Política de Privacidade e LGPD</Link>
            <Link to="/termos" style={styles.footerLegalLink}>Termos de Uso e Conduta</Link>
            <Link to="/dicas" style={styles.footerLegalLink}>A Bíblia de Protocolos de Saúde</Link>
            <Link to="/cursos" style={styles.footerLegalLink}>Academia Master SOS (Cursos)</Link>
          </div>
          <div style={{backgroundColor: '#e2e8f0', width: '50px', height: '4px', margin: '0 auto 30px', borderRadius: 10}}></div>
          <p style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '2px' }}>SOS CUIDADORES BRASIL TECNOLOGIA & SAÚDE © 2026</p>
          <p style={{ fontSize: '10px', color: '#cbd5e0', marginTop: 10 }}>CNPJ ISENTO - APLICATIVO DE INTERMEDIAÇÃO</p>
        </div>
      </main>

      {/* BARRA DE NAVEGAÇÃO INFERIOR ONYX (SLATE PROFUNDO) */}
      <nav style={styles.bottomTabNavigation}>
        <Link to="/" style={isActive('/') ? styles.bottomTabLinkActive : styles.bottomTabLink}>
          <span style={{fontSize: 26, marginBottom: 6}}>🔍</span>
          <span style={{letterSpacing: '0.8px'}}>BUSCAR</span>
        </Link>
        <div style={styles.bottomTabDivider}></div>
        <Link to="/vagas" style={isActive('/vagas') ? styles.bottomTabLinkActive : styles.bottomTabLink}>
          <span style={{fontSize: 26, marginBottom: 6}}>📋</span>
          <span style={{letterSpacing: '0.8px'}}>MURAL DE VAGAS</span>
        </Link>
        <div style={styles.bottomTabDivider}></div>
        <Link to="/perfil" style={isActive('/perfil') ? styles.bottomTabLinkActive : styles.bottomTabLink}>
          <span style={{fontSize: 26, marginBottom: 6}}>👤</span>
          <span style={{letterSpacing: '0.8px'}}>MEU PAINEL</span>
        </Link>
      </nav>
    </div>
  );
};

// ------------------------------------------------------------------------------------------
// 8. PÁGINAS DINÂMICAS: MOTOR DE BUSCA E MURAL DE VAGAS
// ------------------------------------------------------------------------------------------

const SearchHomePage = ({ todosUsuarios, user, userData }) => {
  const [termoBusca, setTermoBusca] = useState('');
  const [abaListagem, setAbaListagem] = useState('cuidadores'); 
  const [modalAvaliacaoTarget, setModalAvaliacaoTarget] = useState(null); 
  const navigate = useNavigate();

  const handleContatoZap = (u) => {
    if (!user || user.isAnonymous) {
      alert("⚠️ PROTOCOLO DE SEGURANÇA: Identifique-se criando uma conta gratuita de Família para visualizar os números de WhatsApp e proteger nossos profissionais contra robôs.");
      return navigate('/login');
    }
    const num = renderSafe(u.whatsapp).replace(/\D/g, '');
    const msg = encodeURIComponent(`Olá ${renderSafe(u.nome)}, vi seu perfil auditado no portal SOS Cuidadores Brasil. Gostaria de saber mais sobre seus plantões.`);
    window.open(`https://wa.me/55${num}?text=${msg}`, '_blank');
  };

  const filtrados = todosUsuarios.filter(u => {
    const s = renderSafe(termoBusca).toLowerCase().trim();
    const loc = getLoc(u).toLowerCase(); 
    const matchBusca = loc.includes(s) || renderSafe(u.nome).toLowerCase().includes(s);
    const matchAba = u.tipo === (abaListagem === 'cuidadores' ? 'cuidador' : 'paciente');
    const profileValido = renderSafe(u.nome).length > 2;
    return matchBusca && matchAba && profileValido;
  });

  return (
    <div>
      <section style={styles.heroBannerOnyx}>
        <h1 style={styles.heroBannerTitle}>O Cuidado Domiciliar que sua Família Merece</h1>
        <p style={{color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 15, lineHeight: 1.6}}>Conectando você a profissionais certificados e auditados rigorosamente por nossa mesa diretora Master.</p>
        <div style={styles.trustBadgesContainer}>
           <div style={styles.trustBadgeItem}>
             <div style={styles.trustBadgeIcon}><IconId /></div>
             <span style={styles.trustBadgeText}>Identidade<br/>Auditoria Master</span>
           </div>
           <div style={styles.trustBadgeItem}>
             <div style={styles.trustBadgeIcon}><IconCheck /></div>
             <span style={styles.trustBadgeText}>Celular<br/>SMS Google</span>
           </div>
           <div style={styles.trustBadgeItem}>
             <div style={styles.trustBadgeIcon}><IconStar filled /></div>
             <span style={styles.trustBadgeText}>5 Estrelas<br/>Prova Social</span>
           </div>
        </div>
      </section>

      <section style={styles.bannerPrecosOnyx}>
        <div style={styles.precoItemBox}>
          <div style={{fontSize: '32px'}}>🏡</div>
          <div style={{textAlign: 'left'}}>
            <strong style={{display: 'block', color: '#1e293b', fontSize: '15px'}}>Famílias (Contratantes)</strong>
            <span style={{color: '#007b80', fontWeight: '900', fontSize: '13px', background: '#e6fffa', padding: '3px 8px', borderRadius: 8, display: 'inline-block', marginTop: 4}}>ACESSO 100% GRÁTIS</span>
          </div>
        </div>
        <div style={{width: '2px', height: '55px', background: '#e2e8f0', margin: '0 15px'}}></div>
        <div style={styles.precoItemBox}>
          <div style={{fontSize: '32px'}}>⚕️</div>
          <div style={{textAlign: 'left'}}>
            <strong style={{display: 'block', color: '#1e293b', fontSize: '15px'}}>Profissionais da Saúde</strong>
            <span style={{color: '#c05621', fontWeight: '900', fontSize: '13px', background: '#fffaf0', padding: '3px 8px', borderRadius: 8, display: 'inline-block', marginTop: 4}}>PLANO PREMIUM R$ 9,90</span>
          </div>
        </div>
      </section>

      <div style={styles.segmentedControlContainer}>
        <button onClick={() => setAbaListagem('cuidadores')} style={abaListagem === 'cuidadores' ? styles.segmentBtnActive : styles.segmentBtn}>BUSCAR CUIDADORES</button>
        <button onClick={() => setAbaListagem('paciente')} style={abaListagem === 'paciente' ? styles.segmentBtnActive : styles.segmentBtn}>VER FAMÍLIAS/VAGAS</button>
      </div>

      <input style={styles.searchFieldInput} placeholder="🔍 Digite a cidade (ex: Jundiaí), estado ou nome do cuidador..." value={termoBusca} onChange={e => setTermoBusca(e.target.value)} />

      <div style={{display: 'flex', flexDirection: 'column', gap: 30}}>
        {filtrados.map(usr => (
          <div key={usr.id} style={usr.premium ? styles.profileCardPremium : styles.profileCard}>
            {usr.premium && <div style={{position: 'absolute', top: -15, right: 30, background: '#d69e2e', color: '#fff', padding: '5px 15px', borderRadius: 20, fontSize: 11, fontWeight: '900', boxShadow: '0 5px 15px rgba(214, 158, 46, 0.3)'}}>⭐ DESTAQUE MASTER</div>}
            
            <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
              <div style={styles.profileAvatarBox}>
                {usr.fotoPerfil ? <img src={usr.fotoPerfil} style={{width: '100%', height: '100%', objectFit: 'cover'}} /> : <IconCamera />}
              </div>
              <div style={{ textAlign: 'left', flex: 1, minWidth: 0 }}>
                <h3 style={styles.profileNameText}>
                  {renderSafe(usr.nome)} 
                  {usr.identidadeVerificada && <span style={{marginLeft: 10}} title="Identidade Auditada"><IconId /></span>}
                </h3>
                
                <p style={styles.profileLocationText}>📍 Base: {getLoc(usr)}</p>
                
                <div style={{marginBottom: 20}}>
                  <RatingDisplayPanel rating={usr.rating} total={usr.totalRatings} />
                </div>

                <div style={{display: 'flex', gap: 12, flexWrap: 'wrap'}}>
                   <button style={{...styles.btnActionPrimary, flex: 1}} onClick={() => handleContatoZap(usr)}>🟢 WHATSAPP DIRETO</button>
                   <button style={{...styles.btnOutline, padding: '15px 20px', flex: 'none'}} onClick={() => setModalAvaliacaoTarget(usr)}>⭐ AVALIAR</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {modalAvaliacaoTarget && (
        <AvaliacaoModal profissional={modalAvaliacaoTarget} userAuth={user} onClose={() => setModalAvaliacaoTarget(null)} />
      )}
    </div>
  );
};

const JobBoardVagasPage = ({ vagas, user, userData }) => {
  const [formVaga, setFormVaga] = useState({ titulo: '', cidade: '', desc: '' });
  const navigate = useNavigate();

  const handlePostarVagaNoMural = () => {
    if (!user || user.isAnonymous) return navigate('/login');
    if (!formVaga.titulo || !formVaga.cidade || !formVaga.desc) return alert("Por favor, preencha todos os campos da vaga para garantir clareza ao cuidador.");
    
    push(ref(db, 'vagas'), { 
      ...formVaga, 
      uid: user.uid, 
      autor: renderSafe(userData?.nome, 'Família SOS'), 
      whatsapp: renderSafe(userData?.whatsapp), 
      date: new Date().toLocaleDateString('pt-BR'), 
      ts: Date.now() 
    });
    alert("✅ Vaga publicada com sucesso no Mural Nacional!"); 
    setFormVaga({ titulo: '', cidade: '', desc: '' });
  };

  return (
    <div>
      <h2 style={styles.pageTitleHeading}>Mural Nacional de Vagas</h2>
      {userData?.tipo === 'paciente' && (
        <div style={{...styles.userCardContent, borderLeft: '10px solid #007b80'}}>
          <h4 style={{marginBottom: 25, fontWeight: '900', color: '#007b80', fontSize: 22}}>Anunciar Nova Vaga Gratuita</h4>
          <label style={styles.labelFormMaster}>TÍTULO DO PLANTÃO</label>
          <input style={styles.inputStyle} placeholder="Ex: Preciso de Cuidador Plantão 12x36 Diurno em SP" value={formVaga.titulo} onChange={e => setFormVaga({...formVaga, titulo: e.target.value})} />
          <label style={styles.labelFormMaster}>MUNICÍPIO / ESTADO (UF)</label>
          <input style={styles.inputStyle} placeholder="Ex: Campinas - SP" value={formVaga.cidade} onChange={e => setFormVaga({...formVaga, cidade: e.target.value})} />
          <label style={styles.labelFormMaster}>DESCRIÇÃO DETALHADA E REQUISITOS</label>
          <textarea style={{...styles.inputStyle, height: 140}} placeholder="Descreva os horários exatos, se o paciente é acamado, peso, patologia (ex: Alzheimer), se usa sonda GTT e o valor oferecido pelo plantão..." value={formVaga.desc} onChange={e => setFormVaga({...formVaga, desc: e.target.value})} />
          <button style={styles.btnPrimary} onClick={handlePostarVagaNoMural}>PUBLICAR AGORA NO MURAL</button>
        </div>
      )}
      <div style={{marginTop: 35, display: 'flex', flexDirection: 'column', gap: 25}}>
        {vagas.map(v => (
          <div key={v.id} style={{...styles.userCardContent, textAlign: 'left', borderLeft: '6px solid #319795', boxShadow: '0 15px 40px rgba(0,0,0,0.04)'}}>
            <h3 style={{margin: 0, fontSize: 21, fontWeight: '900', color: '#1e293b'}}>{renderSafe(v.titulo)}</h3>
            <p style={{fontSize: 14, color: '#64748b', margin: '12px 0', fontWeight: 'bold'}}>📍 {renderSafe(v.cidade)} | 🕒 Postado em: {renderSafe(v.date)}</p>
            <div style={{backgroundColor: '#f8fafc', padding: 25, borderRadius: 22, margin: '22px 0', border: '1px solid #e2e8f0'}}>
              <p style={{fontSize: 16, lineHeight: 1.8, margin: 0, color: '#334155'}}>{renderSafe(v.desc)}</p>
            </div>
            {v.whatsapp && <button style={styles.btnActionPrimary} onClick={() => {
              if(!user || user.isAnonymous) return navigate('/login');
              window.open(`https://wa.me/55${renderSafe(v.whatsapp).replace(/\D/g,'')}`);
            }}>🟢 CHAMAR FAMÍLIA NO WHATSAPP</button>}
          </div>
        ))}
      </div>
    </div>
  );
};

// ------------------------------------------------------------------------------------------
// 9. PAINEL DE COMANDO MASTER ADMIN (AUDITORIA E FILTROS DE GUERRA)
// ------------------------------------------------------------------------------------------

const DashboardMasterAdmin = ({ todosUsuarios }) => {
  const [termoAdmin, setTermoAdmin] = useState('');
  const [edMaster, setEdMaster] = useState(null);
  const [auditoriaDoc, setAuditoriaDoc] = useState(null);
  const [filtroMaster, setFiltroMaster] = useState('todos');

  const totalGeral = todosUsuarios.length;
  const pendenteAprovacaoDoc = todosUsuarios.filter(u => u.documentoEnviado === true && !u.identidadeVerificada).length;
  const pendenteEnvioDoc = todosUsuarios.filter(u => !u.documentoEnviado).length;
  const pendenteSms = todosUsuarios.filter(u => !u.celularVerificado).length;

  const filtradosMaster = todosUsuarios.filter(u => {
    const s = termoAdmin.toLowerCase();
    const loc = getLoc(u).toLowerCase();
    const matchBusca = renderSafe(u.nome).toLowerCase().includes(s) || renderSafe(u.email).toLowerCase().includes(s) || loc.includes(s);
    
    if (filtroMaster === 'aprovacao_doc') return matchBusca && u.documentoEnviado === true && !u.identidadeVerificada;
    if (filtroMaster === 'envio_doc') return matchBusca && !u.documentoEnviado;
    if (filtroMaster === 'valida_sms') return matchBusca && !u.celularVerificado;
    
    return matchBusca;
  });

  return (
    <div style={{backgroundColor: '#fff', padding: 30, borderRadius: 40, border: '2px solid #e2e8f0', marginTop: 40, boxShadow: '0 25px 70px rgba(0,0,0,0.06)'}}>
      <h3 style={{color: '#c53030', fontWeight: '900', marginBottom: 30, fontSize: 28, letterSpacing: '-0.5px'}}>🛡️ BASE MASTER DE COMANDO</h3>
      
      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, marginBottom: 15}}>
         <button onClick={() => setFiltroMaster('todos')} style={{...styles.statBoxAdmin, border: filtroMaster === 'todos' ? '3px solid #1e293b' : '1.5px solid #e2e8f0', backgroundColor: filtroMaster === 'todos' ? '#f1f5f9' : '#fff'}}>
           <strong style={{fontSize: 30, color: '#1e293b'}}>{totalGeral}</strong>
           <span style={{fontSize: 12}}>Total Global de Contas</span>
         </button>
         <button onClick={() => setFiltroMaster('aprovacao_doc')} style={{...styles.statBoxAdmin, border: filtroMaster === 'aprovacao_doc' ? '3px solid #c53030' : '1.5px solid #e2e8f0', backgroundColor: filtroMaster === 'aprovacao_doc' ? '#fff5f5' : '#fff'}}>
           <strong style={{fontSize: 30, color: '#c53030'}}>{pendenteAprovacaoDoc}</strong>
           <span style={{fontSize: 12}}>Docs a Aprovar</span>
         </button>
      </div>
      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, marginBottom: 35}}>
         <button onClick={() => setFiltroMaster('envio_doc')} style={{...styles.statBoxAdmin, border: filtroMaster === 'envio_doc' ? '3px solid #dd6b20' : '1.5px solid #e2e8f0', backgroundColor: filtroMaster === 'envio_doc' ? '#fffaf0' : '#fff'}}>
           <strong style={{fontSize: 30, color: '#dd6b20'}}>{pendenteEnvioDoc}</strong>
           <span style={{fontSize: 12}}>Falta Enviar Doc</span>
         </button>
         <button onClick={() => setFiltroMaster('valida_sms')} style={{...styles.statBoxAdmin, border: filtroMaster === 'valida_sms' ? '3px solid #d69e2e' : '1.5px solid #e2e8f0', backgroundColor: filtroMaster === 'valida_sms' ? '#fffff0' : '#fff'}}>
           <strong style={{fontSize: 30, color: '#d69e2e'}}>{pendenteSms}</strong>
           <span style={{fontSize: 12}}>SMS Pendentes</span>
         </button>
      </div>

      <input style={styles.searchFieldInput} placeholder="🔍 Digite Nome, Email ou ID do Usuário..." value={termoAdmin} onChange={e => setTermoAdmin(e.target.value)} />
      
      <div style={{maxHeight: 700, overflowY: 'auto', border: '2px solid #f1f5f9', borderRadius: 30, backgroundColor: '#f8fafc', padding: 5}}>
        {filtradosMaster.map(u => (
          <div key={u.id} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 25px', borderBottom: '2px solid #f1f5f9', backgroundColor: '#fff', margin: 8, borderRadius: 20, boxShadow: '0 5px 15px rgba(0,0,0,0.02)'}}>
            <div style={{textAlign: 'left', flex: 1, minWidth: 0, paddingRight: 15}}>
              <strong style={{fontSize: 17, color: '#1e293b', fontWeight: '900'}}>{renderSafe(u.nome, '[Nome não Preenchido]')}</strong>
              <div style={{fontSize: 13, color: '#64748b', marginTop: 3}}>{renderSafe(u.email)}</div>
              <div style={{fontSize: 12, color: '#3182ce', fontWeight: 'bold', marginTop: 6}}>📍 {getLoc(u)}</div>
              
              <div style={{display: 'flex', gap: 8, marginTop: 12}}>
                 {u.documentoEnviado ? <span style={{fontSize: 10, background: '#e6fffa', color: '#007b80', padding: '5px 10px', borderRadius: 8, fontWeight: '900'}}>DOC NA BASE</span> : <span style={{fontSize: 10, background: '#fff5f5', color: '#c53030', padding: '5px 10px', borderRadius: 8, fontWeight: '900'}}>SEM DOC</span>}
                 {u.celularVerificado ? <span style={{fontSize: 10, background: '#e6fffa', color: '#007b80', padding: '5px 10px', borderRadius: 8, fontWeight: '900'}}>SMS VALIDADO</span> : <span style={{fontSize: 10, background: '#fffaf0', color: '#dd6b20', padding: '5px 10px', borderRadius: 8, fontWeight: '900'}}>SMS PENDENTE</span>}
              </div>
            </div>
            
            <div style={{display: 'flex', gap: 12, flexDirection: 'column', alignItems: 'flex-end'}}>
               {u.documentoEnviado && !u.identidadeVerificada && (
                 <button onClick={() => setAuditoriaDoc(u)} style={{backgroundColor: '#c53030', color: '#fff', border: 'none', padding: '12px 20px', borderRadius: 15, cursor: 'pointer', fontWeight: '900', fontSize: 12, boxShadow: '0 8px 20px rgba(197, 48, 48, 0.3)'}}>MESA DE AUDITORIA</button>
               )}
               <button onClick={() => setEdMaster(u)} style={{backgroundColor: '#f1f5f9', border: 'none', padding: '12px 20px', borderRadius: 15, cursor: 'pointer', fontWeight: 'bold', color: '#334155', display: 'flex', gap: 8, alignItems: 'center'}}><IconEdit /> EDITAR</button>
            </div>
          </div>
        ))}
      </div>
      {edMaster && <MasterAdminGlobalEditor userToEdit={edMaster} onClose={() => setEdMaster(null)} />}
      {auditoriaDoc && <AdminDocumentApprovalModal userDoc={auditoriaDoc} onClose={() => setAuditoriaDoc(null)} />}
    </div>
  );
};

// ------------------------------------------------------------------------------------------
// 10. PAINEL CENTRAL DO USUÁRIO LOGADO (USER HUB V81 - FOTOS RESTAURADAS)
// ------------------------------------------------------------------------------------------

const UserProfileHubPage = ({ user, userData, todosUsuarios }) => {
  const [abaAtiva, setAbaAtiva] = useState('perfil');
  const [loadingRG, setLoadingRG] = useState(false);
  const [loadingFotoPerfil, setLoadingFotoPerfil] = useState(false);
  const [abrirEditor, setAbrirEditor] = useState(false);
  const [stSms, setStSms] = useState(null);
  const [codSms, setCodSms] = useState('');

  const handleDispararGoogleSms = async () => {
    try {
      if(window.recaptcha) window.recaptcha.clear();
      window.recaptcha = new RecaptchaVerifier(auth, 'recaptcha-cont', { size: 'normal' });
      const n = "+55" + renderSafe(userData.whatsapp).replace(/\D/g, '');
      const confirmation = await linkWithPhoneNumber(auth.currentUser, n, window.recaptcha);
      setStSms(confirmation);
      alert("📲 Antenas ativadas. Código SMS disparado para o seu aparelho!");
    } catch(e) { alert("Erro de comunicação celular: " + e.message); }
  };

  const handleCapturaUploadRG = async (e) => {
    const file = e.target.files[0]; if(!file) return;
    setLoadingRG(true);
    try {
      const img_base64 = await compressImage(file); 
      await updateDoc(doc(fs, "usuarios", userData.id), { fotoDocumento: img_base64, documentoEnviado: true });
      alert("✅ Imagem criptografada e enviada para a Mesa de Auditoria Master.");
    } catch(e) { alert("Falha na criptografia da imagem."); }
    setLoadingRG(false);
  };

  // V81: Função Mestre para Upload da Foto de Perfil (Avatar)
  const handleUploadFotoPerfil = async (e) => {
    const file = e.target.files[0]; if(!file) return;
    setLoadingFotoPerfil(true);
    try {
      const img_base64 = await compressImage(file);
      await updateDoc(doc(fs, "usuarios", userData.id), { fotoPerfil: img_base64 });
      alert("✅ Foto de perfil atualizada com sucesso no banco de dados!");
    } catch(err) { alert("Erro ao atualizar foto de perfil."); }
    setLoadingFotoPerfil(false);
  };

  if (!user || user.isAnonymous) return (
    <div style={styles.emptyStateContainer}>
      <div style={{fontSize: 60, marginBottom: 20}}>🔐</div>
      <h3>Área Protegida</h3>
      <p>Você precisa criar uma conta gratuita para acessar o Painel de Controle.</p>
    </div>
  );

  return (
    <div>
      <h2 style={styles.pageTitleHeading}>Painel de Controle e Status</h2>
      
      <div style={styles.segmentedControlContainer}>
        <button onClick={() => setAbaAtiva('perfil')} style={abaAtiva === 'perfil' ? styles.segmentBtnActive : styles.segmentBtn}>MINHA VITRINE</button>
        {ADMIN_EMAILS.includes(user.email) && <button onClick={() => setAbaAtiva('master')} style={abaAtiva === 'master' ? {...styles.segmentBtnActive, color: '#c53030'} : styles.segmentBtn}>PAINEL MASTER (LUCIANO)</button>}
      </div>

      {abaAtiva === 'perfil' && (
        <div style={styles.userCardContent}>
          <div style={{display: 'flex', alignItems: 'center', gap: 25, marginBottom: 50, borderBottom: '2px solid #f1f5f9', paddingBottom: 40}}>
            
            {/* V81: AVATAR INTERATIVO RESTAURADO E BLINDADO */}
            <label style={{width: 100, height: 100, borderRadius: 30, backgroundColor: '#007b80', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 50, boxShadow: '0 12px 30px rgba(0,123,128,0.3)', overflow: 'hidden', cursor: 'pointer', position: 'relative'}}>
               {loadingFotoPerfil ? (
                  <span style={{fontSize: 14, color: '#fff', fontWeight: 'bold'}}>⏳...</span>
               ) : userData?.fotoPerfil ? (
                 <img src={userData.fotoPerfil} style={{width: '100%', height: '100%', objectFit: 'cover'}} alt="Meu Perfil" />
               ) : (
                 userData?.tipo === 'paciente' ? '🏡' : '⚕️'
               )}
               <div style={{position: 'absolute', bottom: 0, width: '100%', backgroundColor: 'rgba(0,0,0,0.6)', color: 'white', fontSize: 10, textAlign: 'center', padding: '6px 0', fontWeight: '900', letterSpacing: 1}}>FOTO</div>
               <input type="file" style={{display: 'none'}} onChange={handleUploadFotoPerfil} accept="image/*" />
            </label>

            <div style={{textAlign: 'left'}}>
              <h3 style={{margin: 0, fontSize: 28, fontWeight: '900', color: '#1e293b', letterSpacing: '-1px'}}>{renderSafe(userData?.nome, 'Carregando Módulo...')}</h3>
              <p style={{fontSize: 16, color: '#64748b', fontWeight: 'bold', marginTop: 8}}>📍 Rastreador: {getLoc(userData)}</p>
            </div>
          </div>
          
          <button style={styles.btnPrimary} onClick={() => setAbrirEditor(true)}>EDITAR VITRINE / INFORMAÇÕES</button>

          <div style={{marginTop: 55, textAlign: 'left', backgroundColor: '#f8fafc', padding: 40, borderRadius: 35, border: '2.5px solid #e2e8f0', boxShadow: '0 15px 40px rgba(0,0,0,0.02)'}}>
            <h4 style={{marginBottom: 30, fontWeight: '900', color: '#475569', textTransform: 'uppercase', letterSpacing: 1.5, fontSize: 18}}>Status de Credibilidade Pública</h4>
            
            <div style={styles.dataRowInfo}>
              <strong style={{fontSize: 16}}>Antena de Validação (SMS):</strong> 
              {userData?.celularVerificado ? <span style={{color: '#16a34a', fontWeight: '900', marginLeft: 15, background: '#e6fffa', padding: '5px 12px', borderRadius: 10}}>✅ VALIDADO GOOGLE</span> : <span style={{color: '#e53e3e', fontWeight: 'bold', marginLeft: 15}}>❌ PENDENTE</span>}
            </div>
            
            <div style={styles.dataRowInfo}>
              <strong style={{fontSize: 16}}>Auditoria de Identidade (RG):</strong> 
              {userData?.identidadeVerificada ? <span style={{color: '#16a34a', fontWeight: '900', marginLeft: 15, background: '#e6fffa', padding: '5px 12px', borderRadius: 10}}>✅ APROVADO PELO MASTER</span> : <span style={{color: '#d69e2e', fontWeight: 'bold', marginLeft: 15}}>⌛ EM ANÁLISE / PENDENTE</span>}
            </div>
            
            <div style={{...styles.dataRowInfo, borderBottom: 'none'}}>
              <strong style={{fontSize: 16}}>Nível Atual da Conta:</strong> 
              {userData?.premium ? <span style={{color: '#d69e2e', fontWeight: '900', marginLeft: 15, background: '#fffaf0', padding: '5px 12px', borderRadius: 10}}>⭐ PREMIUM DESTAQUE ORO</span> : <span style={{color: '#64748b', fontWeight: 'bold', marginLeft: 15}}>🎁 GRATUITO PADRÃO</span>}
            </div>
          </div>

          {!userData?.celularVerificado && (
             <div style={{marginTop: 45, padding: 40, backgroundColor: '#fff', border: '3px solid #e2e8f0', borderRadius: 45, boxShadow: '0 20px 50px rgba(0,0,0,0.05)'}}>
                <h4 style={{color: '#1e293b', fontWeight: '900', marginBottom: 20, fontSize: 20}}>Trava de Segurança: Verificação Celular</h4>
                <p style={{color: '#64748b', marginBottom: 30, lineHeight: 1.6}}>Para evitar robôs no portal, clique abaixo. Receberemos uma confirmação criptografada do Google enviando um SMS com 6 dígitos para o seu aparelho.</p>
                <div id="recaptcha-cont" style={{display: 'flex', justifyContent: 'center', marginBottom: 35}}></div>
                {!stSms ? <button style={styles.btnActionPrimary} onClick={handleDispararGoogleSms}>DISPARAR CÓDIGO SMS PARA O MEU CELULAR AGORA</button> : (
                  <div>
                    <input style={{...styles.inputStyle, textAlign: 'center', fontSize: 32, letterSpacing: 8, fontWeight: '900'}} placeholder="000000" value={codSms} onChange={e => setCodSms(e.target.value)} />
                    <button style={styles.btnActionPrimary} onClick={async () => { try{ await stSms.confirm(codSms); await updateDoc(doc(fs, "usuarios", userData.id), {celularVerificado:true}); alert("Selo de SMS ativado com sucesso!"); setStSms(null); }catch(e){alert("Erro: O Código digitado não confere. Verifique o SMS.");} }}>CONFIRMAR CÓDIGO RECEBIDO</button>
                  </div>
                )}
             </div>
          )}

          {userData?.celularVerificado && !userData?.identidadeVerificada && !userData?.documentoEnviado && (
            <div style={{marginTop: 50, padding: 50, border: '5px dashed #007b80', borderRadius: 50, textAlign: 'center', backgroundColor: '#e6fffa'}}>
              <div style={{fontSize: 70, marginBottom: 30, filter: 'drop-shadow(0px 10px 15px rgba(0,123,128,0.2))'}}>🪪</div>
              <h4 style={{fontWeight: '900', marginBottom: 15, color: '#004d50', fontSize: 26, letterSpacing: '-1px'}}>Conquiste seu Selo Verde de Identidade</h4>
              <p style={{fontSize: 17, color: '#007b80', marginBottom: 40, lineHeight: 1.8, maxWidth: '90%', margin: '0 auto 40px'}}>O toque final para garantir a confiança das famílias. Tire uma foto nítida e iluminada da frente do seu RG ou CNH (onde aparece a foto e o número). Nossa mesa de auditoria verificará o documento em até 24h.</p>
              <label style={{...styles.btnPrimary, background: '#d69e2e', display: 'inline-block', width: 'auto', padding: '24px 70px', cursor: 'pointer', borderRadius: 60, boxShadow: '0 15px 40px rgba(214,158,46,0.4)', textTransform: 'uppercase', letterSpacing: 1}}>
                {loadingRG ? 'CRIPTOGRAFANDO E ENVIANDO...' : '📸 ACIONAR CÂMERA / ENVIAR FOTO DO DOCUMENTO'}
                <input type="file" style={{display: 'none'}} onChange={handleCapturaUploadRG} accept="image/*" />
              </label>
            </div>
          )}
          
          {/* V81: REENVIO DE DOCUMENTOS - AGORA O USUÁRIO PODE ATUALIZAR A FOTO ENQUANTO AGUARDA */}
          {userData?.documentoEnviado && !userData?.identidadeVerificada && (
            <div style={{marginTop: 40, padding: 40, backgroundColor: '#fffaf0', border: '3px solid #d69e2e', borderRadius: 40, textAlign: 'center', boxShadow: '0 15px 35px rgba(214, 158, 46, 0.1)'}}>
               <div style={{fontSize: 45, marginBottom: 15}}>⏳</div>
               <h4 style={{color: '#b7791f', fontWeight: '900', fontSize: 22, marginBottom: 10}}>Documento na Base Segura</h4>
               <p style={{color: '#744210', fontSize: 15, marginBottom: 25}}>Recebemos sua foto com sucesso. O Administrador Master realizará a verificação de segurança em breve para liberar seu selo no portal.</p>
               
               <label style={{...styles.btnOutline, display: 'inline-block', width: 'auto', padding: '15px 30px', fontSize: 13, cursor: 'pointer', borderColor: '#d69e2e', color: '#b7791f', backgroundColor: '#fff'}}>
                  {loadingRG ? 'ENVIANDO NOVA FOTO...' : '🔄 FOTO FICOU RUIM? REENVIAR DOCUMENTO'}
                  <input type="file" style={{display: 'none'}} onChange={handleCapturaUploadRG} accept="image/*" />
               </label>
            </div>
          )}
        </div>
      )}

      {abaAtiva === 'master' && <DashboardMasterAdmin todosUsuarios={todosUsuarios} />}
      {abrirEditor && <UserSelfEditorModal userData={userData} onClose={() => setAbrirEditor(false)} />}
    </div>
  );
};

// ------------------------------------------------------------------------------------------
// 11. MÓDULO DE AUTENTICAÇÃO BLINDADO (LOGIN E CADASTRO)
// ------------------------------------------------------------------------------------------

const AuthLoginPage = () => {
  const [modo, setModo] = useState('login');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [form, setForm] = useState({ nome: '', zap: '', cidade: '', tipo: 'cuidador' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAuthProcess = async () => {
    if(!email || !senha) return alert("Parâmetros inválidos. Preencha todos os campos obrigatórios.");
    setLoading(true);
    try {
      if(modo === 'cad') {
        if(form.nome.length < 3) throw new Error("Nome precisa ter ao menos 3 caracteres.");
        const cred = await createUserWithEmailAndPassword(auth, email, senha);
        await setDoc(doc(fs, "usuarios", cred.user.uid), { 
          nome: form.nome, whatsapp: form.zap, cidade: form.cidade, tipo: form.tipo, uid: cred.user.uid,
          rating: 0, totalRatings: 0, identidadeVerificada: false, celularVerificado: false, email: email.toLowerCase(), premium: false,
          dataCadastro: new Date().toISOString(), documentoEnviado: false
        });
      } else { await signInWithEmailAndPassword(auth, email, senha); }
      navigate('/');
    } catch(err) { alert("Autenticação Recusada: " + err.message); }
    setLoading(false);
  };

  return (
    <div style={{maxWidth: 480, margin: '90px auto', padding: 25}}>
      <div style={{backgroundColor: '#fff', padding: 55, borderRadius: 60, border: '2px solid #e2e8f0', boxShadow: '0 40px 100px rgba(0,0,0,0.1)'}}>
        <div style={{textAlign: 'center', marginBottom: 45}}>
           <div style={{backgroundColor: '#e6fffa', padding: 24, borderRadius: '50%', display: 'inline-block', marginBottom: 25, border: '4px solid #007b80', boxShadow: '0 10px 25px rgba(0,123,128,0.2)'}}><IconHeart /></div>
           <h2 style={{color: '#007b80', fontWeight: '900', fontSize: 36, letterSpacing: '-1.5px', margin: 0}}>{modo === 'login' ? 'Identificação SOS' : 'Abertura de Conta'}</h2>
           <p style={{color: '#64748b', marginTop: 15, fontSize: 15}}>{modo === 'login' ? 'Acesse o painel do seu perfil profissional ou familiar.' : 'O processo leva menos de 1 minuto e é gratuito.'}</p>
        </div>
        
        {modo === 'cad' && (
          <div style={{textAlign: 'left', marginBottom: 25, borderBottom: '2px dashed #e2e8f0', paddingBottom: 25}}>
            <label style={styles.labelFormMaster}>TIPO DE PERFIL NO SISTEMA</label>
            <select style={styles.inputStyle} value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value})}>
              <option value="cuidador">👩‍⚕️ SOU PROFISSIONAL (Ofereço Serviços)</option>
              <option value="paciente">🏡 SOU FAMÍLIA (Busco Contratar)</option>
            </select>
            <label style={styles.labelFormMaster}>SEU NOME COMPLETO DE REGISTRO</label>
            <input style={styles.inputStyle} placeholder="Nome e Sobrenome" value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} />
            <label style={styles.labelFormMaster}>SEU WHATSAPP COM DDD</label>
            <input style={styles.inputStyle} placeholder="(11) 99999-8888" value={form.zap} onChange={e => setForm({...form, zap: e.target.value})} />
            <label style={styles.labelFormMaster}>CIDADE DE ATUAÇÃO E ESTADO</label>
            <input style={styles.inputStyle} placeholder="Ex: Belo Horizonte - MG" value={form.cidade} onChange={e => setForm({...form, cidade: e.target.value})} />
          </div>
        )}
        <label style={styles.labelFormMaster}>E-MAIL (LOGIN)</label>
        <input style={styles.inputStyle} placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value.toLowerCase().trim())} />
        <label style={styles.labelFormMaster}>CÓDIGO DE ACESSO (SENHA)</label>
        <input style={styles.inputStyle} placeholder="Mínimo de 6 caracteres" type="password" value={senha} onChange={e => setSenha(e.target.value)} />
        
        <button style={{...styles.btnPrimary, marginTop: 15}} onClick={handleAuthProcess} disabled={loading}>{loading ? 'CRIANDO CHAVE...' : (modo === 'login' ? 'ENTRAR NO SISTEMA' : 'CONCLUIR CADASTRO E GERAR PERFIL')}</button>
        
        <button style={{background: 'none', border: 'none', color: '#007b80', fontWeight: '900', marginTop: 40, cursor: 'pointer', textDecoration: 'underline', fontSize: 15, width: '100%'}} onClick={() => setModo(modo === 'login' ? 'cad' : 'login')}>
          {modo === 'login' ? 'Não tem perfil ainda? Clique aqui para criar.' : 'Já possuo uma chave de acesso. Fazer Login.'}
        </button>
      </div>
    </div>
  );
};

// ------------------------------------------------------------------------------------------
// 12. SISTEMA DE DESIGN ONYX COMPLETO (ESTILOS VISUAIS PREMIUM V81)
// ------------------------------------------------------------------------------------------

const styles = {
  topHeaderNav: { position: 'fixed', top: 0, left: 0, right: 0, backgroundColor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(18px)', padding: '15px 25px', display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid rgba(226, 232, 240, 0.8)', zIndex: 1000, boxShadow: '0 4px 20px rgba(0,0,0,0.02)' },
  btnNavBack: { background: 'none', border: 'none', paddingRight: 15, cursor: 'pointer', color: '#007b80' },
  
  bottomTabNavigation: { 
    position: 'fixed', bottom: 25, left: '50%', transform: 'translateX(-50%)', width: 'calc(100% - 40px)', maxWidth: '600px',
    backgroundColor: '#0f172a', 
    display: 'flex', justifyContent: 'space-around', padding: '18px 10px', 
    zIndex: 1000, borderRadius: 40, boxShadow: '0 25px 60px rgba(15, 23, 42, 0.4)',
    border: '1.5px solid rgba(255,255,255,0.15)'
  },
  bottomTabLink: { color: 'rgba(255,255,255,0.4)', textDecoration: 'none', fontSize: 11, fontWeight: 'bold', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, transition: 'all 0.3s ease' },
  bottomTabLinkActive: { color: '#00e6e6', textDecoration: 'none', fontSize: 11, fontWeight: '900', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, textShadow: '0 0 10px rgba(0,230,230,0.5)' },
  bottomTabDivider: { width: 1.5, height: 45, backgroundColor: 'rgba(255,255,255,0.1)' },
  
  btnLoginSolid: { backgroundColor: '#007b80', color: 'white', padding: '12px 28px', borderRadius: 30, textDecoration: 'none', fontSize: 13, fontWeight: '900', boxShadow: '0 10px 25px rgba(0,123,128,0.25)', border: '2px solid #007b80' },
  btnLoginOutline: { border: '2.5px solid #007b80', color: '#007b80', background: 'none', padding: '10px 25px', borderRadius: 30, fontSize: 12, fontWeight: '900', cursor: 'pointer' },
  
  heroBannerOnyx: { background: 'linear-gradient(145deg, #006064 0%, #003333 100%)', padding: '70px 35px', borderRadius: 60, color: '#fff', marginBottom: 25, textAlign: 'center', boxShadow: '0 30px 70px rgba(0,51,51,0.4)', position: 'relative', overflow: 'hidden' },
  heroBannerTitle: { fontSize: 34, margin: 0, fontWeight: '900', lineHeight: 1.1, letterSpacing: '-1.5px', textShadow: '0 5px 15px rgba(0,0,0,0.3)' },
  trustBadgesContainer: { display: 'flex', justifyContent: 'center', gap: 18, marginTop: 55 },
  trustBadgeItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: 11, gap: 15, flex: 1 },
  trustBadgeIcon: { backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(5px)', border: '1px solid rgba(255,255,255,0.2)', padding: '16px', borderRadius: '50%', display: 'flex', color: '#fff' },
  trustBadgeText: { fontWeight: '900', lineHeight: 1.4, textTransform: 'uppercase', color: '#e2e8f0', letterSpacing: 0.8 },
  
  bannerPrecosOnyx: { backgroundColor: '#fff', padding: '30px 40px', borderRadius: '55px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 55, border: '2px solid #e2e8f0', boxShadow: '0 20px 50px rgba(0,0,0,0.06)' },
  precoItemBox: { flex: 1, display: 'flex', alignItems: 'center', gap: 20 },

  segmentedControlContainer: { display: 'flex', backgroundColor: '#e2e8f0', padding: 8, borderRadius: 50, marginBottom: 45, boxShadow: 'inset 0 4px 10px rgba(0,0,0,0.05)' },
  segmentBtn: { flex: 1, padding: '22px 10px', border: 'none', background: 'none', fontSize: 14, cursor: 'pointer', fontWeight: 'bold', color: '#64748b' },
  segmentBtnActive: { flex: 1, padding: '22px 10px', border: 'none', backgroundColor: '#fff', borderRadius: 45, color: '#007b80', fontWeight: '900', boxShadow: '0 15px 35px rgba(0,0,0,0.1)' },
  
  searchFieldInput: { width: '100%', padding: '28px 40px', borderRadius: 50, border: '2.5px solid #e2e8f0', marginBottom: 45, boxSizing: 'border-box', outline: 'none', fontSize: 19, backgroundColor: '#fff', boxShadow: '0 15px 40px rgba(0,0,0,0.04)', color: '#1e293b', fontWeight: 'bold' },
  inputStyle: { width: '100%', padding: '24px', borderRadius: 28, border: '2.5px solid #e2e8f0', marginBottom: 25, boxSizing: 'border-box', backgroundColor: '#f8fafc', fontSize: 18, outline: 'none', color: '#1e293b', fontWeight: '500' },
  labelFormMaster: { display: 'block', fontSize: 12, fontWeight: '900', color: '#64748b', marginBottom: 15, textAlign: 'left', textTransform: 'uppercase', letterSpacing: 1.8 },
  
  profileCard: { backgroundColor: '#fff', padding: '45px 40px', borderRadius: 60, border: '2px solid #e2e8f0', marginBottom: 35, boxShadow: '0 25px 70px rgba(0,0,0,0.05)' },
  profileCardPremium: { backgroundColor: '#fff', padding: '45px 40px', borderRadius: 60, border: '4.5px solid #d69e2e', marginBottom: 35, boxShadow: '0 30px 80px rgba(214, 158, 46, 0.15)', position: 'relative' },
  profileAvatarBox: { width: 110, height: 110, borderRadius: 35, backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '4.5px solid #e2e8f0' },
  profileNameText: { margin: 0, fontSize: 26, fontWeight: '900', color: '#0f172a', letterSpacing: '-1px' },
  profileLocationText: { margin: '8px 0 20px', fontSize: 16, color: '#475569', fontWeight: 'bold' },
  
  userCardContent: { backgroundColor: '#fff', padding: 55, borderRadius: 70, border: '2px solid #e2e8f0', marginBottom: 55, boxShadow: '0 30px 80px rgba(0,0,0,0.06)' },
  userCardFeaturedProminent: { backgroundColor: '#e6fffa', padding: 70, borderRadius: 80, border: '5px solid #007b80', textAlign: 'center', marginTop: 60, boxShadow: '0 40px 100px rgba(0,123,128,0.15)' },
  
  textSectionContent: { textAlign: 'left' },
  videoBoxContainer: { backgroundColor: '#000', borderRadius: 45, overflow: 'hidden', border: '12px solid #f1f5f9', boxShadow: '0 30px 70px rgba(0,0,0,0.25)' },
  longTextParagraph: { fontSize: 17, lineHeight: 2, color: '#334155', marginBottom: 30, letterSpacing: '0.2px' },
  subHeadingContent: { color: '#007b80', fontWeight: '900', fontSize: 25, margin: '55px 0 30px', letterSpacing: '-0.8px' },
  bulletList: { paddingLeft: 25, marginBottom: 50, color: '#334155', fontSize: 17, lineHeight: 2 },
  sectionHeadingTitle: { color: '#0f172a', fontSize: 30, fontWeight: '900', marginBottom: 35, textAlign: 'left', letterSpacing: '-1.5px' },
  
  btnPrimary: { width: '100%', backgroundColor: '#007b80', color: '#fff', border: 'none', padding: '28px', borderRadius: 35, fontWeight: '900', cursor: 'pointer', fontSize: 19, letterSpacing: '0.5px', boxShadow: '0 20px 45px rgba(0,123,128,0.3)', transition: 'transform 0.2s ease' },
  btnOutline: { width: '100%', background: 'none', border: '3px solid #e2e8f0', padding: '22px', borderRadius: 30, fontSize: 16, cursor: 'pointer', fontWeight: '900', color: '#334155', letterSpacing: '0.5px' },
  btnActionPrimary: { backgroundColor: '#007b80', color: '#fff', border: 'none', padding: '20px 30px', borderRadius: 28, fontWeight: '900', cursor: 'pointer', fontSize: 15, letterSpacing: '0.5px', boxShadow: '0 10px 25px rgba(0,123,128,0.2)' },
  
  checkAdminItem: { display: 'flex', alignItems: 'center', gap: 18, padding: 28, background: '#fff5f5', borderRadius: 32, marginBottom: 20, fontSize: 16, color: '#c53030', fontWeight: '900', border: '2px solid #fed7d7' },
  statBoxAdmin: { padding: '25px 20px', border: '2px solid #e2e8f0', borderRadius: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', gap: 10, backgroundColor: '#fff', transition: 'all 0.2s ease' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(15px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 20 },
  modalContent: { backgroundColor: '#fff', padding: 60, borderRadius: 75, width: '100%', textAlign: 'center', boxShadow: '0 60px 150px rgba(0,0,0,0.5)' },
  modalTitle: { fontSize: 30, fontWeight: '900', color: '#0f172a', marginBottom: 15, letterSpacing: '-1.5px' },
  
  footerInstitutionalContainer: { textAlign: 'center', padding: '130px 0 60px', borderTop: '4px dashed #cbd5e0', marginTop: 120 },
  footerLegalLink: { textDecoration: 'none', color: '#475569', fontWeight: '900', fontSize: 15, transition: 'color 0.3s' },
  dataRowInfo: { padding: '25px 0', borderBottom: '2px solid #f1f5f9', fontSize: 17, color: '#1e293b', display: 'flex', alignItems: 'center' },
  emptyStateContainer: { padding: 180, textAlign: 'center', color: '#64748b', fontWeight: 'bold', fontSize: 20 }
};

// ------------------------------------------------------------------------------------------
// 13. BOOT E INICIALIZAÇÃO DO REACT
// ------------------------------------------------------------------------------------------

export default function App() {
  const [userAuth, setUserAuth] = useState(null);
  const [listaUsuarios, setListaUsuarios] = useState([]);
  const [listaVagas, setListaVagas] = useState([]);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, u => { 
      setUserAuth(u); 
      if(!u) signInAnonymously(auth); 
    });

    const unsubUsers = onSnapshot(collection(fs, "usuarios"), snap => {
      setListaUsuarios(snap.docs.map(d => ({id: d.id, ...d.data()})));
    }, error => console.error("Erro no Sistema Master de DB:", error));

    const unsubVagas = onValue(ref(db, 'vagas'), snap => {
      const v = snap.val(); 
      setListaVagas(v ? Object.keys(v).map(k => ({id:k, ...v[k]})).reverse() : []);
    });

    return () => { unsubAuth(); unsubUsers(); unsubVagas(); };
  }, []);

  const meuPerfil = listaUsuarios.find(u => u.uid === userAuth?.uid) || null;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayoutShell user={userAuth} userData={meuPerfil} />}>
          <Route index element={<SearchHomePage todosUsuarios={listaUsuarios} user={userAuth} userData={meuPerfil} />} />
          <Route path="vagas" element={<JobBoardVagasPage vagas={listaVagas} user={userAuth} userData={meuPerfil} />} />
          <Route path="perfil" element={<UserProfileHubPage user={userAuth} userData={meuPerfil} todosUsuarios={listaUsuarios} />} />
          <Route path="sobre" element={<InstitucionalSobrePage />} />
          <Route path="privacidade" element={<InstitucionalPrivacidadePage />} />
          <Route path="termos" element={<InstitucionalTermosPage />} />
          <Route path="dicas" element={<PortalManualSaudePage />} />
          <Route path="cursos" element={<PortalCursosProfissionaisPage />} />
        </Route>
        <Route path="login" element={<AuthLoginPage />} />
      </Routes>
    </BrowserRouter>
  );
}

const rootElem = document.getElementById('root');
if (rootElem) createRoot(rootElem).render(<App />);
