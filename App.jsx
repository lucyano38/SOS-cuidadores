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
  set, 
  onValue, 
  remove 
} from "firebase/database";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut, 
  signInAnonymously 
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

// --- PÁGINAS GOOGLE ADS ---
const SobrePage = () => (
  <div style={styles.userCard}>
    <h2 style={styles.pageTitle}>Sobre o SOS Cuidadores</h2>
    <p style={styles.longText}>O SOS Cuidadores Brasil é uma plataforma de utilidade pública projetada para conectar famílias e profissionais da saúde domiciliar sem intermediários.</p>
    <p style={styles.longText}>Nossa tecnologia facilita a busca por cuidadores qualificados, promovendo segurança para quem contrata e valorização para quem trabalha.</p>
  </div>
);

const PrivacidadePage = () => (
  <div style={styles.userCard}>
    <h2 style={styles.pageTitle}>Política de Privacidade</h2>
    <p style={styles.longText}>Em conformidade com a LGPD (Lei Geral de Proteção de Dados), informamos que seus dados (Nome, Cidade e WhatsApp) são utilizados exclusivamente para a finalidade de contato profissional dentro da plataforma.</p>
    <p style={styles.longText}>Seus dados são protegidos por criptografia via Google Firebase e você pode solicitar a exclusão de sua conta a qualquer momento em seu perfil.</p>
  </div>
);

const TermosPage = () => (
  <div style={styles.userCard}>
    <h2 style={styles.pageTitle}>Termos de Uso</h2>
    <p style={styles.longText}>Ao utilizar a plataforma, o usuário declara que as informações prestadas são verdadeiras. O SOS Cuidadores atua apenas como facilitador de contato, não tendo responsabilidade sobre as negociações financeiras ou técnicas entre as partes.</p>
  </div>
);

