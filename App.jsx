import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link, Outlet, useNavigate, useLocation } from 'react-router-dom';

// --- SERVIÇOS DO GOOGLE FIREBASE ---
import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  onSnapshot, 
  updateDoc, 
  deleteDoc 
} from "firebase/firestore";
import { 
  getDatabase, 
  ref, 
  push, 
  onValue, 
  remove 
} from "firebase/database";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut, 
  signInAnonymously,
  RecaptchaVerifier,
  linkWithPhoneNumber,
  signInWithPhoneNumber
} from "firebase/auth";

// --- CONFIGURAÇÃO DO FIREBASE (LUCYANO) ---
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

// ACESSO MASTER - Luciano e Sócios
const ADMIN_EMAILS = [
  "lucyano.pci@gmail.com",
  "socio@exemplo.com" // Substitua pelo e-mail do seu sócio
];

const LINK_PAGAMENTO = "https://mpago.la/1AJppRz";

const LISTA_ESPECIALIDADES = [
  "Banho no Leito",
  "Troca de Fraldas",
  "Curativos Simples",
  "Administração de Remédios",
  "Acompanhamento Hospitalar",
  "Cuidado com Idosos",
  "Pós-Operatório",
  "Cozinha Adaptada",
  "Mobilidade Física",
  "Aferição de Sinais Vitais"
];

// --- COMPRESSOR DE IMAGENS AUTOMÁTICO ---
const compressImage = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = (event) => {
    const img = new Image();
    img.src = event.target.result;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 600; 
      const scaleSize = MAX_WIDTH / img.width;
      canvas.width = MAX_WIDTH;
      canvas.height = img.height * scaleSize;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.6)); 
    };
    img.onerror = (e) => reject(e);
  };
});

// --- ÍCONES SVG ---
const IconHeart = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="#007b80"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>;
const IconStar = ({ filled }) => <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? "#FFD700" : "none"} stroke={filled ? "#FFD700" : "#ccc"} strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
const IconLock = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c53030" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
const IconCheck = ({ color = "#25D366", title }) => <svg width="18" height="18" viewBox="0 0 24 24" fill={color}><title>{title}</title><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>;
const IconTrash = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e53e3e" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;
const IconEdit = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3182ce" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4L18.5 2.5z"></path></svg>;
const IconCamera = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#007b80" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>;
const IconId = ({ title }) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#007b80" strokeWidth="2"><title>{title}</title><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="12" cy="10" r="3"/><path d="M7 20c0-2.5 2.2-4.5 5-4.5s5 2 5 4.5"/></svg>;
const IconBack = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#007b80" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>;

// --- COMPONENTES AUXILIARES ---
const Stars = ({ rating = 0, total = 0 }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
    {[1, 2, 3, 4, 5].map(num => <IconStar key={num} filled={num <= Math.round(rating)} />)}
    <span style={{ fontSize: '10px', color: '#999', marginLeft: '5px' }}>({total})</span>
  </div>
);

const Badge = ({ text }) => (
  <span style={styles.tagSkill}>{text}</span>
);

// --- PÁGINAS LEGAIS E INSTITUCIONAIS ---
const SobrePage = () => (
  <div style={styles.userCard}>
    <h2 style={styles.pageTitle}>Sobre o SOS Cuidadores Brasil</h2>
    <p style={styles.longText}>O SOS Cuidadores Brasil nasceu da necessidade de conectar profissionais da saúde e famílias de forma direta, transparente e segura.</p>
    <p style={styles.longText}>Acreditamos que o cuidado domiciliar exige extrema confiança. Por isso, oferecemos ferramentas de verificação rigorosa (Identidade e SMS) e avaliações reais para garantir que cada paciente receba o melhor atendimento possível.</p>
    <p style={styles.longText}>Nossa plataforma é gratuita para famílias publicarem suas vagas e oferece um plano Premium para profissionais que buscam destaque e acesso ilimitado às oportunidades.</p>
  </div>
);

const PrivacidadePage = () => (
  <div style={styles.userCard}>
    <h2 style={styles.pageTitle}>Política de Privacidade (LGPD)</h2>
    <p style={styles.longText}>Sua privacidade é nossa prioridade absoluta. Em conformidade com a LGPD (Lei Geral de Proteção de Dados), coletamos apenas os dados necessários para o funcionamento seguro do serviço.</p>
    <p style={styles.longText}>1. **Segurança:** Seus documentos (RG/CPF) são armazenados com criptografia e servem exclusivamente para a validação interna da nossa administração. Eles nunca ficam públicos.</p>
    <p style={styles.longText}>2. **Uso de Dados:** Seus dados de contato nunca serão vendidos a terceiros.</p>
    <p style={styles.longText}>3. **Direito ao Esquecimento:** Você pode solicitar a exclusão total e imediata dos seus dados a qualquer momento pelo seu painel.</p>
  </div>
);

const TermosPage = () => (
  <div style={styles.userCard}>
    <h2 style={styles.pageTitle}>Termos e Condições</h2>
    <p style={styles.longText}>Ao acessar o SOS Cuidadores, você concorda com os seguintes termos de uso:</p>
    <p style={styles.longText}>- A plataforma atua como facilitadora de contatos. Não nos responsabilizamos por acordos financeiros, contratuais ou condutas técnicas entre as partes.</p>
    <p style={styles.longText}>- É terminantemente proibido postar conteúdo falso ou utilizar documentos de terceiros.</p>
    <p style={styles.longText}>- A verificação de identidade no site é uma camada extra de segurança, mas recomendamos que as famílias sempre chequem referências antes da contratação física.</p>
  </div>
);

const ContatoPage = () => (
  <div style={styles.userCard}>
    <h2 style={styles.pageTitle}>Central de Suporte</h2>
    <p style={styles.longText}>Precisa de ajuda com seu cadastro, pagamento Premium ou quer denunciar algum perfil suspeito? Nossa equipe está pronta para ajudar:</p>
    <div style={{textAlign: 'center', marginTop: 25}}>
      <div style={{backgroundColor: '#eaf4f4', padding: '20px', borderRadius: 15, border: '1px solid #007b80'}}>
        <p style={{margin: 0, fontWeight: 'bold', color: '#007b80'}}>E-mail da Administração:</p>
        <p style={{margin: '5px 0 0', fontSize: '18px', fontWeight: '900'}}>{ADMIN_EMAILS[0]}</p>
      </div>
    </div>
  </div>
);

