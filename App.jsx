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

// ACESSO MASTER - Luciano
const ADMIN_EMAIL = "lucyano.pci@gmail.com";
const LINK_PAGAMENTO = "https://mpago.la/1AJppRz";

const LISTA_ESPECIALIDADES = [
  "Cuidador de Idosos", 
  "Técnico em Enfermagem", 
  "Pós-Operatório", 
  "Cadeirantes", 
  "Pacientes Acamados", 
  "Troca de Curativos", 
  "Administração de Injeções", 
  "Cuidado com Crianças", 
  "Acompanhamento Hospitalar", 
  "Higiene Pessoal"
];

// --- ÍCONES SVG ---
const IconHeart = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="#007b80">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
  </svg>
);

const IconStar = ({ filled }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? "#FFD700" : "none"} stroke={filled ? "#FFD700" : "#ccc"} strokeWidth="2">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

const IconLock = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c53030" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

const IconTrash = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e53e3e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    <line x1="10" y1="11" x2="10" y2="17"></line>
    <line x1="14" y1="11" x2="14" y2="17"></line>
  </svg>
);

const IconCheck = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="#25D366">
    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
  </svg>
);

const IconEdit = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3182ce" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4L18.5 2.5z"></path>
  </svg>
);

// --- COMPONENTES AUXILIARES ---
const Stars = ({ rating = 0, total = 0 }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
    {[1, 2, 3, 4, 5].map(num => <IconStar key={num} filled={num <= Math.round(rating)} />)}
    <span style={{ fontSize: '10px', color: '#999', marginLeft: '5px' }}>({total})</span>
  </div>
);

// --- PÁGINAS OBRIGATÓRIAS GOOGLE ADS ---
const SobrePage = () => (
  <div style={styles.userCard}>
    <h2 style={styles.pageTitle}>Sobre o SOS Cuidadores Brasil</h2>
    <p style={styles.longText}>O SOS Cuidadores Brasil nasceu da necessidade de conectar profissionais da saúde e famílias de forma direta, transparente e segura.</p>
    <p style={styles.longText}>Acreditamos que o cuidado domiciliar exige confiança. Por isso, oferecemos ferramentas de verificação por SMS e avaliações reais para garantir que cada paciente receba o melhor atendimento possível.</p>
    <p style={styles.longText}>Nossa plataforma é gratuita para famílias publicarem suas vagas e oferece um plano Premium para cuidadores que buscam destaque e acesso ilimitado.</p>
  </div>
);

const PrivacidadePage = () => (
  <div style={styles.userCard}>
    <h2 style={styles.pageTitle}>Política de Privacidade</h2>
    <p style={styles.longText}>Sua privacidade é nossa prioridade. Em conformidade com a LGPD, coletamos apenas os dados necessários para o funcionamento do serviço: Nome, E-mail, Cidade e Telefone.</p>
    <p style={styles.longText}>1. **Segurança:** Utilizamos criptografia SSL e os servidores seguros do Google Firebase para armazenar suas informações.</p>
    <p style={styles.longText}>2. **Uso de Dados:** Seus dados nunca serão vendidos a terceiros. Eles servem apenas para que contratantes visualizem seu perfil profissional.</p>
    <p style={styles.longText}>3. **Exclusão:** Você tem o direito de solicitar a exclusão total dos seus dados a qualquer momento através do seu painel de perfil.</p>
  </div>
);

const TermosPage = () => (
  <div style={styles.userCard}>
    <h2 style={styles.pageTitle}>Termos e Condições</h2>
    <p style={styles.longText}>Ao acessar o SOS Cuidadores, você concorda com os seguintes termos:</p>
    <p style={styles.longText}>- A plataforma é apenas uma vitrine de contatos. Não nos responsabilizamos por acordos financeiros ou condutas técnicas entre as partes.</p>
    <p style={styles.longText}>- É proibido postar conteúdo falso ou ofensivo.</p>
    <p style={styles.longText}>- A verificação por SMS confirma a posse do número de telefone, mas recomendamos que famílias sempre chequem referências físicas antes da contratação.</p>
  </div>
);