const ContatoPage = () => (
  <div style={styles.userCard}>
    <h2 style={styles.pageTitle}>Contato e Suporte</h2>
    <p style={styles.longText}>Dúvidas, suporte técnico ou questões comerciais podem ser enviadas diretamente para o nosso e-mail oficial:</p>
    <div style={{textAlign: 'center', marginTop: 15}}>
      <span style={{backgroundColor: '#eaf4f4', padding: '12px 20px', borderRadius: 12, fontWeight: '900', color: '#007b80'}}>{ADMIN_EMAIL}</span>
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
        {user && !user.isAnonymous ? <button style={styles.loginBtn} onClick={() => signOut(auth)}>Sair</button> : <Link to="/login" style={styles.loginBtn}>Entrar</Link>}
      </header>
      <main style={{ maxWidth: '550px', margin: '0 auto', padding: '85px 16px 140px' }}>
        <Outlet />
        
        {/* Links de Rodapé */}
        <div style={{ marginTop: 50, borderTop: '1px solid #e2e8f0', paddingTop: 25, display: 'flex', justifyContent: 'center', gap: 20 }}>
          <Link to="/sobre" style={styles.legalLink}>Sobre</Link>
          <Link to="/privacidade" style={styles.legalLink}>Privacidade</Link>
          <Link to="/termos" style={styles.legalLink}>Termos</Link>
          <Link to="/contato" style={styles.legalLink}>Contato</Link>
        </div>
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

  const handleContact = (link) => {
    if (!user || user.isAnonymous) {
      alert("Para ver contatos, você precisa estar logado!");
      navigate('/login');
      return;
    }
    window.open(link, '_blank');
  };

  const filtered = todosUsuarios.filter(u => {
    const termo = busca.toLowerCase();
    const matchCidade = (u.cidade || "").toLowerCase().includes(termo);
    const matchTipo = u.tipo === (abaAtiva === 'cuidadores' ? 'cuidador' : 'paciente');
    return matchCidade && matchTipo;
  });

  return (
    <div>
      <section style={styles.bannerPremium}>
        <div style={styles.bannerContent}>
          <h1 style={styles.bannerTitle}>Conexão direta entre Cuidadores e Pacientes.</h1>
          <p style={styles.bannerSubtitle}>Segurança e agilidade no suporte domiciliar em todo o Brasil.</p>
          {(!user || user.isAnonymous) && <button onClick={() => navigate('/login')} style={styles.bannerBtnWhite}>Cadastre aqui agora</button>}
        </div>
      </section>

      <div style={styles.valuePropositionRow}>
        <div style={styles.valueCardGreen}>
          <div style={styles.valueCardIcon}>💎</div>
          <h3 style={styles.valueCardTitle}>PARA FAMÍLIAS</h3>
          <p style={styles.valueCardText}><b>100% Grátis</b> para divulgar suas vagas e necessidades.</p>
        </div>
        <div style={styles.valueCardGold}>
          <div style={styles.valueCardIcon}>⭐</div>
          <h3 style={styles.valueCardTitle}>PARA CUIDADORES</h3>
          <p style={styles.valueCardText}>Acesso <b>Premium 100%</b> liberado a todos os contatos.</p>
        </div>
      </div>

      <div style={styles.tabHeaderContainer}>
        <button onClick={() => setAbaAtiva('cuidadores')} style={abaAtiva === 'cuidadores' ? styles.tabBtnActive : styles.tabBtn}>Achar Cuidador</button>
        <button onClick={() => setAbaAtiva('paciente')} style={abaAtiva === 'paciente' ? styles.tabBtnActive : styles.tabBtn}>Achar Vagas</button>
      </div>

      <div style={styles.searchBox}>
        <input style={styles.searchField} placeholder={`📍 Buscar por cidade...`} value={busca} onChange={e => setBusca(e.target.value)} />
      </div>

      {filtered.map(u => (
        <div key={u.id} style={styles.userCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{flex: 1, textAlign: 'left'}}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#2d3748' }}>{u.nome}</h3>
              <p style={{ fontSize: '13px', color: '#007b80', fontWeight: 'bold', margin: '4px 0' }}>📍 {u.cidade || "Localização não informada"}</p>
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
             ) : (
                <p style={{fontSize: 14, color: '#4a5568', lineHeight: '1.5'}}><strong>Necessidade:</strong> {u.necessidade}</p>
             )}
          </div>

          {(userData?.tipo === 'paciente' || userData?.isPremium || user?.email === ADMIN_EMAIL) ? (
            <button style={styles.btnWhatsapp} onClick={() => handleContact(`https://wa.me/55${u.whatsapp?.replace(/\D/g, '')}`)}>Chamar no WhatsApp</button>
          ) : (
            <div style={styles.premiumLock} onClick={() => (!user || user.isAnonymous) ? navigate('/login') : window.open(LINK_PAGAMENTO)}>
              <IconLock /> Ver WhatsApp e Perfil (R$ 9,90)
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// --- MURAL DE VAGAS ---
const VagasPage = ({ vagas = [], user, userData }) => {
  const [vaga, setVaga] = useState({ titulo: '', cidade: '', desc: '', whatsappContato: '' });
  const navigate = useNavigate();

  const publicar = () => {
    if (!user || user.isAnonymous) return navigate('/login');
    if (!vaga.titulo || !vaga.desc || !vaga.whatsappContato) return alert("Por favor, preencha todos os campos.");
    push(ref(db, 'vagas'), { ...vaga, uid: user.uid, data: new Date().toLocaleDateString() });
    setVaga({ titulo: '', cidade: '', desc: '', whatsappContato: '' });
    alert("Vaga publicada!");
  };

  const handleExcluirVaga = (id) => {
    if (window.confirm("Remover esta vaga?")) remove(ref(db, `vagas/${id}`));
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
      {(userData?.tipo === 'paciente' || user?.email === ADMIN_EMAIL) && (
        <div style={styles.userCard}>
          <div style={styles.badgeFreeHeader}>DIVULGAÇÃO 100% GRÁTIS</div>
          <input style={styles.inputStyle} placeholder="Título da Vaga" value={vaga.titulo} onChange={e => setVaga({...vaga, titulo: e.target.value})} />
          <input style={styles.inputStyle} placeholder="Cidade" value={vaga.cidade} onChange={e => setVaga({...vaga, cidade: e.target.value})} />
          <input style={styles.inputStyle} placeholder="WhatsApp" value={vaga.whatsappContato} onChange={e => setVaga({...vaga, whatsappContato: e.target.value})} />
          <textarea style={{...styles.inputStyle, height: 90}} placeholder="Descreva os requisitos..." value={vaga.desc} onChange={e => setVaga({...vaga, desc: e.target.value})} />
          <button style={styles.btnPrimary} onClick={publicar}>Postar Vaga Grátis</button>
        </div>
      )}
      {vagas.map(v => (
        <div key={v.id} style={styles.userCard}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
            <h4 style={{margin: 0, textAlign: 'left'}}>{v.titulo}</h4>
            {(user?.email === ADMIN_EMAIL || v.uid === user?.uid) && (
              <button onClick={() => handleExcluirVaga(v.id)} style={{border:'none',background:'none',cursor:'pointer'}}><IconTrash /></button>
            )}
          </div>
          <p style={{fontSize: '13px', color: '#007b80', fontWeight: 'bold', textAlign: 'left'}}>📍 {v.cidade}</p>
          <p style={{fontSize: '14px', margin: '10px 0', color: '#4a5568', textAlign: 'left'}}>{v.desc}</p>
          
          {(userData?.isPremium || userData?.tipo === 'paciente' || user?.email === ADMIN_EMAIL) ? (
             <button style={styles.btnWhatsapp} onClick={() => handleVerVaga(v.whatsappContato)}>Candidatar-se</button>
          ) : (
             <div style={styles.premiumLock} onClick={() => handleVerVaga(v.whatsappContato)}>
               <IconLock /> Ver Contato da Vaga (R$ 9,90)
             </div>
          )}
        </div>
      ))}
    </div>
  );
};

// --- CURSOS (RESTAURADO COM VÍDEO DO YOUTUBE) ---
const CursosPage = () => (
  <div>
    <h2 style={styles.pageTitle}>Capacitação e Saúde</h2>
    <div style={styles.userCardFeatured}>
      <h3 style={{margin: 0, fontSize: 18, color: '#007b80'}}>Formação Cuidador de Idosos Completa</h3>
      <p style={{fontSize: 14, color: '#4a5568', margin: '12px 0'}}>Obtenha certificação profissional e destaque-se no mercado de trabalho.</p>
      <button style={styles.btnPrimary} onClick={() => window.open("https://go.hotmart.com/M104780028R", "_blank")}>Matricular-se via Hotmart</button>
    </div>
    
    {/* VÍDEO DO YOUTUBE RESTAURADO */}
    <div style={styles.userCard}>
      <h3 style={{fontSize: 16, color: '#007b80', marginBottom: 12}}>Aula Prática: Primeiros Socorros</h3>
      <div style={{borderRadius: 15, overflow: 'hidden', backgroundColor: '#000'}}>
        <iframe 
          width="100%" 
          height="250" 
          src="https://www.youtube.com/embed/1MtKw-uP1NM" 
          title="Aula Prática Primeiros Socorros"
          frameBorder="0" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
          allowFullScreen>
        </iframe>
      </div>
    </div>
  </div>
);

// --- SAÚDE (RESTAURADO COM AS DICAS ORIGINAIS) ---
const DicasPage = () => (
  <div>
    <h2 style={styles.pageTitle}>Manual da Saúde</h2>
    
    {/* DICAS ORIGINAIS RESTAURADAS */}
    <div style={styles.userCard}>
      <h3 style={{color:'#007b80', fontSize:17, textAlign: 'left'}}>Troca de Decúbito</h3>
      <p style={styles.longText}>Troque a posição do paciente a cada 2 horas para prevenir feridas (escaras) e melhorar a circulação sanguínea.</p>
    </div>
    
    <div style={styles.userCard}>
      <h3 style={{color:'#007b80', fontSize:17, textAlign: 'left'}}>Frequência Cardíaca</h3>
      <p style={styles.longText}>Monitore os sinais vitais diariamente. O valor normal para um adulto em repouso varia entre 60 e 100 batimentos por minuto.</p>
    </div>
  </div>
);

// --- PAINEL MASTER ADMIN ---
const AdminPanel = ({ todosUsuarios, vagas }) => {
  const [editingUser, setEditingUser] = useState(null);

  const excluirUser = async (uid) => {
    if (window.confirm("Confirmar exclusão definitiva do usuário?")) {
      await deleteDoc(doc(fs, "usuarios", uid));
    }
  };

  const handleEditClick = (u) => setEditingUser({...u});

  const handleUpdateUser = async () => {
    if (!editingUser.nome || !editingUser.cidade) return alert("Preencha os campos!");
    try {
      const userRef = doc(fs, "usuarios", editingUser.id);
      await updateDoc(userRef, {
        nome: editingUser.nome,
        cidade: editingUser.cidade,
        whatsapp: editingUser.whatsapp,
        isPremium: editingUser.isPremium || false
      });
      alert("Usuário atualizado!");
      setEditingUser(null);
    } catch (e) { alert("Erro ao atualizar."); }
  };
  
  const excluirVaga = (id) => {
    if (window.confirm("Remover esta vaga?")) remove(ref(db, `vagas/${id}`));
  };

  return (
    <div style={{ marginTop: 20 }}>
      <h3 style={{ color: '#c53030', marginBottom: 15, fontSize: 16 }}>Controle Master Admin</h3>
      
      {editingUser && (
        <div style={{...styles.userCard, border: '2px solid #3182ce', backgroundColor: '#ebf8ff'}}>
          <h4 style={{marginTop: 0, color: '#2b6cb0'}}>Editando: {editingUser.nome}</h4>
          <input style={styles.inputStyle} value={editingUser.nome} onChange={e => setEditingUser({...editingUser, nome: e.target.value})} placeholder="Nome" />
          <input style={styles.inputStyle} value={editingUser.cidade} onChange={e => setEditingUser({...editingUser, cidade: e.target.value})} placeholder="Cidade" />
          <input style={styles.inputStyle} value={editingUser.whatsapp} onChange={e => setEditingUser({...editingUser, whatsapp: e.target.value})} placeholder="WhatsApp" />
          <div style={{display: 'flex', alignItems: 'center', gap: 10, margin: '10px 0'}}>
            <input type="checkbox" checked={editingUser.isPremium} onChange={e => setEditingUser({...editingUser, isPremium: e.target.checked})} />
            <label style={{fontSize: 13, fontWeight: 'bold'}}>Status Premium ⭐</label>
          </div>
          <div style={{display: 'flex', gap: 10}}>
            <button style={{...styles.btnPrimary, flex: 1}} onClick={handleUpdateUser}>Salvar</button>
            <button style={{...styles.btnOutline, flex: 1}} onClick={() => setEditingUser(null)}>Cancelar</button>
          </div>
        </div>
      )}

      <div style={styles.userCard}>
        <h4 style={{ fontSize: 14, marginBottom: 10 }}>Gerenciar Usuários ({todosUsuarios.length})</h4>
        <div style={{ maxHeight: 300, overflowY: 'auto' }}>
          {todosUsuarios.map(u => (
            <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
              <div style={{textAlign: 'left'}}>
                <span style={{ fontSize: 12, fontWeight: 'bold', display: 'block' }}>{u.nome} {u.isPremium && '⭐'}</span>
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

// --- PERFIL ---
const PerfilPage = ({ user, userData, todosUsuarios, vagas }) => {
  const [aba, setAba] = useState('dados');
  if (!user || user.isAnonymous) return <div style={styles.emptyState}>Inicie sessão para ver o seu painel.</div>;

  return (
    <div>
      <h2 style={styles.pageTitle}>Meu Painel</h2>
      <div style={styles.tabHeaderContainer}>
         <button onClick={() => setAba('dados')} style={aba === 'dados' ? styles.tabBtnActive : styles.tabBtn}>Perfil</button>
         {user.email === ADMIN_EMAIL && <button onClick={() => setAba('admin')} style={aba === 'admin' ? styles.tabBtnActive : styles.tabBtn}>Admin</button>}
      </div>
      
      {aba === 'admin' ? (
        <AdminPanel todosUsuarios={todosUsuarios} vagas={vagas} />
      ) : (
         <div style={styles.userCard}>
            <p style={{textAlign: 'left'}}><strong>Nome:</strong> {userData?.nome}</p>
            <p style={{textAlign: 'left'}}><strong>E-mail:</strong> {user.email}</p>
            <p style={{textAlign: 'left'}}><strong>Status:</strong> {userData?.isPremium ? 'Premium ⭐' : 'Padrão (Contatos Bloqueados)'}</p>
            {!userData?.isPremium && userData?.tipo === 'cuidador' && (
               <button style={styles.btnPrimary} onClick={() => window.open(LINK_PAGAMENTO)}>Assinar Premium agora</button>
            )}
            <button style={{...styles.btnOutline, color: 'red', borderColor: 'red', marginTop: 30}} onClick={() => signOut(auth)}>Sair da Conta</button>
         </div>
      )}
    </div>
  );
};

// --- LOGIN ---
const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [isCad, setIsCad] = useState(false);
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [form, setForm] = useState({ nome: '', whatsapp: '', cidade: '', tipo: 'cuidador', especialidades: [], necessidade: '' });
  const navigate = useNavigate();

  const handleAuth = async () => {
    try {
      if (isCad) {
        if (!form.nome || !form.cidade || !form.whatsapp) return alert("Preencha todos os campos!");
        if (!aceitouTermos) return alert("Aceite os termos LGPD!");
        const res = await createUserWithEmailAndPassword(auth, email, senha);
        await setDoc(doc(fs, "usuarios", res.user.uid), { ...form, uid: res.user.uid, email, isPremium: false });
      } else {
        await signInWithEmailAndPassword(auth, email, senha);
      }
      navigate('/');
    } catch (e) { alert("Dados incorretos."); }
  };

  return (
    <div style={{ padding: 25 }}>
      <h2 style={styles.pageTitle}>{isCad ? "Cadastro" : "Acesso"}</h2>
      {isCad && (
        <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
          <input style={styles.inputStyle} placeholder="Nome Completo *" onChange={e => setForm({...form, nome: e.target.value})} />
          <input style={styles.inputStyle} placeholder="Cidade e Estado *" onChange={e => setForm({...form, cidade: e.target.value})} />
          <input style={styles.inputStyle} placeholder="WhatsApp *" onChange={e => setForm({...form, whatsapp: e.target.value})} />
          <select style={styles.inputStyle} onChange={e => setForm({...form, tipo: e.target.value})}>
            <option value="cuidador">Sou Cuidador Profissional</option>
            <option value="paciente">Sou Família/Paciente</option>
          </select>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px', textAlign: 'left' }}>
            <input type="checkbox" checked={aceitouTermos} onChange={e => setAceitouTermos(e.target.checked)} />
            <label style={{ fontSize: '11px', color: '#4a5568' }}>
              Li e concordo com os <Link to="/termos" target="_blank" style={{color: '#007b80'}}>Termos</Link> e <Link to="/privacidade" target="_blank" style={{color: '#007b80'}}>Privacidade (LGPD)</Link>.
            </label>
          </div>
        </div>
      )}
      <input style={styles.inputStyle} placeholder="E-mail" onChange={e => setEmail(e.target.value)} />
      <input style={styles.inputStyle} type="password" placeholder="Senha" onChange={e => setSenha(e.target.value)} />
      <button style={styles.btnPrimary} onClick={handleAuth}>{isCad ? "Criar Conta Grátis" : "Entrar"}</button>
      <button style={styles.btnOutline} onClick={() => setIsCad(!isCad)}>{isCad ? "Já tenho login" : "Ainda não tenho conta"}</button>
    </div>
  );
};

// --- APP ---
export function App() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [todosUsuarios, setTodosUsuarios] = useState([]);
  const [vagas, setVagas] = useState([]);

  useEffect(() => {
    const init = async () => { if (!auth.currentUser) await signInAnonymously(auth); };
    init();
    onAuthStateChanged(auth, u => {
      setUser(u);
      if (u && !u.isAnonymous) onSnapshot(doc(fs, "usuarios", u.uid), d => setUserData(d.data()));
      else setUserData(null);
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
          <Route path="dicas" element={<DicasPage />} /> {/* ROTA DE SAÚDE AJUSTADA */}
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
  bannerPremium: { background: 'linear-gradient(135deg, #007b80 0%, #005a5e 100%)', borderRadius: '25px', padding: '50px 25px', color: 'white', textAlign: 'center', marginBottom: '25px', boxShadow: '0 10px 25px rgba(0, 90, 94, 0.25)'},
  bannerTitle: { margin: '0 0 10px 0', fontSize: '24px', fontWeight: '900', lineHeight: '1.3' },
  bannerSubtitle: { margin: 0, fontSize: '14px', opacity: 0.9 },
  bannerBtnWhite: { backgroundColor: 'white', color: '#007b80', border: 'none', padding: '14px 30px', borderRadius: '12px', fontWeight: '900', cursor: 'pointer', fontSize: '15px', marginTop: '25px' },
  valuePropositionRow: { display: 'flex', justifyContent: 'space-between', gap: '15px', marginBottom: '25px' },
  valueCardGreen: { flex: 1, backgroundColor: '#e6f7ff', border: '2px solid #007b80', borderRadius: '20px', padding: '20px', textAlign: 'center' },
  valueCardGold: { flex: 1, backgroundColor: '#fffaf0', border: '2px solid #FFD700', borderRadius: '20px', padding: '20px', textAlign: 'center' },
  valueCardTitle: { margin: '0 0 5px 0', fontSize: '14px', fontWeight: '900', color: '#333' },
  valueCardText: { margin: 0, fontSize: '11px', color: '#555' },
  tabHeaderContainer: { display: 'flex', backgroundColor: '#e2e8f0', borderRadius: '15px', padding: '5px', margin: '0 auto 20px', maxWidth: '95%' },
  tabBtn: { flex: 1, padding: '12px', border: 'none', background: 'none', color: '#718096', fontWeight: 'bold' },
  tabBtnActive: { flex: 1, padding: '12px', border: 'none', backgroundColor: 'white', color: '#007b80', borderRadius: '11px', fontWeight: '900' },
  searchBox: { padding: '0 0 20px' },
  searchField: { width: '100%', padding: '16px', borderRadius: '14px', border: '1px solid #cbd5e0', boxSizing: 'border-box' },
  userCard: { backgroundColor:'white', padding:'20px', borderRadius:'22px', marginBottom:'15px', border:'1px solid #edf2f7', boxShadow: '0 5px 15px rgba(0,0,0,0.05)', position: 'relative' },
  userCardFeatured: { backgroundColor:'#e6f7ff', padding:'20px', borderRadius:'22px', marginBottom:'15px', border:'2px solid #007b80' },
  tagSkill: { fontSize: '10px', padding: '5px 10px', borderRadius: '15px', backgroundColor: '#eaf4f4', color: '#007b80', fontWeight: '700' },
  btnWhatsapp: { width:'100%', backgroundColor:'#25D366', color:'white', border:'none', padding:'16px', borderRadius:'14px', fontWeight:'900', marginTop:'15px', cursor: 'pointer' },
  premiumLock: { width:'100%', backgroundColor:'#fff6f6', color:'#c82f2f', padding:'15px', borderRadius:'14px', textAlign:'center', border:'1.5px dashed #f5b7b7', marginTop: 15, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontWeight: '800', cursor: 'pointer' },
  pageTitle: { color:'#007b80', textAlign:'center', marginBottom: '25px', fontWeight: '900', fontSize: '22px' },
  inputStyle: { width:'100%', padding:'15px', backgroundColor: '#f8fafc', borderRadius:'12px', border:'1px solid #e2e8f0', marginBottom: '10px' },
  btnPrimary: { width:'100%', backgroundColor:'#007b80', color:'white', border:'none', padding:'16px', borderRadius:'14px', fontWeight:'900', marginTop:'10px', cursor: 'pointer' },
  btnOutline: { width:'100%', background:'none', border:'1.5px solid #007b80', color:'#007b80', padding:'15px', borderRadius:'14px', marginTop:'10px', fontWeight: '800', cursor: 'pointer' },
  longText: { fontSize: 14, color: '#4a5568', lineHeight: '1.6', textAlign: 'left' },
  loginBtn: { color: '#007b80', border: 'none', background: 'none', fontWeight: '900', cursor: 'pointer', fontSize: '15px' },
  legalLink: { fontSize: 10, fontWeight: '900', color: '#cbd5e0', textDecoration: 'none', textTransform: 'uppercase' },
  emptyState: { textAlign: 'center', color: '#a0aec0', padding: '40px 20px' }
};

// --- MONTAGEM ---
const r = document.getElementById('root');
if (r) { createRoot(r).render(<App />); }
