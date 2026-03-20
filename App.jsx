import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc, onSnapshot, updateDoc, deleteDoc, query, where } from "firebase/firestore";
import { getDatabase, ref, push, set, onValue, remove } from "firebase/database";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";

// --- CONFIGURAÇÃO DO FIREBASE ---
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

const ADMIN_EMAIL = "lucyano.pci@gmail.com";
const CONTACT_EMAIL = "lucyano.mbacomex@yahoo.com.br";

const LISTA_ESPECIALIDADES = [
  "Cuidador de Idosos", "Técnico em Enfermagem", "Pós-Operatório", "Cadeirantes", 
  "Pacientes Acamados", "Troca de Curativos", "Administração de Injeções", 
  "Cuidado com Crianças", "Acompanhamento Hospitalar", "Higiene Pessoal"
];

// --- ÍCONES ---
const IconHeart = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="#007b80"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>;
const IconLock = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c53030" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
const IconTrash = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>;

// --- PÁGINAS DE CONTEÚDO (POLÍTICAS) ---

const SobrePage = () => (
  <div style={styles.contentPage}>
    <h2 style={styles.pageTitle}>Sobre o SOS Cuidadores</h2>
    <div style={styles.userCard}>
      <p style={styles.longText}>O <strong>SOS Cuidadores Brasil</strong> é uma iniciativa dedicada a humanizar e facilitar a contratação de profissionais de saúde domiciliar.</p>
      <p style={styles.longText}>Nossa plataforma conecta diretamente famílias e cuidadores, permitindo negociações transparentes e sem intermediários, focando no que mais importa: o bem-estar de quem recebe o cuidado.</p>
    </div>
  </div>
);

const ContatoPage = () => (
  <div style={styles.contentPage}>
    <h2 style={styles.pageTitle}>Contato e Suporte</h2>
    <div style={styles.userCard}>
      <p style={styles.longText}>Precisa de ajuda com a plataforma ou tem alguma dúvida comercial?</p>
      <div style={{backgroundColor: '#f0fff4', padding: '15px', borderRadius: '12px', margin: '15px 0'}}>
        <p style={{margin: 0, fontWeight: 'bold', color: '#007b80', fontSize: '14px'}}>E-mail Oficial:</p>
        <p style={{margin: '5px 0 0 0', color: '#2d3748', wordBreak: 'break-all'}}>{CONTACT_EMAIL}</p>
      </div>
      <p style={styles.longText}>Nosso tempo médio de resposta é de até 24 horas úteis.</p>
    </div>
  </div>
);

const PoliticaPage = () => (
  <div style={styles.contentPage}>
    <h2 style={styles.pageTitle}>Política de Privacidade</h2>
    <div style={styles.userCard}>
      <p style={styles.longText}>Esta política descreve como coletamos e protegemos seus dados.</p>
      <h3 style={styles.subTitle}>1. Informações Coletadas</h3>
      <p style={styles.longText}>Coletamos apenas dados essenciais para o funcionamento da plataforma: Nome, E-mail, Cidade e Telefone de contato.</p>
      <h3 style={styles.subTitle}>2. Finalidade</h3>
      <p style={styles.longText}>Seus dados são usados para criar seu perfil profissional ou publicar vagas de emprego no mural público.</p>
      <h3 style={styles.subTitle}>3. Proteção</h3>
      <p style={styles.longText}>Utilizamos tecnologia Google Firebase para garantir a segurança e criptografia das informações armazenadas.</p>
    </div>
  </div>
);

// --- COMPONENTE DE ESTRUTURA ---