const ContatoPage = () => (
  <div style={styles.userCard}>
    <h2 style={styles.pageTitle}>Central de Atendimento</h2>
    <p style={styles.longText}>Precisa de ajuda com seu cadastro ou quer denunciar um perfil? Entre em contato com nossa equipe de suporte:</p>
    <div style={{textAlign: 'center', marginTop: 25}}>
      <div style={{backgroundColor: '#eaf4f4', padding: '20px', borderRadius: 15, border: '1px solid #007b80'}}>
        <p style={{margin: 0, fontWeight: 'bold', color: '#007b80'}}>E-mail Oficial:</p>
        <p style={{margin: '5px 0 0', fontSize: '18px', fontWeight: '900'}}>{ADMIN_EMAIL}</p>
      </div>
    </div>
  </div>
);

const Layout = ({ user }) => {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <div style={{ backgroundColor: '#f4f7f6', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <header style={styles.headerStyle}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <IconHeart /><span style={{ fontWeight: '900', color: '#007b80', fontSize: '20px' }}>SOS CUIDADORES</span>
        </Link>
        {user && !user.isAnonymous ? (
          <button style={styles.loginBtn} onClick={() => signOut(auth)}>Sair</button>
        ) : (
          <Link to="/login" style={styles.loginBtn}>Entrar</Link>
        )}
      </header>

      <main style={{ maxWidth: '550px', margin: '0 auto', padding: '85px 16px 140px' }}>
        <Outlet />
        
        {/* RODAPÉ DE LINKS LEGAIS */}
        <div style={{ marginTop: 60, borderTop: '1px solid #e2e8f0', paddingTop: 30, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 20 }}>
          <Link to="/sobre" style={styles.legalLink}>Sobre Nós</Link>
          <Link to="/privacidade" style={styles.legalLink}>Privacidade</Link>
          <Link to="/termos" style={styles.legalLink}>Termos</Link>
          <Link to="/contato" style={styles.legalLink}>Suporte</Link>
        </div>
        <p style={{textAlign:'center', fontSize: 10, color:'#a0aec0', marginTop: 20}}>© 2024 SOS Cuidadores Brasil - CNPJ Sob Consulta</p>
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

// --- PÁGINA INICIAL ---
const HomePage = ({ todosUsuarios = [], user, userData }) => {
  const [busca, setBusca] = useState('');
  const [abaAtiva, setAbaAtiva] = useState('cuidadores');
  const navigate = useNavigate();

  const handleContact = (u) => {
    if (!user || user.isAnonymous) {
      navigate('/login');
      return;
    }
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

      <div style={styles.searchBox}>
        <input style={styles.searchField} placeholder="🔍 Buscar por cidade..." value={busca} onChange={e => setBusca(e.target.value)} />
      </div>

      {filtered.map(u => (
        <div key={u.id} style={styles.userCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{textAlign: 'left'}}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#2d3748', display: 'flex', alignItems: 'center', gap: 6 }}>
                {u.nome} {u.celularVerificado && <IconCheck />}
              </h3>
              <p style={{ fontSize: '13px', color: '#007b80', fontWeight: 'bold', margin: '4px 0' }}>📍 {u.cidade || "Localização não informada"}</p>
              {u.celularVerificado && <span style={{fontSize: 10, color: '#25D366', fontWeight: '900'}}>PERFIL VALIDADO ✅</span>}
            </div>
            {u.tipo === 'cuidador' && <Stars rating={(u.ratingSum || 0) / (u.totalRatings || 1)} total={u.totalRatings || 0} />}
          </div>
          
          <div style={{marginTop: 12, textAlign: 'left'}}>
             {u.tipo === 'cuidador' ? (
                <div style={{display: 'flex', flexWrap: 'wrap', gap: 6}}>
                   {Array.isArray(u.especialidades) ? u.especialidades.map((e, i) => (
                      <span key={i} style={styles.tagSkill}>{e}</span>
                   )) : <span style={styles.tagSkill}>Cuidador Geral</span>}
                </div>
             ) : <p style={{fontSize: 14, color: '#4a5568'}}><strong>Necessidade:</strong> {u.necessidade}</p>}
          </div>

          {(userData?.tipo === 'paciente' || userData?.isPremium || user?.email === ADMIN_EMAIL) ? (
            <button style={styles.btnWhatsapp} onClick={() => handleContact(u)}>Falar no WhatsApp</button>
          ) : (
            <div style={styles.premiumLock} onClick={() => (!user || user.isAnonymous) ? navigate('/login') : window.open(LINK_PAGAMENTO)}>
              <IconLock /> Ver Contatos e Perfil (R$ 9,90)
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// --- RESTAURAÇÃO: MURAL DE VAGAS COM FORMULÁRIO ---
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
    if (userData?.isPremium || userData?.tipo === 'paciente' || user?.email === ADMIN_EMAIL) {
       window.open(`https://wa.me/55${num?.replace(/\D/g, '')}`, '_blank');
    } else {
       window.open(LINK_PAGAMENTO, '_blank');
    }
  };

  return (
    <div>
      <h2 style={styles.pageTitle}>Mural de Oportunidades</h2>
      
      {/* FORMULÁRIO DE POSTAR VAGAS (RESTAURADO) */}
      {(userData?.tipo === 'paciente' || user?.email === ADMIN_EMAIL) && (
        <div style={styles.userCard}>
          <div style={{backgroundColor: '#e6f7ff', padding: '8px', borderRadius: '10px', color: '#007b80', fontWeight: 'bold', fontSize: '12px', textAlign: 'center', marginBottom: '15px'}}>DIVULGAÇÃO 100% GRÁTIS</div>
          <input style={styles.inputStyle} placeholder="Título da Vaga (Ex: Cuidador para Idoso de 80 anos)" value={vaga.titulo} onChange={e => setVaga({...vaga, titulo: e.target.value})} />
          <input style={styles.inputStyle} placeholder="Cidade/Estado" value={vaga.cidade} onChange={e => setVaga({...vaga, cidade: e.target.value})} />
          <input style={styles.inputStyle} placeholder="Seu WhatsApp para contato" value={vaga.whatsappContato} onChange={e => setVaga({...vaga, whatsappContato: e.target.value})} />
          <textarea style={{...styles.inputStyle, height: 90}} placeholder="Descreva os requisitos, horários e necessidades..." value={vaga.desc} onChange={e => setVaga({...vaga, desc: e.target.value})} />
          <button style={styles.btnPrimary} onClick={publicar}>Postar Vaga Grátis</button>
        </div>
      )}

      {vagas.length === 0 ? (
        <div style={styles.emptyState}>Buscando novas vagas...</div>
      ) : (
        vagas.map(v => (
          <div key={v.id} style={styles.userCard}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
              <h4 style={{margin: 0, textAlign: 'left', color: '#2d3748'}}>{v.titulo}</h4>
              {(user?.email === ADMIN_EMAIL || v.uid === user?.uid) && (
                <button onClick={() => handleExcluirVaga(v.id)} style={{border:'none',background:'none',cursor:'pointer'}}><IconTrash /></button>
              )}
            </div>
            <p style={{fontSize: '12px', color: '#007b80', fontWeight: 'bold', textAlign: 'left', margin: '5px 0'}}>📍 {v.cidade}</p>
            <p style={styles.longText}>{v.desc}</p>
            
            {(userData?.isPremium || userData?.tipo === 'paciente' || user?.email === ADMIN_EMAIL) ? (
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

// --- RESTAURAÇÃO: PAINEL MASTER ADMIN COMPLETO ---
const AdminPanel = ({ todosUsuarios, vagas }) => {
  const [editingUser, setEditingUser] = useState(null);

  const excluirUser = async (uid) => {
    if (window.confirm("Deseja realmente remover este usuário e todos os seus dados?")) {
      await deleteDoc(doc(fs, "usuarios", uid));
    }
  };

  const handleEditClick = (u) => setEditingUser({...u});

  const handleUpdateUser = async () => {
    if (!editingUser.nome || !editingUser.cidade) return alert("Preencha os campos obrigatórios!");
    try {
      const userRef = doc(fs, "usuarios", editingUser.id);
      await updateDoc(userRef, {
        nome: editingUser.nome,
        cidade: editingUser.cidade,
        whatsapp: editingUser.whatsapp,
        isPremium: editingUser.isPremium || false,
        celularVerificado: editingUser.celularVerificado || false
      });
      alert("Usuário atualizado com sucesso!");
      setEditingUser(null);
    } catch (e) { alert("Erro ao atualizar o usuário."); }
  };
  
  const excluirVaga = (id) => {
    if (window.confirm("Remover esta vaga do sistema?")) remove(ref(db, `vagas/${id}`));
  };

  return (
    <div style={{ marginTop: 20 }}>
      <h3 style={{ color: '#c53030', fontSize: 16, borderBottom: '1px solid #ddd', paddingBottom: 10 }}>Gestão Master Luciano</h3>
      
      {/* FORMULÁRIO DE EDIÇÃO DE USUÁRIO (RESTAURADO) */}
      {editingUser && (
        <div style={{...styles.userCard, border: '2px solid #3182ce', backgroundColor: '#ebf8ff'}}>
          <h4 style={{marginTop: 0, color: '#2b6cb0'}}>Editando: {editingUser.nome}</h4>
          <input style={styles.inputStyle} value={editingUser.nome} onChange={e => setEditingUser({...editingUser, nome: e.target.value})} placeholder="Nome Completo" />
          <input style={styles.inputStyle} value={editingUser.cidade} onChange={e => setEditingUser({...editingUser, cidade: e.target.value})} placeholder="Cidade e UF" />
          <input style={styles.inputStyle} value={editingUser.whatsapp} onChange={e => setEditingUser({...editingUser, whatsapp: e.target.value})} placeholder="WhatsApp" />
          
          <div style={{display: 'flex', flexDirection: 'column', gap: 10, margin: '15px 0', textAlign: 'left'}}>
            <label style={{display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, fontWeight: 'bold'}}>
              <input type="checkbox" checked={editingUser.isPremium} onChange={e => setEditingUser({...editingUser, isPremium: e.target.checked})} />
              Conta Premium ⭐
            </label>
            <label style={{display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, fontWeight: 'bold'}}>
              <input type="checkbox" checked={editingUser.celularVerificado} onChange={e => setEditingUser({...editingUser, celularVerificado: e.target.checked})} />
              Celular Verificado (SMS) ✅
            </label>
          </div>

          <div style={{display: 'flex', gap: 10}}>
            <button style={{...styles.btnPrimary, flex: 1}} onClick={handleUpdateUser}>Salvar Alterações</button>
            <button style={{...styles.btnOutline, flex: 1}} onClick={() => setEditingUser(null)}>Cancelar</button>
          </div>
        </div>
      )}

      <div style={styles.userCard}>
        <h4 style={{ fontSize: 14 }}>Usuários Cadastrados ({todosUsuarios.length})</h4>
        <div style={{ maxHeight: 300, overflowY: 'auto' }}>
          {todosUsuarios.map(u => (
            <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f0f0f0', alignItems: 'center' }}>
              <div style={{textAlign: 'left'}}>
                <span style={{ fontSize: 12, fontWeight: 'bold', display: 'flex', gap: 5 }}>
                  {u.nome} {u.isPremium && '⭐'} {u.celularVerificado && '✅'}
                </span>
                <span style={{ fontSize: 10, color: '#718096' }}>{u.cidade} | {u.tipo}</span>
              </div>
              <div style={{display: 'flex', gap: 10}}>
                <button onClick={() => handleEditClick(u)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><IconEdit /></button>
                <button onClick={() => excluirUser(u.id)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><IconTrash /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.userCard}>
        <h4 style={{ fontSize: 14, marginBottom: 10 }}>Gerenciar Vagas ({vagas.length})</h4>
        {vagas.map(v => (
          <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
            <span style={{ fontSize: 12 }}>{v.titulo}</span>
            <button onClick={() => excluirVaga(v.id)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><IconTrash /></button>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- PERFIL E VERIFICAÇÃO SMS ---
const PerfilPage = ({ user, userData, todosUsuarios, vagas }) => {
  const [aba, setAba] = useState('dados');
  const [confirmacao, setConfirmacao] = useState(null);
  const [codigoSms, setCodigoSms] = useState('');
  const [loading, setLoading] = useState(false);

  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', { 'size': 'invisible' });
    }
  };

  const enviarSms = async () => {
    if (!userData?.whatsapp) return alert("Número de telefone não encontrado!");
    setLoading(true);
    setupRecaptcha();
    const numero = "+55" + userData.whatsapp.replace(/\D/g, '');
    try {
      const result = await signInWithPhoneNumber(auth, numero, window.recaptchaVerifier);
      setConfirmacao(result);
      alert("Enviamos um código SMS para " + numero);
    } catch (e) { alert("Erro ao enviar SMS. Tente novamente em instantes."); }
    setLoading(false);
  };

  const confirmarCodigo = async () => {
    try {
      await confirmacao.confirm(codigoSms);
      await updateDoc(doc(fs, "usuarios", user.uid), { celularVerificado: true });
      alert("Parabéns! Seu perfil agora é Verificado! ✅");
      setConfirmacao(null);
    } catch (e) { alert("Código incorreto!"); }
  };

  if (!user || user.isAnonymous) return <div style={styles.emptyState}>Inicie sessão para gerenciar seu perfil.</div>;

  return (
    <div>
      <h2 style={styles.pageTitle}>Meu Painel Profissional</h2>
      <div style={styles.tabHeaderContainer}>
         <button onClick={() => setAba('dados')} style={aba === 'dados' ? styles.tabBtnActive : styles.tabBtn}>Meu Perfil</button>
         {user.email === ADMIN_EMAIL && <button onClick={() => setAba('admin')} style={aba === 'admin' ? styles.tabBtnActive : styles.tabBtn}>Master Admin</button>}
      </div>
      
      {aba === 'admin' ? (
        <AdminPanel todosUsuarios={todosUsuarios} vagas={vagas} />
      ) : (
         <div style={styles.userCard}>
            <div style={{textAlign: 'left', marginBottom: 25}}>
              <p><strong>Nome:</strong> {userData?.nome}</p>
              <p><strong>WhatsApp:</strong> {userData?.whatsapp}</p>
              <p><strong>Status de Verificação:</strong> {userData?.celularVerificado ? "✅ Verificado via SMS" : "❌ Não Verificado"}</p>
              <p><strong>Tipo de Conta:</strong> {userData?.isPremium ? "Assinante Premium ⭐" : "Conta Padrão"}</p>
            </div>

            {!userData?.celularVerificado && (
              <div style={{backgroundColor: '#f0fff4', padding: 20, borderRadius: 15, border: '1px solid #25D366', marginBottom: 20}}>
                <h4 style={{margin: '0 0 10px 0', color: '#2f855a'}}>Verificação de Segurança</h4>
                <p style={{fontSize: 12, marginBottom: 15, textAlign: 'left'}}>Clique abaixo para receber um código SMS gratuito. Isso prova para as famílias que você é real e aumenta suas chances de contratação.</p>
                <div id="recaptcha-container"></div>
                {!confirmacao ? (
                  <button style={styles.btnPrimary} onClick={enviarSms} disabled={loading}>{loading ? "Enviando..." : "Receber SMS Agora"}</button>
                ) : (
                  <div>
                    <input style={styles.inputStyle} placeholder="Digite o código de 6 dígitos" value={codigoSms} onChange={e => setCodigoSms(e.target.value)} />
                    <button style={styles.btnWhatsapp} onClick={confirmarCodigo}>Validar Meu Perfil</button>
                  </div>
                )}
              </div>
            )}

            {!userData?.isPremium && userData?.tipo === 'cuidador' && (
               <button style={{...styles.btnPrimary, backgroundColor: '#d69e2e'}} onClick={() => window.open(LINK_PAGAMENTO)}>Ser Cuidador Premium ⭐</button>
            )}
            
            <button style={{...styles.btnOutline, color: '#e53e3e', borderColor: '#feb2b2', marginTop: 40}} onClick={() => signOut(auth)}>Sair da Conta</button>
         </div>
      )}
    </div>
  );
};

// --- CURSOS (YOUTUBE MANTIDO) ---
const CursosPage = () => (
  <div>
    <h2 style={styles.pageTitle}>Capacitação e Saúde</h2>
    <div style={styles.userCard}>
      <h3 style={{fontSize: 16, color: '#007b80', marginBottom: 15, textAlign: 'left'}}>Aula Prática: Primeiros Socorros</h3>
      <div style={{borderRadius: 15, overflow: 'hidden', backgroundColor: '#000', boxShadow: '0 5px 15px rgba(0,0,0,0.2)'}}>
        <iframe 
          width="100%" 
          height="280" 
          src="https://www.youtube.com/embed/1MtKw-uP1NM" 
          title="Aula" 
          frameBorder="0" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
          allowFullScreen>
        </iframe>
      </div>
      <p style={{fontSize: 13, marginTop: 15, textAlign: 'left', color: '#4a5568'}}>Vídeo aula recomendada para todos os cuidadores que buscam excelência no atendimento domiciliar.</p>
    </div>
    <div style={styles.userCardFeatured}>
      <h3 style={{margin: 0, fontSize: 18, color: '#007b80'}}>Treinamento Master Hotmart</h3>
      <p style={{fontSize: 13, margin: '10px 0'}}>Acesse o material didático completo e garanta sua certificação.</p>
      <button style={styles.btnPrimary} onClick={() => window.open("https://go.hotmart.com/M104780028R", "_blank")}>Ver Curso na Hotmart</button>
    </div>
  </div>
);

// --- DICAS DE SAÚDE (MANTIDO) ---
const DicasPage = () => (
  <div>
    <h2 style={styles.pageTitle}>Manual Técnico de Saúde</h2>
    <div style={styles.userCard}>
      <h3 style={{color:'#007b80', fontSize:17, textAlign: 'left'}}>Prevenção de Escaras</h3>
      <p style={styles.longText}>A troca de decúbito (posição) a cada 2 horas é a regra de ouro. Utilize almofadas de gel ou ar para aliviar os pontos de pressão (calcanhares, ombros e quadril).</p>
    </div>
    <div style={styles.userCard}>
      <h3 style={{color:'#007b80', fontSize:17, textAlign: 'left'}}>Hidratação e Nutrição</h3>
      <p style={styles.longText}>Mantenha uma garrafa de água sempre visível. Idosos perdem o reflexo da sede. Ofereça líquidos em pequenas quantidades várias vezes ao dia.</p>
    </div>
    <div style={styles.userCard}>
      <h3 style={{color:'#007b80', fontSize:17, textAlign: 'left'}}>Sinais Vitais</h3>
      <p style={styles.longText}>Monitore a pressão arterial e a temperatura diariamente. Valores acima de 14/9 ou febre persistente devem ser comunicados à família ou médico imediatamente.</p>
    </div>
  </div>
);

// --- LOGIN ---
const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [isCad, setIsCad] = useState(false);
  const [form, setForm] = useState({ nome: '', whatsapp: '', cidade: '', tipo: 'cuidador', especialidades: [] });
  const navigate = useNavigate();

  const handleAuth = async () => {
    if (!email || !senha) return alert("Preencha e-mail e senha!");
    try {
      if (isCad) {
        if (!form.nome || !form.whatsapp) return alert("Preencha seu nome e zap!");
        const res = await createUserWithEmailAndPassword(auth, email, senha);
        await setDoc(doc(fs, "usuarios", res.user.uid), { ...form, uid: res.user.uid, email, celularVerificado: false, isPremium: false });
      } else { await signInWithEmailAndPassword(auth, email, senha); }
      navigate('/');
    } catch (e) { alert("Erro de autenticação. Verifique seus dados."); }
  };

  return (
    <div style={{ padding: 25 }}>
      <h2 style={styles.pageTitle}>{isCad ? "Cadastro Profissional" : "Acesso à Plataforma"}</h2>
      {isCad && (
        <div style={{display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 15}}>
          <input style={styles.inputStyle} placeholder="Nome Completo" onChange={e => setForm({...form, nome: e.target.value})} />
          <input style={styles.inputStyle} placeholder="WhatsApp (DDD+Número)" onChange={e => setForm({...form, whatsapp: e.target.value})} />
          <input style={styles.inputStyle} placeholder="Sua Cidade/UF" onChange={e => setForm({...form, cidade: e.target.value})} />
          <select style={styles.inputStyle} onChange={e => setForm({...form, tipo: e.target.value})}>
            <option value="cuidador">Sou Cuidador Profissional</option>
            <option value="paciente">Sou Família/Paciente</option>
          </select>
        </div>
      )}
      <input style={styles.inputStyle} placeholder="E-mail" onChange={e => setEmail(e.target.value)} />
      <input style={styles.inputStyle} type="password" placeholder="Senha" onChange={e => setSenha(e.target.value)} />
      <button style={styles.btnPrimary} onClick={handleAuth}>{isCad ? "Criar Minha Conta" : "Entrar"}</button>
      <button style={styles.btnOutline} onClick={() => setIsCad(!isCad)}>{isCad ? "Mudar para Login" : "Ainda não tenho cadastro"}</button>
    </div>
  );
};

// --- APP PRINCIPAL ---
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
    onSnapshot(collection(fs, "usuarios"), s => setTodosUsuarios(s.docs.map(d => ({ id: d.id, ...d.data() }))));
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

const styles = {
  headerStyle: { position:'fixed', top:0, left:0, right:0, backgroundColor:'white', padding:'12px 20px', display:'flex', justifyContent:'space-between', alignItems: 'center', borderBottom:'1px solid #e2e8f0', zIndex:1000 },
  footerStyle: { position:'fixed', bottom:0, left:0, right:0, backgroundColor:'#007b80', padding:'14px', display:'flex', justifyContent:'space-around', zIndex:1000 },
  footerLink: { color:'rgba(255,255,255,0.7)', textDecoration:'none', fontSize:'11px', fontWeight:'700', textTransform: 'uppercase' },
  footerLinkActive: { color:'white', textDecoration:'none', fontSize:'11px', fontWeight:'900', borderBottom: '2px solid white', paddingBottom: '2px' },
  bannerPremium: { background: 'linear-gradient(135deg, #007b80 0%, #005a5e 100%)', borderRadius: '25px', padding: '40px 20px', color: 'white', textAlign: 'center', marginBottom: '20px', boxShadow: '0 10px 25px rgba(0, 90, 94, 0.25)' },
  bannerTitle: { margin: 0, fontSize: '22px', fontWeight: '900' },
  bannerSubtitle: { margin: '5px 0 0', fontSize: '13px', opacity: 0.9 },
  valuePropositionRow: { display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '25px' },
  valueCardGreen: { flex: 1, backgroundColor: '#e6f7ff', border: '2px solid #007b80', borderRadius: '20px', padding: '15px', textAlign: 'center' },
  valueCardGold: { flex: 1, backgroundColor: '#fffaf0', border: '2px solid #FFD700', borderRadius: '20px', padding: '15px', textAlign: 'center' },
  valueCardTitle: { margin: '5px 0 0', fontSize: '12px', fontWeight: '900', color: '#333' },
  valueCardText: { margin: 0, fontSize: '10px', color: '#555' },
  tabHeaderContainer: { display: 'flex', backgroundColor: '#e2e8f0', borderRadius: '15px', padding: '5px', marginBottom: '20px' },
  tabBtn: { flex: 1, padding: '12px', border: 'none', background: 'none', color: '#718096', fontWeight: 'bold' },
  tabBtnActive: { flex: 1, padding: '12px', border: 'none', backgroundColor: 'white', color: '#007b80', borderRadius: '11px', fontWeight: '900' },
  searchBox: { padding: '0 0 20px' },
  searchField: { width: '100%', padding: '16px', borderRadius: '14px', border: '1px solid #cbd5e0', marginBottom: '20px', boxSizing: 'border-box', backgroundColor: 'white' },
  userCard: { backgroundColor:'white', padding:'20px', borderRadius:'22px', marginBottom:'15px', border:'1px solid #edf2f7', boxShadow: '0 5px 15px rgba(0,0,0,0.04)', position: 'relative' },
  userCardFeatured: { backgroundColor:'#e6f7ff', padding:'20px', borderRadius:'22px', marginBottom:'15px', border:'2px solid #007b80' },
  tagSkill: { fontSize: '10px', padding: '5px 10px', borderRadius: '15px', backgroundColor: '#eaf4f4', color: '#007b80', fontWeight: '700' },
  btnWhatsapp: { width:'100%', backgroundColor:'#25D366', color:'white', border:'none', padding:'16px', borderRadius:'14px', fontWeight:'900', marginTop:'15px', cursor: 'pointer' },
  premiumLock: { width:'100%', backgroundColor:'#fff6f6', color:'#c82f2f', padding:'15px', borderRadius:'14px', textAlign:'center', border:'1.5px dashed #f5b7b7', marginTop: 15, fontSize: 13, cursor: 'pointer', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 },
  pageTitle: { color:'#007b80', textAlign:'center', marginBottom: '25px', fontWeight: '900', fontSize: '22px' },
  inputStyle: { width:'100%', padding:'15px', backgroundColor: '#f8fafc', borderRadius:'12px', border:'1px solid #e2e8f0', marginBottom: '10px', boxSizing: 'border-box' },
  btnPrimary: { width:'100%', backgroundColor:'#007b80', color:'white', border:'none', padding:'16px', borderRadius:'14px', fontWeight:'900', marginTop:'10px', cursor: 'pointer' },
  btnOutline: { width:'100%', background:'none', border:'1.5px solid #007b80', color:'#007b80', padding:'15px', borderRadius:'14px', marginTop:'10px', fontWeight: '800', cursor: 'pointer' },
  longText: { fontSize: 14, color: '#4a5568', lineHeight: '1.6', textAlign: 'left' },
  loginBtn: { color: '#007b80', fontWeight: '900', fontSize: '15px', textDecoration: 'none', background: 'none', border: 'none', cursor: 'pointer' },
  legalLink: { fontSize: 10, fontWeight: '900', color: '#cbd5e0', textDecoration: 'none', textTransform: 'uppercase' },
  emptyState: { textAlign: 'center', color: '#a0aec0', padding: '40px 20px' }
};

const r = document.getElementById('root');
if (r) { createRoot(r).render(<App />); }