// --- LAYOUT PRINCIPAL ---
const Layout = ({ user }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = (path) => location.pathname === path;

  return (
    <div style={{ backgroundColor: '#f4f7f6', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <header style={styles.headerStyle}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          {location.pathname !== '/' && (
            <button onClick={() => navigate(-1)} style={styles.backBtn} title="Voltar">
              <IconBack />
            </button>
          )}
          
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IconHeart /><span style={{ fontWeight: '900', color: '#007b80', fontSize: '19px' }}>SOS CUIDADORES</span>
          </Link>
        </div>

        {user && !user.isAnonymous ? (
          <button style={styles.loginBtn} onClick={() => signOut(auth)}>Sair</button>
        ) : (
          <Link to="/login" style={styles.loginBtn}>Entrar / Cadastro</Link>
        )}
      </header>

      <main style={{ maxWidth: '550px', margin: '0 auto', padding: '85px 16px 140px' }}>
        <Outlet />
        
        <div style={{ marginTop: 60, borderTop: '1px solid #e2e8f0', paddingTop: 30, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 20 }}>
          <Link to="/sobre" style={styles.legalLink}>Sobre Nós</Link>
          <Link to="/privacidade" style={styles.legalLink}>Privacidade</Link>
          <Link to="/termos" style={styles.legalLink}>Termos</Link>
          <Link to="/contato" style={styles.legalLink}>Suporte</Link>
        </div>
        <p style={{textAlign:'center', fontSize: 10, color:'#a0aec0', marginTop: 20}}>© 2026 SOS Cuidadores Brasil - CNPJ Sob Consulta</p>
      </main>

      <footer style={styles.footerStyle}>
        <Link to="/" style={isActive('/') ? styles.footerLinkActive : styles.footerLink}>Início</Link>
        <Link to="/vagas" style={isActive('/vagas') ? styles.footerLinkActive : styles.footerLink}>Vagas</Link>
        <Link to="/cursos" style={isActive('/cursos') ? styles.footerLinkActive : styles.footerLink}>Cursos</Link>
        <Link to="/dicas" style={isActive('/dicas') ? styles.footerLinkActive : styles.footerLink}>Saúde</Link>
        <Link to="/perfil" style={isActive('/perfil') ? styles.footerLinkActive : styles.footerLink}>Perfil</Link>
      </footer>
    </div>
  );
};

// --- PÁGINA INICIAL (HOME COM BANNER COMPLETO) ---
const HomePage = ({ todosUsuarios = [], user, userData }) => {
  const [busca, setBusca] = useState('');
  const [abaAtiva, setAbaAtiva] = useState('cuidadores');
  const navigate = useNavigate();

  const handleContact = (u) => {
    if (!user || user.isAnonymous) return navigate('/login');
    window.open(`https://wa.me/55${u.whatsapp?.replace(/\D/g, '')}`, '_blank');
  };

  const filtered = todosUsuarios.filter(u => {
    const matchCidade = (u.cidade || "").toLowerCase().includes(busca.toLowerCase());
    const matchTipo = u.tipo === (abaAtiva === 'cuidadores' ? 'cuidador' : 'paciente');
    return matchCidade && matchTipo;
  });

  return (
    <div>
      <section style={styles.bannerPremium}>
        <h1 style={styles.bannerTitle}>Cuidado Domiciliar Profissional</h1>
        <p style={styles.bannerSubtitle}>Segurança, Confiança e Verificação por SMS.</p>
      </section>

      <div style={styles.valuePropositionRow}>
        <div style={styles.valueCardGreen}>
          <div style={{fontSize: 20}}>💎</div>
          <h3 style={styles.valueCardTitle}>FAMÍLIAS</h3>
          <p style={styles.valueCardText}>Anuncie vagas grátis e ache profissionais.</p>
        </div>
        <div style={styles.valueCardGold}>
          <div style={{fontSize: 20}}>⭐</div>
          <h3 style={styles.valueCardTitle}>CUIDADORES</h3>
          <p style={styles.valueCardText}>Tenha destaque e selo de verificação.</p>
        </div>
      </div>

      <div style={styles.tabHeaderContainer}>
        <button onClick={() => setAbaAtiva('cuidadores')} style={abaAtiva === 'cuidadores' ? styles.tabBtnActive : styles.tabBtn}>Achar Cuidador</button>
        <button onClick={() => setAbaAtiva('paciente')} style={abaAtiva === 'paciente' ? styles.tabBtnActive : styles.tabBtn}>Achar Vagas</button>
      </div>

      <input style={styles.searchField} placeholder="🔍 Buscar por cidade..." value={busca} onChange={e => setBusca(e.target.value)} />

      {filtered.map(u => (
        <div key={u.id} style={styles.userCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 15 }}>
            <div style={{ display: 'flex', gap: 12, textAlign: 'left' }}>
              <div style={{ width: 65, height: 65, borderRadius: 15, backgroundColor: '#edf2f7', overflow: 'hidden', flexShrink: 0, border: '1px solid #e2e8f0' }}>
                {u.fotoPerfil ? (
                  <img src={u.fotoPerfil} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Perfil" />
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: 0.5 }}><IconCamera /></div>
                )}
              </div>
              
              <div>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#2d3748', display: 'flex', alignItems: 'center', gap: 5 }}>
                  {u.nome} 
                  {u.identidadeVerificada && <IconId title="Identidade Validada" />}
                  {u.celularVerificado && <IconCheck color="#25D366" title="Celular Verificado" />}
                </h3>
                <p style={{ fontSize: '12px', color: '#007b80', fontWeight: 'bold', margin: '4px 0' }}>📍 {u.cidade || "Localização não informada"}</p>
                {u.identidadeVerificada && <span style={{fontSize: 9, color: '#007b80', fontWeight: '900'}}>IDENTIDADE VERIFICADA ✅</span>}
              </div>
            </div>
            {u.tipo === 'cuidador' && <Stars rating={(u.ratingSum || 0) / (u.totalRatings || 1)} total={u.totalRatings || 0} />}
          </div>
          
          <div style={{marginTop: 15, textAlign: 'left'}}>
             {u.tipo === 'cuidador' ? (
                <>
                  <div style={{display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10}}>
                    {Array.isArray(u.especialidades) && u.especialidades.map((e, i) => <Badge key={i} text={e} />)}
                  </div>
                  <p style={{fontSize: 14, color: '#4a5568', fontStyle: 'italic', lineHeight: '1.5'}}>"{u.biografia || "Profissional cadastrado e disponível para atendimento domiciliar."}"</p>
                </>
             ) : (
                <p style={{fontSize: 14, color: '#4a5568', lineHeight: '1.5'}}><strong>Necessidade da Família:</strong> {u.descricao || u.necessidade}</p>
             )}
          </div>

          {(userData?.isPremium || userData?.tipo === 'paciente' || ADMIN_EMAILS.includes(user?.email)) ? (
            <button style={styles.btnWhatsapp} onClick={() => handleContact(u)}>Falar no WhatsApp</button>
          ) : (
            <div style={styles.premiumLock} onClick={() => window.open(LINK_PAGAMENTO)}>
              <IconLock /> Ver Telefone e Perfil (R$ 9,90)
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// --- MURAL DE VAGAS COM FORMULÁRIO ---
const VagasPage = ({ vagas = [], user, userData }) => {
  const [vaga, setVaga] = useState({ titulo: '', cidade: '', desc: '', whatsappContato: '' });
  const navigate = useNavigate();

  const publicar = () => {
    if (!user || user.isAnonymous) return navigate('/login');
    if (!vaga.titulo || !vaga.desc || !vaga.whatsappContato) return alert("Por favor, preencha todos os campos da vaga.");
    push(ref(db, 'vagas'), { ...vaga, uid: user.uid, data: new Date().toLocaleDateString() });
    setVaga({ titulo: '', cidade: '', desc: '', whatsappContato: '' });
    alert("Sua vaga foi publicada com sucesso!");
  };

  const handleExcluirVaga = (id) => {
    if (window.confirm("Deseja realmente remover esta vaga?")) remove(ref(db, `vagas/${id}`));
  };

  const handleVerVaga = (num) => {
    if (!user || user.isAnonymous) return navigate('/login');
    if (userData?.isPremium || userData?.tipo === 'paciente' || ADMIN_EMAILS.includes(user?.email)) {
       window.open(`https://wa.me/55${num?.replace(/\D/g, '')}`, '_blank');
    } else {
       window.open(LINK_PAGAMENTO, '_blank');
    }
  };

  return (
    <div>
      <h2 style={styles.pageTitle}>Mural de Oportunidades</h2>
      
      {(userData?.tipo === 'paciente' || ADMIN_EMAILS.includes(user?.email)) && (
        <div style={styles.userCard}>
          <div style={{backgroundColor: '#e6f7ff', padding: '10px', borderRadius: '12px', color: '#007b80', fontWeight: 'bold', fontSize: '13px', textAlign: 'center', marginBottom: '15px'}}>DIVULGAÇÃO DE VAGAS 100% GRÁTIS</div>
          <input style={styles.inputStyle} placeholder="Título da Vaga (Ex: Cuidador para Idoso)" value={vaga.titulo} onChange={e => setVaga({...vaga, titulo: e.target.value})} />
          <input style={styles.inputStyle} placeholder="Cidade/Estado" value={vaga.cidade} onChange={e => setVaga({...vaga, cidade: e.target.value})} />
          <input style={styles.inputStyle} placeholder="WhatsApp para receber currículos" value={vaga.whatsappContato} onChange={e => setVaga({...vaga, whatsappContato: e.target.value})} />
          <textarea style={{...styles.inputStyle, height: 90}} placeholder="Descreva os requisitos, horários e necessidades do paciente..." value={vaga.desc} onChange={e => setVaga({...vaga, desc: e.target.value})} />
          <button style={styles.btnPrimary} onClick={publicar}>Postar Vaga Agora</button>
        </div>
      )}

      {vagas.length === 0 ? (
        <div style={styles.emptyState}>Buscando novas oportunidades...</div>
      ) : (
        vagas.map(v => (
          <div key={v.id} style={styles.userCard}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
              <h4 style={{margin: 0, textAlign: 'left', color: '#2d3748', fontSize: '16px'}}>{v.titulo}</h4>
              {(ADMIN_EMAILS.includes(user?.email) || v.uid === user?.uid) && (
                <button onClick={() => handleExcluirVaga(v.id)} style={{border:'none',background:'none',cursor:'pointer'}}><IconTrash /></button>
              )}
            </div>
            <p style={{fontSize: '13px', color: '#007b80', fontWeight: 'bold', textAlign: 'left', margin: '6px 0'}}>📍 {v.cidade}</p>
            <p style={styles.longText}>{v.desc}</p>
            
            {(userData?.isPremium || userData?.tipo === 'paciente' || ADMIN_EMAILS.includes(user?.email)) ? (
               <button style={styles.btnWhatsapp} onClick={() => handleVerVaga(v.whatsappContato)}>Candidatar-se à Vaga</button>
            ) : (
               <div style={styles.premiumLock} onClick={() => handleVerVaga(v.whatsappContato)}>
                 <IconLock /> Ver Contato da Vaga (R$ 9,90)
               </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

// --- PAINEL MASTER ADMIN ---
const AdminPanel = ({ todosUsuarios, vagas }) => {
  const [edit, setEdit] = useState(null);
  const [verDoc, setVerDoc] = useState(null);
  const [buscaAdmin, setBuscaAdmin] = useState('');

  const atualizarStatus = async (uid, campos) => {
    await updateDoc(doc(fs, "usuarios", uid), campos);
    setEdit(null);
    setVerDoc(null);
    alert("Alteração salva com sucesso no banco de dados!");
  };

  const excluirUser = async (uid) => {
    if (window.confirm("Atenção: Deseja realmente remover este usuário e todos os seus dados?")) {
      await deleteDoc(doc(fs, "usuarios", uid));
    }
  };

  const excluirVaga = (id) => {
    if (window.confirm("Remover esta vaga do sistema?")) remove(ref(db, `vagas/${id}`));
  };

  // V46: Lógica de filtro super inteligente (ignora parênteses, traços e busca até por ID)
  const usuariosFiltrados = todosUsuarios.filter(u => {
    if (!buscaAdmin) return true; // Se a caixa estiver vazia, mostra todos
    
    const termo = buscaAdmin.toLowerCase();
    const matchNome = (u.nome || '').toLowerCase().includes(termo);
    const matchEmail = (u.email || '').toLowerCase().includes(termo);
    const matchId = (u.id || '').toLowerCase().includes(termo); // Permite buscar pelo UID do Firebase
    
    // Limpa tudo que não for número para achar WhatsApp mesmo se digitarem (11) 99...
    const zapLimpo = (u.whatsapp || '').replace(/\D/g, '');
    const termoNumerico = termo.replace(/\D/g, '');
    const matchZap = termoNumerico.length > 0 && zapLimpo.includes(termoNumerico);

    return matchNome || matchEmail || matchZap || matchId;
  });

  return (
    <div style={{ marginTop: 20 }}>
      <h3 style={{ color: '#c53030', fontSize: 16, borderBottom: '1px solid #ddd', paddingBottom: 10, textAlign: 'left' }}>Gestão da Administração Central</h3>
      
      {verDoc && (
        <div style={styles.modalOverlay} onClick={() => setVerDoc(null)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h4 style={{color: '#007b80', marginTop: 0}}>Documento de: {verDoc.nome}</h4>
            <div style={{backgroundColor: '#000', borderRadius: 10, padding: 5, textAlign: 'center'}}>
               <img src={verDoc.fotoDocumento} style={{ maxWidth: '100%', maxHeight: '60vh', borderRadius: 5, objectFit: 'contain' }} alt="Documento do Usuário" />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button style={{...styles.btnPrimary, margin: 0}} onClick={() => atualizarStatus(verDoc.id, { identidadeVerificada: true })}>Aprovar Documento ✅</button>
              <button style={{...styles.btnOutline, margin: 0}} onClick={() => setVerDoc(null)}>Fechar</button>
            </div>
          </div>
        </div>
      )}

      {edit && (
        <div style={{ ...styles.userCard, backgroundColor: '#ebf8ff', border: '2px solid #3182ce' }}>
          <h4 style={{marginTop: 0, color: '#2b6cb0', textAlign: 'left'}}>Editar: {edit.nome}</h4>
          <div style={{display:'flex', flexDirection: 'column', gap: 12, textAlign: 'left'}}>
            <label style={{display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, fontWeight: 'bold'}}>
              <input type="checkbox" checked={edit.isPremium} onChange={e => setEdit({...edit, isPremium: e.target.checked})} /> Assinatura Premium ⭐
            </label>
            <label style={{display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, fontWeight: 'bold'}}>
              <input type="checkbox" checked={edit.identidadeVerificada} onChange={e => setEdit({...edit, identidadeVerificada: e.target.checked})} /> Identidade Validada ✅
            </label>
            <label style={{display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, fontWeight: 'bold'}}>
              <input type="checkbox" checked={edit.celularVerificado} onChange={e => setEdit({...edit, celularVerificado: e.target.checked})} /> Celular Validado (SMS) 📱
            </label>
            <div style={{display: 'flex', gap: 10, marginTop: 10}}>
              <button style={{...styles.btnPrimary, margin: 0, flex: 1}} onClick={() => atualizarStatus(edit.id, { isPremium: edit.isPremium, identidadeVerificada: edit.identidadeVerificada, celularVerificado: edit.celularVerificado })}>Salvar</button>
              <button style={{...styles.btnOutline, margin: 0, flex: 1}} onClick={() => setEdit(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      <div style={styles.userCard}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15}}>
          <h4 style={{ fontSize: 14, textAlign: 'left', margin: 0 }}>Usuários ({usuariosFiltrados.length})</h4>
        </div>

        <input 
          style={{...styles.inputStyle, marginBottom: 15, padding: 12, fontSize: 13}} 
          placeholder="🔍 Buscar por nome, email ou zap..." 
          value={buscaAdmin} 
          onChange={e => setBuscaAdmin(e.target.value)} 
        />

        <div style={{ maxHeight: 400, overflowY: 'auto' }}>
          {usuariosFiltrados.map(u => (
            <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f0f0f0', alignItems: 'center' }}>
              <div style={{textAlign: 'left'}}>
                <span style={{ fontSize: 13, fontWeight: 'bold', color: '#2d3748' }}>{u.nome}</span>
                <div style={{fontSize: 10, marginTop: 3}}>
                  {u.identidadeVerificada ? '🆔 ID OK ' : '🆔 ID Pend. '} | {u.celularVerificado ? '📱 SMS OK' : '📱 SMS Pend.'}
                </div>
              </div>
              <div style={{display: 'flex', gap: 8, alignItems: 'center'}}>
                {u.fotoDocumento && !u.identidadeVerificada && (
                   <button onClick={() => setVerDoc(u)} style={{fontSize: 10, backgroundColor: '#e53e3e', color: 'white', border: 'none', padding: '6px 10px', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold'}}>Ver Doc</button>
                )}
                <button onClick={() => setEdit(u)} style={{border:'none', background:'none', cursor: 'pointer'}}><IconEdit /></button>
                <button onClick={() => excluirUser(u.id)} style={{border:'none', background:'none', cursor: 'pointer'}}><IconTrash /></button>
              </div>
            </div>
          ))}
          {usuariosFiltrados.length === 0 && <p style={{fontSize: 12, textAlign: 'center', color: '#a0aec0'}}>Nenhum usuário encontrado.</p>}
        </div>
      </div>
    </div>
  );
};

// --- PERFIL DO USUÁRIO (V45: SMS VISÍVEL E MENSAGENS DETALHADAS) ---
const PerfilPage = ({ user, userData, todosUsuarios, vagas }) => {
  const [aba, setAba] = useState('dados');
  const [upLoadingProfile, setUpLoadingProfile] = useState(false);
  const [upLoadingDoc, setUpLoadingDoc] = useState(false); 
  
  const [editandoZap, setEditandoZap] = useState(false);
  const [novoZap, setNovoZap] = useState('');
  
  const [confirmacaoSms, setConfirmacaoSms] = useState(null);
  const [codigoSms, setCodigoSms] = useState('');
  const [loadingSms, setLoadingSms] = useState(false);

  useEffect(() => {
    if (userData?.whatsapp) setNovoZap(userData.whatsapp);
  }, [userData]);

  const handleFileUploadPerfil = async (e, campo) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (campo === 'fotoPerfil') setUpLoadingProfile(true);
    if (campo === 'fotoDocumento') setUpLoadingDoc(true);

    try {
      const base64 = await compressImage(file);
      await updateDoc(doc(fs, "usuarios", user.uid), { [campo]: base64 });
      alert(campo === 'fotoPerfil' ? "✅ Foto de perfil atualizada!" : "✅ Documento enviado para análise!");
    } catch (err) {
      alert("Erro ao salvar a imagem. Tente novamente.");
    }
    
    if (campo === 'fotoPerfil') setUpLoadingProfile(false);
    if (campo === 'fotoDocumento') setUpLoadingDoc(false);
  };

  const prepararSmsPerfil = async () => {
    const zapAlvo = editandoZap ? novoZap : userData?.whatsapp;
    if (!zapAlvo) return alert("Número de telefone não encontrado!");
    
    setLoadingSms(true);
    
    try {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
      
      // V45: Mudança de 'invisible' para 'normal'. O navegador não bloqueia mais!
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container-perfil', { 
        'size': 'normal' 
      });
      
      let limpo = zapAlvo.replace(/\D/g, '');
      if (limpo.startsWith('55') && limpo.length > 11) {
        limpo = limpo.substring(2);
      }
      if (limpo.length < 10) {
        setLoadingSms(false);
        if (window.recaptchaVerifier) window.recaptchaVerifier.clear();
        return alert("Erro: Número muito curto. Digite o DDD + seu número (Ex: 11999999999). Use a opção de editar número!");
      }
      
      const numeroFinal = "+55" + limpo;
      
      const result = await linkWithPhoneNumber(auth.currentUser, numeroFinal, window.recaptchaVerifier);
      setConfirmacaoSms(result);
      alert("Enviamos um código SMS para " + numeroFinal);
    } catch (e) { 
      // V45: Modo Raio-X - Mostra EXATAMENTE o que o Google rejeitou
      console.error(e);
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
      
      alert(
        "ERRO DO GOOGLE FIREBASE:\n\n" + 
        "Código: " + e.code + "\n" + 
        "Motivo: " + e.message + "\n\n" +
        "(Tire um print dessa mensagem se o erro continuar)"
      );
    }
    setLoadingSms(false);
  };

  const confirmarCodigoPerfil = async () => {
    setLoadingSms(true);
    try {
      await confirmacaoSms.confirm(codigoSms);
      await updateDoc(doc(fs, "usuarios", user.uid), { 
        celularVerificado: true,
        ...(editandoZap && { whatsapp: novoZap })
      });
      alert("Parabéns! Seu número foi Validado com sucesso! ✅");
      setConfirmacaoSms(null);
      setEditandoZap(false);
    } catch (e) { 
      alert("Código incorreto ou expirado. Tente novamente."); 
    }
    setLoadingSms(false);
  };

  if (!user || user.isAnonymous) return <div style={styles.emptyState}>Inicie sessão para gerenciar seu painel profissional.</div>;

  return (
    <div>
      <h2 style={styles.pageTitle}>Meu Painel Profissional</h2>
      <div style={styles.tabHeaderContainer}>
         <button onClick={() => setAba('dados')} style={aba === 'dados' ? styles.tabBtnActive : styles.tabBtn}>Meu Perfil</button>
         {ADMIN_EMAILS.includes(user?.email) && <button onClick={() => setAba('admin')} style={aba === 'admin' ? styles.tabBtnActive : styles.tabBtn}>Master Admin</button>}
      </div>
      
      {aba === 'admin' ? (
        <AdminPanel todosUsuarios={todosUsuarios} vagas={vagas} />
      ) : (
         <div style={styles.userCard}>
            
            <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 30, paddingBottom: 20, borderBottom: '1px solid #e2e8f0'}}>
              <div style={{ width: 110, height: 110, borderRadius: '50%', backgroundColor: '#edf2f7', overflow: 'hidden', border: '4px solid #007b80', position: 'relative', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
                 {userData?.fotoPerfil ? (
                   <img src={userData.fotoPerfil} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Sua Foto" />
                 ) : (
                   <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%'}}><IconCamera /></div>
                 )}
                 <input type="file" accept="image/*" style={styles.fileInputHidden} onChange={e => handleFileUploadPerfil(e, 'fotoPerfil')} disabled={upLoadingProfile} />
              </div>
              <p style={{fontSize: 12, color: '#007b80', marginTop: 10, fontWeight: '900'}}>{upLoadingProfile ? "Salvando foto..." : "Toque na foto para alterar"}</p>
            </div>

            <div style={{textAlign: 'left', marginBottom: 25}}>
              <p style={{fontSize: 18, fontWeight: '900', color: '#2d3748', margin: '0 0 10px 0'}}>{userData?.nome}</p>
              <p style={{margin: '5px 0'}}><strong>WhatsApp:</strong> {userData?.whatsapp}</p>
              <p style={{margin: '5px 0'}}><strong>Conta:</strong> {userData?.isPremium ? "Assinante Premium ⭐" : "Padrão"}</p>
            </div>

            <div style={{textAlign: 'left', marginBottom: 25}}>
              <p style={{margin: '5px 0'}}><strong>Documento:</strong> {userData?.identidadeVerificada ? "✅ Validada pelo Admin" : "⌛ Aguardando Validação"}</p>
              
              {!userData?.identidadeVerificada && (
                <div style={{backgroundColor: '#fffaf0', padding: 15, borderRadius: 12, border: '1px dashed #f6ad55', marginTop: 10, position: 'relative'}}>
                  <p style={{fontSize: 12, fontWeight: 'bold', color: '#dd6b20', margin: '0 0 10px 0'}}>📸 Envie uma foto do seu RG ou CNH para ganhar o selo de Identidade Verificada.</p>
                  
                  {userData?.fotoDocumento ? (
                    <div style={{backgroundColor: '#e6fffa', padding: 10, borderRadius: 8, color: '#2f855a', fontSize: 12, fontWeight: 'bold', textAlign: 'center'}}>
                      Documento enviado! Aguardando análise da administração.
                    </div>
                  ) : (
                    <div style={{position: 'relative', overflow: 'hidden', display: 'inline-block'}}>
                      <button style={{backgroundColor: '#f6ad55', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer'}}>
                        {upLoadingDoc ? "Carregando..." : "Escolher Arquivo do Documento"}
                      </button>
                      <input type="file" accept="image/*" style={styles.fileInputHidden} onChange={e => handleFileUploadPerfil(e, 'fotoDocumento')} disabled={upLoadingDoc} />
                    </div>
                  )}
                </div>
              )}
            </div>

            <div style={{textAlign: 'left', marginBottom: 25}}>
               <p style={{margin: '5px 0'}}><strong>Status do Celular:</strong> {userData?.celularVerificado ? "✅ Verificado via SMS" : "❌ Não Verificado"}</p>
               
               {!userData?.celularVerificado && (
                <div style={{backgroundColor: '#f0fff4', padding: 20, borderRadius: 15, border: '1px solid #25D366', marginTop: 10}}>
                  <h4 style={{margin: '0 0 10px 0', color: '#2f855a'}}>Aumente sua Credibilidade</h4>
                  <p style={{fontSize: 12, marginBottom: 15, lineHeight: '1.4'}}>Para receber seu selo verde, você precisa validar seu número.</p>
                  
                  <div style={{marginBottom: 15, paddingBottom: 15, borderBottom: '1px dashed #9ae6b4'}}>
                    {editandoZap ? (
                      <div>
                        <p style={{fontSize: 11, fontWeight: 'bold', color: '#2f855a', margin: '0 0 5px 0'}}>Digite o número correto (DDD + Número):</p>
                        <input style={{...styles.inputStyle, padding: 10, fontSize: 13, marginBottom: 5}} placeholder="Ex: 11999999999" value={novoZap} onChange={e => setNovoZap(e.target.value)} />
                        <button onClick={() => setEditandoZap(false)} style={{fontSize: 11, color: '#e53e3e', background: 'none', border: 'none', cursor: 'pointer', padding: 0}}>Cancelar Edição</button>
                      </div>
                    ) : (
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                        <p style={{fontSize: 13, margin: 0}}>Enviar SMS para: <strong>{userData?.whatsapp}</strong></p>
                        <button onClick={() => setEditandoZap(true)} style={{fontSize: 11, color: '#3182ce', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 'bold', textDecoration: 'underline'}}>Editar Número</button>
                      </div>
                    )}
                  </div>

                  {/* V45: Recaptcha agora ficará visível aqui! */}
                  <div id="recaptcha-container-perfil" style={{marginBottom: 15, display: 'flex', justifyContent: 'center'}}></div>
                  
                  {!confirmacaoSms ? (
                    <button style={styles.btnPrimary} onClick={prepararSmsPerfil} disabled={loadingSms}>{loadingSms ? "Analisando..." : "Receber Código SMS"}</button>
                  ) : (
                    <div style={{marginTop: 10}}>
                      <input style={{...styles.inputStyle, textAlign: 'center', fontSize: 20, letterSpacing: 5}} placeholder="000000" value={codigoSms} onChange={e => setCodigoSms(e.target.value)} maxLength={6} />
                      <button style={styles.btnWhatsapp} onClick={confirmarCodigoPerfil} disabled={loadingSms}>Validar Meu Número</button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {!userData?.isPremium && userData?.tipo === 'cuidador' && (
               <button style={{...styles.btnPrimary, backgroundColor: '#d69e2e', marginTop: 10}} onClick={() => window.open(LINK_PAGAMENTO)}>Fazer Upgrade para Premium ⭐</button>
            )}
            
            <button style={{...styles.btnOutline, color: '#e53e3e', borderColor: '#feb2b2', marginTop: 40}} onClick={() => signOut(auth)}>Sair da Conta (Logout)</button>
         </div>
      )}
    </div>
  );
};

// --- CURSOS E SAÚDE ---
const CursosPage = () => (
  <div>
    <h2 style={styles.pageTitle}>Capacitação e Saúde</h2>
    <div style={styles.userCard}>
      <h3 style={{fontSize: 16, color: '#007b80', marginBottom: 15, textAlign: 'left'}}>Aula Prática: Primeiros Socorros</h3>
      <div style={{borderRadius: 15, overflow: 'hidden', backgroundColor: '#000', boxShadow: '0 5px 15px rgba(0,0,0,0.2)'}}>
        <iframe width="100%" height="280" src="https://www.youtube.com/embed/1MtKw-uP1NM" title="Aula de Primeiros Socorros" frameBorder="0" allowFullScreen></iframe>
      </div>
    </div>
    <div style={styles.userCardFeatured}>
      <h3 style={{margin: 0, fontSize: 18, color: '#007b80'}}>Treinamento Master Hotmart</h3>
      <button style={styles.btnPrimary} onClick={() => window.open("https://go.hotmart.com/M104780028R", "_blank")}>Ver Detalhes do Curso</button>
    </div>
  </div>
);

const DicasPage = () => (
  <div>
    <h2 style={styles.pageTitle}>Manual Técnico de Saúde</h2>
    <div style={styles.userCard}><h3 style={{color:'#007b80', fontSize:17, textAlign: 'left'}}>Prevenção de Escaras (LPP)</h3><p style={styles.longText}>A mudança de decúbito (troca de posição) a cada 2 horas é a regra de ouro para pacientes acamados.</p></div>
    <div style={styles.userCard}><h3 style={{color:'#007b80', fontSize:17, textAlign: 'left'}}>Hidratação e Nutrição</h3><p style={styles.longText}>Mantenha uma garrafa de água sempre visível. Idosos frequentemente perdem o reflexo natural da sede.</p></div>
  </div>
);

// --- LOGIN, CADASTRO COMPLETO E SMS ---
const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [isCad, setIsCad] = useState(false);
  const [step, setStep] = useState(1); 
  const [loading, setLoading] = useState(false);
  const [recaptchaRendered, setRecaptchaRendered] = useState(false);
  
  const [form, setForm] = useState({ nome: '', whatsapp: '', cidade: '', tipo: 'cuidador', especialidades: [], biografia: '', descricao: '', fotoPerfil: '', fotoDocumento: '' });
  
  const [confirmacao, setConfirmacao] = useState(null);
  const [codigoSms, setCodigoSms] = useState('');
  const navigate = useNavigate();

  const handleCheckbox = (esp) => {
    const list = form.especialidades.includes(esp) ? form.especialidades.filter(item => item !== esp) : [...form.especialidades, esp];
    setForm({...form, especialidades: list});
  };

  const handleFileUpload = async (e, campo) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const base64 = await compressImage(file);
      setForm({...form, [campo]: base64});
      alert(campo === 'fotoPerfil' ? "Foto de Perfil adicionada!" : "Documento anexado!");
    } catch(err) {
      alert("Erro ao processar imagem.");
    }
  };

  const handleCriarConta = async () => {
    if (!form.nome || !form.whatsapp || !form.cidade || !email || !senha) return alert("Preencha todos os campos de texto!");
    if (form.tipo === 'cuidador' && !form.fotoDocumento) return alert("O upload do Documento de Identidade é obrigatório para cuidadores!");
    
    setLoading(true);
    try {
      const res = await createUserWithEmailAndPassword(auth, email, senha);
      await setDoc(doc(fs, "usuarios", res.user.uid), { 
        ...form, uid: res.user.uid, email, celularVerificado: false, identidadeVerificada: false, isPremium: false, dataCadastro: new Date().toLocaleDateString()
      });
      setStep(2); 
    } catch (e) { 
      alert("Erro ao criar conta. E-mail já existe ou senha muito fraca."); 
    }
    setLoading(false);
  };

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, senha);
      navigate('/');
    } catch (e) { alert("Dados incorretos."); }
  };

  useEffect(() => {
    if (step === 2 && !recaptchaRendered) {
      prepararSms();
      setRecaptchaRendered(true);
    }
  }, [step]);

  const prepararSms = async () => {
    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
      window.recaptchaVerifier = null;
    }
    // No login/cadastro mantemos invisível para não quebrar a fluidez
    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container-login', { 'size': 'invisible' });
    
    let limpoLogin = form.whatsapp.replace(/\D/g, '');
    if (limpoLogin.startsWith('55') && limpoLogin.length > 11) {
      limpoLogin = limpoLogin.substring(2);
    }
    const numero = "+55" + limpoLogin;
    
    try {
      const result = await linkWithPhoneNumber(auth.currentUser, numero, window.recaptchaVerifier);
      setConfirmacao(result);
    } catch (e) {
      console.error(e);
      alert("Falha de segurança ao enviar SMS. Pule por enquanto e tente depois no seu Perfil.");
      navigate('/');
    }
  };

  const confirmarCodigo = async () => {
    setLoading(true);
    try {
      await confirmacao.confirm(codigoSms);
      await updateDoc(doc(fs, "usuarios", auth.currentUser.uid), { celularVerificado: true });
      alert("Cadastro Concluído! Celular Verificado com sucesso. ✅");
      navigate('/');
    } catch (e) { 
      alert("Código incorreto. Tente novamente."); 
    }
    setLoading(false);
  };

  if (step === 2) {
    return (
      <div style={{ padding: '80px 20px', textAlign: 'center' }}>
        <h2 style={styles.pageTitle}>Falta pouco!</h2>
        <div style={{backgroundColor: '#f0fff4', padding: 25, borderRadius: 15, border: '1px solid #25D366'}}>
          <h4 style={{margin: '0 0 10px 0', color: '#2f855a'}}>Verificação de Celular</h4>
          <p style={{fontSize: 13, marginBottom: 20}}>Enviamos um código SMS para o seu número.</p>
          <div id="recaptcha-container-login"></div>
          
          {!confirmacao ? (
            <p style={{color: '#007b80', fontWeight: 'bold'}}>Preparando segurança e enviando código...</p>
          ) : (
            <div>
              <input style={{...styles.inputStyle, textAlign: 'center', fontSize: 20, letterSpacing: 5}} placeholder="000000" value={codigoSms} onChange={e => setCodigoSms(e.target.value)} maxLength={6} />
              <button style={styles.btnWhatsapp} onClick={confirmarCodigo} disabled={loading}>{loading ? "Validando..." : "Confirmar Código"}</button>
            </div>
          )}
          <button style={{...styles.btnOutline, border: 'none', color: '#a0aec0', marginTop: 20}} onClick={() => navigate('/')}>Pular por enquanto</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px 20px 80px' }}>
      <h2 style={styles.pageTitle}>{isCad ? "Crie sua Conta" : "Acesso à Plataforma"}</h2>
      <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
        
        {isCad && (
          <div style={{backgroundColor: '#fff', padding: 20, borderRadius: 15, boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: 15}}>
            
            <h4 style={{margin: '0 0 15px 0', color: '#007b80', borderBottom: '1px solid #edf2f7', paddingBottom: 10}}>1. Dados Pessoais</h4>
            <input style={styles.inputStyle} placeholder="Nome Completo" onChange={e => setForm({...form, nome: e.target.value})} />
            <input style={styles.inputStyle} placeholder="WhatsApp (Ex: 11999999999)" type="tel" onChange={e => setForm({...form, whatsapp: e.target.value})} />
            <input style={styles.inputStyle} placeholder="Sua Cidade e Estado (UF)" onChange={e => setForm({...form, cidade: e.target.value})} />
            
            <label style={{fontSize: 13, fontWeight: 'bold', color: '#4a5568', marginTop: 10, display: 'block'}}>O que você busca?</label>
            <select style={{...styles.inputStyle, marginTop: 5}} onChange={e => setForm({...form, tipo: e.target.value})}>
              <option value="cuidador">Sou Cuidador (Quero trabalhar)</option>
              <option value="paciente">Sou Família (Procuro Cuidador)</option>
            </select>

            {form.tipo === 'cuidador' ? (
              <div style={{marginTop: 20, textAlign: 'left', borderTop: '1px solid #e2e8f0', paddingTop: 20}}>
                <h4 style={{margin: '0 0 15px 0', color: '#007b80', borderBottom: '1px solid #edf2f7', paddingBottom: 10}}>2. Perfil Profissional</h4>
                
                <div style={{display: 'flex', gap: 10, marginBottom: 20}}>
                  <div style={{flex: 1, backgroundColor: '#f8fafc', padding: 10, borderRadius: 10, border: '1px dashed #cbd5e0', textAlign: 'center', position: 'relative'}}>
                    <p style={{fontSize: 11, fontWeight: 'bold', color: '#4a5568', margin: '0 0 5px'}}>Foto de Perfil</p>
                    <IconCamera />
                    {form.fotoPerfil && <span style={{display: 'block', fontSize: 10, color: 'green', marginTop: 5}}>Anexada ✅</span>}
                    <input type="file" accept="image/*" style={styles.fileInputHidden} onChange={e => handleFileUpload(e, 'fotoPerfil')} />
                  </div>
                  <div style={{flex: 1, backgroundColor: '#fffaf0', padding: 10, borderRadius: 10, border: '1px dashed #f6ad55', textAlign: 'center', position: 'relative'}}>
                    <p style={{fontSize: 11, fontWeight: 'bold', color: '#dd6b20', margin: '0 0 5px'}}>Foto RG/CNH (Sigilo)</p>
                    <IconId title="Anexar Documento" />
                    {form.fotoDocumento && <span style={{display: 'block', fontSize: 10, color: 'green', marginTop: 5}}>Anexada ✅</span>}
                    <input type="file" accept="image/*" style={styles.fileInputHidden} onChange={e => handleFileUpload(e, 'fotoDocumento')} />
                  </div>
                </div>

                <p style={{fontSize: 12, fontWeight: '900', color: '#007b80', marginBottom: 10}}>Marque suas Especialidades:</p>
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10}}>
                  {LISTA_ESPECIALIDADES.map(es => (
                    <label key={es} style={{fontSize: 11, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', backgroundColor: '#f8fafc', padding: '6px', borderRadius: 8, border: '1px solid #edf2f7'}}>
                      <input type="checkbox" onChange={() => handleCheckbox(es)} /> {es}
                    </label>
                  ))}
                </div>
                
                <textarea style={{...styles.inputStyle, height: 80, marginTop: 15}} placeholder="Mini currículo: Fale sobre sua experiência..." onChange={e => setForm({...form, biografia: e.target.value})} />
              </div>
            ) : (
              <div style={{marginTop: 20, textAlign: 'left', borderTop: '1px solid #e2e8f0', paddingTop: 20}}>
                <h4 style={{margin: '0 0 15px 0', color: '#007b80', borderBottom: '1px solid #edf2f7', paddingBottom: 10}}>2. Detalhes do Paciente</h4>
                <textarea style={{...styles.inputStyle, height: 100}} placeholder="Descreva a necessidade (Idade, doenças, horários)..." onChange={e => setForm({...form, descricao: e.target.value})} />
              </div>
            )}
          </div>
        )}
        
        <input style={styles.inputStyle} placeholder="Seu E-mail de Acesso" type="email" onChange={e => setEmail(e.target.value)} />
        <input style={styles.inputStyle} type="password" placeholder="Sua Senha (mínimo 6 letras/números)" onChange={e => setSenha(e.target.value)} />
        
        {isCad ? (
           <button style={styles.btnPrimary} onClick={handleCriarConta} disabled={loading}>{loading ? "Aguarde..." : "Finalizar Cadastro e Validar SMS"}</button>
        ) : (
           <button style={styles.btnPrimary} onClick={handleLogin}>Entrar no Painel</button>
        )}
        
        <button style={styles.btnOutline} onClick={() => setIsCad(!isCad)}>{isCad ? "Já tenho conta, quero entrar" : "Ainda não tenho cadastro"}</button>
      </div>
    </div>
  );
};

// --- APP PRINCIPAL E ROTAS ---
export function App() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [todosUsuarios, setTodosUsuarios] = useState([]);
  const [vagas, setVagas] = useState([]);

  useEffect(() => {
    onAuthStateChanged(auth, u => {
      setUser(u);
      if (u && !u.isAnonymous) onSnapshot(doc(fs, "usuarios", u.uid), d => setUserData(d.data()));
      else if (!u) signInAnonymously(auth);
    });
    
    onSnapshot(collection(fs, "usuarios"), s => {
      // V46: Removido o filtro que escondia usuários incompletos, garantindo que o Admin veja TODOS do banco
      const usersList = s.docs.map(d => ({ id: d.id, ...d.data() }));
      setTodosUsuarios(usersList);
    });
    
    onValue(ref(db, 'vagas'), s => {
      const v = s.val();
      setVagas(v ? Object.keys(v).map(k => ({ id: k, ...v[k] })).reverse() : []);
    });
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout user={user} />}>
          <Route index element={<HomePage todosUsuarios={todosUsuarios} user={user} userData={userData} />} />
          <Route path="vagas" element={<VagasPage vagas={vagas} user={user} userData={userData} />} />
          <Route path="cursos" element={<CursosPage />} />
          <Route path="sobre" element={<SobrePage />} />
          <Route path="privacidade" element={<PrivacidadePage />} />
          <Route path="termos" element={<TermosPage />} />
          <Route path="contato" element={<ContatoPage />} />
          <Route path="dicas" element={<DicasPage />} />
          <Route path="perfil" element={<PerfilPage user={user} userData={userData} todosUsuarios={todosUsuarios} vagas={vagas} />} />
        </Route>
        <Route path="login" element={<LoginPage />} />
      </Routes>
    </BrowserRouter>
  );
}

// --- ESTILOS DE DESIGN (UI/UX) ---
const styles = {
  headerStyle: { position:'fixed', top:0, left:0, right:0, backgroundColor:'white', padding:'12px 20px', display:'flex', justifyContent:'space-between', alignItems: 'center', borderBottom:'1px solid #e2e8f0', zIndex:1000 },
  backBtn: { background: 'none', border: 'none', padding: '0 8px 0 0', cursor: 'pointer', display: 'flex', alignItems: 'center' },
  footerStyle: { position:'fixed', bottom:0, left:0, right:0, backgroundColor:'#007b80', padding:'14px', display:'flex', justifyContent:'space-around', zIndex:1000 },
  footerLink: { color:'rgba(255,255,255,0.7)', textDecoration:'none', fontSize:'11px', fontWeight:'700', textTransform: 'uppercase' },
  footerLinkActive: { color:'white', textDecoration:'none', fontSize:'11px', fontWeight:'900', borderBottom: '2px solid white', paddingBottom: '2px' },
  
  bannerPremium: { background: 'linear-gradient(135deg, #007b80 0%, #005a5e 100%)', borderRadius: '25px', padding: '35px 20px', color: 'white', textAlign: 'center', marginBottom: '20px', boxShadow: '0 8px 20px rgba(0, 90, 94, 0.2)' },
  bannerTitle: { margin: 0, fontSize: '22px', fontWeight: '900', lineHeight: '1.2' },
  bannerSubtitle: { margin: '8px 0 0', fontSize: '13px', opacity: 0.9 },
  valuePropositionRow: { display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '25px' },
  valueCardGreen: { flex: 1, backgroundColor: '#e6f7ff', border: '2px solid #007b80', borderRadius: '20px', padding: '15px', textAlign: 'center' },
  valueCardGold: { flex: 1, backgroundColor: '#fffaf0', border: '2px solid #FFD700', borderRadius: '20px', padding: '15px', textAlign: 'center' },
  valueCardTitle: { margin: '5px 0 0', fontSize: '12px', fontWeight: '900', color: '#333' },
  valueCardText: { margin: 0, fontSize: '10px', color: '#555' },
  
  tabHeaderContainer: { display: 'flex', backgroundColor: '#e2e8f0', borderRadius: '15px', padding: '5px', marginBottom: '20px' },
  tabBtn: { flex: 1, padding: '12px', border: 'none', background: 'none', color: '#718096', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' },
  tabBtnActive: { flex: 1, padding: '12px', border: 'none', backgroundColor: 'white', color: '#007b80', borderRadius: '11px', fontWeight: '900', fontSize: '14px', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' },
  searchField: { width: '100%', padding: '16px', borderRadius: '14px', border: '1px solid #cbd5e0', marginBottom: '20px', boxSizing: 'border-box', fontSize: '15px', backgroundColor: '#fff' },
  userCard: { backgroundColor:'white', padding:'20px', borderRadius:'22px', marginBottom:'15px', border:'1px solid #edf2f7', boxShadow: '0 4px 12px rgba(0,0,0,0.04)', position: 'relative' },
  userCardFeatured: { backgroundColor:'#e6f7ff', padding:'20px', borderRadius:'22px', marginBottom:'15px', border:'2px solid #007b80' },
  tagSkill: { fontSize: '11px', padding: '4px 10px', borderRadius: '10px', fontWeight: '800', backgroundColor: '#eaf4f4', color: '#007b80', border: '1px solid #c2e2e2' },
  btnWhatsapp: { width:'100%', backgroundColor:'#25D366', color:'white', border:'none', padding:'16px', borderRadius:'14px', fontWeight:'900', marginTop:'15px', cursor: 'pointer', fontSize: '15px', boxShadow: '0 4px 10px rgba(37, 211, 102, 0.3)' },
  premiumLock: { width:'100%', backgroundColor:'#fff6f6', color:'#c82f2f', padding:'15px', borderRadius:'14px', textAlign:'center', border:'1.5px dashed #f5b7b7', marginTop: 15, fontSize: 13, cursor: 'pointer', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 },
  pageTitle: { color:'#007b80', textAlign:'center', marginBottom: '25px', fontWeight: '900', fontSize: '22px' },
  inputStyle: { width:'100%', padding:'16px', backgroundColor: '#f8fafc', borderRadius:'12px', border:'1px solid #e2e8f0', marginBottom: '10px', boxSizing: 'border-box', fontSize: '14px' },
  btnPrimary: { width:'100%', backgroundColor:'#007b80', color:'white', border:'none', padding:'16px', borderRadius:'14px', fontWeight:'900', marginTop:'10px', cursor: 'pointer', fontSize: '15px' },
  btnOutline: { width:'100%', background:'none', border:'2px solid #007b80', color:'#007b80', padding:'15px', borderRadius:'14px', marginTop:'10px', fontWeight: '900', cursor: 'pointer', fontSize: '15px' },
  longText: { fontSize: 14, color: '#4a5568', lineHeight: '1.6', textAlign: 'left', marginBottom: '10px' },
  loginBtn: { color: '#007b80', fontWeight: '900', fontSize: '13px', border: 'none', background: 'none', cursor: 'pointer' },
  legalLink: { fontSize: 11, fontWeight: '900', color: '#a0aec0', textDecoration: 'none', textTransform: 'uppercase' },
  emptyState: { textAlign: 'center', color: '#a0aec0', padding: '40px 20px', fontWeight: 'bold' },
  fileInputHidden: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', zIndex: 10 },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: 'white', padding: '25px', borderRadius: '20px', maxWidth: 500, width: '100%', maxHeight: '90vh', overflowY: 'auto' }
};

const r = document.getElementById('root');
if (r) { createRoot(r).render(<App />); }