const Layout = ({ user }) => {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <div style={{ backgroundColor: '#f4f7f6', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <header style={styles.headerStyle}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <IconHeart /><span style={{ fontWeight: '900', color: '#007b80', fontSize: '18px' }}>SOS CUIDADORES</span>
        </Link>
        {user ? <button style={styles.loginBtn} onClick={() => signOut(auth)}>Sair</button> : <Link to="/login" style={styles.loginBtn}>Entrar</Link>}
      </header>

      <main style={{ maxWidth: '550px', margin: '0 auto', padding: '85px 16px 140px' }}>
        <Outlet />
        
        {/* Links de Rodapé Compliance Google Ads */}
        <div style={styles.footerLinksRow}>
          <Link to="/sobre" style={styles.footerSubLink}>Sobre Nós</Link>
          <span style={styles.divider}>|</span>
          <Link to="/politica" style={styles.footerSubLink}>Privacidade</Link>
          <span style={styles.divider}>|</span>
          <Link to="/contato" style={styles.footerSubLink}>Contato</Link>
        </div>
        <p style={{textAlign: 'center', fontSize: '10px', color: '#a0aec0', marginTop: '15px'}}>© 2024 SOS Cuidadores Brasil</p>
      </main>

      <footer style={styles.footerStyle}>
        <Link to="/" style={isActive('/') ? styles.footerLinkActive : styles.footerLink}>Início</Link>
        <Link to="/vagas" style={isActive('/vagas') ? styles.footerLinkActive : styles.footerLink}>Mural</Link>
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

  const filtered = todosUsuarios.filter(u => {
    const termo = busca.toLowerCase();
    const matchCidade = (u.cidade || "").toLowerCase().includes(termo);
    const matchTipo = u.tipo === (abaAtiva === 'cuidadores' ? 'cuidador' : 'paciente');
    return matchCidade && matchTipo;
  });

  return (
    <div>
      <section style={styles.bannerPremium}>
        <h1 style={styles.bannerTitle}>Conexão Direta entre Famílias e Cuidadores.</h1>
        <p style={styles.bannerSubtitle}>Segurança e agilidade no suporte domiciliar em todo o Brasil.</p>
        {!user && <button onClick={() => navigate('/login')} style={styles.bannerBtnWhite}>Começar Grátis</button>}
      </section>

      <div style={styles.tabHeaderContainer}>
        <button onClick={() => setAbaAtiva('cuidadores')} style={abaAtiva === 'cuidadores' ? styles.tabBtnActive : styles.tabBtn}>Achar Cuidador</button>
        <button onClick={() => setAbaAtiva('paciente')} style={abaAtiva === 'paciente' ? styles.tabBtnActive : styles.tabBtn}>Achar Vagas</button>
      </div>

      <div style={styles.searchBox}>
        <input style={styles.searchField} placeholder="📍 Buscar por cidade..." value={busca} onChange={e => setBusca(e.target.value)} />
      </div>

      {filtered.map(u => (
        <div key={u.id} style={styles.userCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{flex: 1}}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>{u.nome}</h3>
              <p style={{ fontSize: '13px', color: '#007b80', fontWeight: 'bold' }}>📍 {u.cidade}</p>
            </div>
          </div>
          <div style={{marginTop: 10}}>
             {u.tipo === 'cuidador' ? (
                <div style={{display: 'flex', flexWrap: 'wrap', gap: 5}}>
                  {Array.isArray(u.especialidades) && u.especialidades.map((e, i) => <span key={i} style={styles.tagSkill}>{e}</span>)}
                </div>
             ) : <p style={styles.longText}><strong>Necessidade:</strong> {u.necessidade}</p>}
          </div>
          <button style={styles.btnWhatsapp} onClick={() => user ? window.open(`https://wa.me/55${u.whatsapp?.replace(/\D/g, '')}`) : navigate('/login')}>
             WhatsApp do {u.tipo === 'cuidador' ? 'Profissional' : 'Contratante'}
          </button>
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
    if (!user) return navigate('/login');
    if (!vaga.titulo || !vaga.desc || !vaga.whatsappContato) return alert("Preencha todos os campos.");
    push(ref(db, 'vagas'), { ...vaga, uid: user.uid, data: new Date().toLocaleDateString() });
    setVaga({ titulo: '', cidade: '', desc: '', whatsappContato: '' });
    alert("Vaga publicada com sucesso!");
  };

  const excluirVaga = (id) => {
    if (window.confirm("Remover vaga?")) remove(ref(db, `vagas/${id}`));
  };

  return (
    <div>
      <h2 style={styles.pageTitle}>Mural de Oportunidades</h2>
      {userData?.tipo === 'paciente' && (
        <div style={styles.userCard}>
          <p style={{fontWeight: 'bold', fontSize: 13, color: '#007b80', marginBottom: 10}}>Divulgue uma vaga grátis:</p>
          <input style={styles.inputStyle} placeholder="Título da Vaga" value={vaga.titulo} onChange={e => setVaga({...vaga, titulo: e.target.value})} />
          <input style={styles.inputStyle} placeholder="Cidade" value={vaga.cidade} onChange={e => setVaga({...vaga, cidade: e.target.value})} />
          <input style={styles.inputStyle} placeholder="WhatsApp com DDD" value={vaga.whatsappContato} onChange={e => setVaga({...vaga, whatsappContato: e.target.value})} />
          <textarea style={{...styles.inputStyle, height: 80}} placeholder="Descrição dos requisitos..." value={vaga.desc} onChange={e => setVaga({...vaga, desc: e.target.value})} />
          <button style={styles.btnPrimary} onClick={publicar}>Postar Agora</button>
        </div>
      )}
      {vagas.map(v => (
        <div key={v.id} style={styles.userCard}>
          <div style={{display: 'flex', justifyContent: 'space-between'}}>
            <h4 style={{margin: 0}}>{v.titulo}</h4>
            {(user?.email === ADMIN_EMAIL || v.uid === user?.uid) && <button onClick={() => excluirVaga(v.id)} style={{border:'none', background:'none', color: '#e53e3e'}}><IconTrash /></button>}
          </div>
          <p style={{color: '#007b80', fontWeight: 'bold', fontSize: 13}}>📍 {v.cidade}</p>
          <p style={styles.longText}>{v.desc}</p>
          <button style={styles.btnWhatsapp} onClick={() => window.open(`https://wa.me/55${v.whatsappContato?.replace(/\D/g, '')}`)}>Candidatar-se</button>
        </div>
      ))}
    </div>
  );
};

// --- LOGIN E PERFIL ---

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [isCad, setIsCad] = useState(false);
  const [form, setForm] = useState({ nome: '', whatsapp: '', cidade: '', tipo: 'cuidador', especialidades: [] });
  const navigate = useNavigate();

  const handleAuth = async () => {
    try {
      if (isCad) {
        const res = await createUserWithEmailAndPassword(auth, email, senha);
        await setDoc(doc(fs, "usuarios", res.user.uid), { ...form, uid: res.user.uid, email });
      } else {
        await signInWithEmailAndPassword(auth, email, senha);
      }
      navigate('/');
    } catch (e) { alert("Erro: " + e.message); }
  };

  return (
    <div style={{ padding: 25 }}>
      <h2 style={styles.pageTitle}>{isCad ? "Novo Cadastro" : "Entrar"}</h2>
      {isCad && (
        <div style={{marginBottom: 20}}>
          <input style={styles.inputStyle} placeholder="Nome Completo *" onChange={e => setForm({...form, nome: e.target.value})} />
          <input style={styles.inputStyle} placeholder="WhatsApp com DDD *" onChange={e => setForm({...form, whatsapp: e.target.value})} />
          <input style={styles.inputStyle} placeholder="Cidade e UF *" onChange={e => setForm({...form, cidade: e.target.value})} />
          <select style={styles.inputStyle} onChange={e => setForm({...form, tipo: e.target.value})}>
            <option value="cuidador">Sou Cuidador</option>
            <option value="paciente">Sou Família</option>
          </select>
        </div>
      )}
      <input style={styles.inputStyle} placeholder="E-mail" onChange={e => setEmail(e.target.value)} />
      <input style={styles.inputStyle} type="password" placeholder="Senha" onChange={e => setSenha(e.target.value)} />
      <button style={styles.btnPrimary} onClick={handleAuth}>{isCad ? "Criar Conta" : "Acessar"}</button>
      <button style={styles.btnOutline} onClick={() => setIsCad(!isCad)}>{isCad ? "Já sou cadastrado" : "Não tenho conta ainda"}</button>
    </div>
  );
};

const PerfilPage = ({ user, userData }) => {
  if (!user) return <div style={styles.emptyState}>Inicie sessão para gerenciar seu perfil.</div>;
  return (
    <div style={styles.userCard}>
      <h2 style={styles.pageTitle}>Meu Painel</h2>
      <p><strong>Nome:</strong> {userData?.nome}</p>
      <p><strong>E-mail:</strong> {user.email}</p>
      <p><strong>Tipo:</strong> {userData?.tipo === 'cuidador' ? 'Profissional' : 'Contratante'}</p>
      <button style={{...styles.btnOutline, color: 'red', borderColor: 'red', marginTop: 30}} onClick={() => signOut(auth)}>Sair da Conta</button>
    </div>
  );
};

// --- APP ---

export default function App() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [todosUsuarios, setTodosUsuarios] = useState([]);
  const [vagas, setVagas] = useState([]);

  useEffect(() => {
    onAuthStateChanged(auth, u => {
      setUser(u);
      if (u) onSnapshot(doc(fs, "usuarios", u.uid), d => setUserData(d.data()));
    });
    onSnapshot(collection(fs, "usuarios"), s => setTodosUsuarios(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    onValue(ref(db, 'vagas'), s => {
      const val = s.val();
      setVagas(val ? Object.keys(val).map(k => ({ id: k, ...val[k] })).reverse() : []);
    });
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout user={user} />}>
          <Route index element={<HomePage todosUsuarios={todosUsuarios} user={user} userData={userData} />} />
          <Route path="vagas" element={<VagasPage vagas={vagas} user={user} userData={userData} />} />
          <Route path="sobre" element={<SobrePage />} />
          <Route path="contato" element={<ContatoPage />} />
          <Route path="politica" element={<PoliticaPage />} />
          <Route path="perfil" element={<PerfilPage user={user} userData={userData} />} />
        </Route>
        <Route path="login" element={<LoginPage />} />
      </Routes>
    </BrowserRouter>
  );
}

// --- DICIONÁRIO DE ESTILOS ---
const styles = {
  headerStyle: { position:'fixed', top:0, left:0, right:0, backgroundColor:'white', padding:'12px 20px', display:'flex', justifyContent:'space-between', alignItems: 'center', borderBottom:'1px solid #eee', zIndex:1000 },
  footerStyle: { position:'fixed', bottom:0, left:0, right:0, backgroundColor:'#007b80', padding:'15px', display:'flex', justifyContent:'space-around', zIndex:1000 },
  footerLink: { color:'rgba(255,255,255,0.7)', textDecoration:'none', fontSize:'12px', fontWeight:'bold' },
  footerLinkActive: { color:'white', textDecoration:'none', fontSize:'12px', fontWeight:'900' },
  bannerPremium: { background: 'linear-gradient(135deg, #007b80 0%, #005a5e 100%)', color: 'white', padding: '30px 20px', borderRadius: '0 0 30px 30px', textAlign: 'center', marginBottom: 20 },
  bannerTitle: { margin: 0, fontSize: '18px', fontWeight: '900' },
  bannerSubtitle: { fontSize: '12px', margin: '10px 0 15px', opacity: 0.9 },
  bannerBtnWhite: { backgroundColor: 'white', color: '#007b80', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: 'bold' },
  tabHeaderContainer: { display: 'flex', backgroundColor: '#e2e8f0', borderRadius: '15px', padding: '5px', margin: '0 16px 15px' },
  tabBtn: { flex: 1, padding: '10px', border: 'none', background: 'none', color: '#718096', fontWeight: 'bold' },
  tabBtnActive: { flex: 1, padding: '10px', border: 'none', backgroundColor: 'white', color: '#007b80', borderRadius: '12px', fontWeight: '900' },
  searchBox: { padding: '0 16px 15px' },
  searchField: { width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #cbd5e0', boxSizing: 'border-box' },
  userCard: { backgroundColor:'white', padding:'20px', borderRadius:'20px', marginBottom:'15px', border:'1px solid #eee' },
  btnWhatsapp: { width:'100%', backgroundColor:'#25D366', color:'white', border:'none', padding:'14px', borderRadius:'12px', fontWeight:'bold', marginTop:'10px' },
  btnPrimary: { width:'100%', backgroundColor:'#007b80', color:'white', border:'none', padding:'14px', borderRadius:'12px', fontWeight:'bold', marginTop:'10px' },
  btnOutline: { width:'100%', background:'none', border:'1.5px solid #007b80', color:'#007b80', padding:'12px', borderRadius:'12px', marginTop:'10px', fontWeight: 'bold' },
  inputStyle: { width:'100%', padding:'14px', marginBottom:'10px', borderRadius:'12px', border:'1px solid #ddd', boxSizing: 'border-box' },
  pageTitle: { color:'#007b80', textAlign:'center', marginBottom: '15px', fontWeight: '900' },
  subTitle: { color:'#2d3748', fontSize: '15px', marginTop: '15px', fontWeight: 'bold' },
  tagSkill: { backgroundColor: '#e6fffa', color: '#007b80', fontSize: '10px', padding: '4px 8px', borderRadius: '8px', fontWeight: 'bold' },
  longText: { fontSize: '13px', color: '#4a5568', lineHeight: '1.5', margin: '8px 0' },
  footerLinksRow: { display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '30px', alignItems: 'center' },
  footerSubLink: { color: '#718096', fontSize: '12px', textDecoration: 'none' },
  divider: { color: '#cbd5e0', fontSize: '12px' },
  emptyState: { textAlign: 'center', color: '#a0aec0', padding: '40px' },
  loginBtn: { color: '#007b80', fontWeight: 'bold', border: 'none', background: 'none' }
};
