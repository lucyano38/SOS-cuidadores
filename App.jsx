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

// Inicialização dos serviços
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const fs = getFirestore(app);
const db = getDatabase(app);
const auth = getAuth(app);

// ACESSO MASTER - Luciano
const ADMIN_EMAIL = "lucyano.pci@gmail.com";

const LISTA_ESPECIALIDADES = [
  "Cuidador de Idosos", "Técnico em Enfermagem", "Pós-Operatório", "Cadeirantes", 
  "Pacientes Acamados", "Troca de Curativos", "Administração de Injeções", 
  "Cuidado com Crianças", "Acompanhamento Hospitalar", "Higiene Pessoal"
];

// --- COMPONENTES VISUAIS (ÍCONES) ---
const IconHeart = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="#007b80"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>;
const IconStar = ({ filled }) => <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? "#FFD700" : "none"} stroke={filled ? "#FFD700" : "#ccc"} strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
const IconLock = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c53030" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
const IconTrash = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>;

const Stars = ({ rating = 0, total = 0 }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
    {[1, 2, 3, 4, 5].map(num => <IconStar key={num} filled={num <= Math.round(rating)} />)}
    <span style={{ fontSize: '10px', color: '#999', marginLeft: '5px' }}>({total})</span>
  </div>
);

// --- ESTRUTURA DE NAVEGAÇÃO ---
const Layout = ({ user }) => {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <div style={{ backgroundColor: '#f4f7f6', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <header style={styles.headerStyle}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <IconHeart /><span style={{ fontWeight: '900', color: '#007b80', fontSize: '20px' }}>SOS CUIDADORES</span>
        </Link>
        {user ? <button style={styles.loginBtn} onClick={() => signOut(auth)}>Sair</button> : <Link to="/login" style={styles.loginBtn}>Entrar</Link>}
      </header>
      <main style={{ maxWidth: '550px', margin: '0 auto', padding: '85px 16px 140px' }}>
        <Outlet />
      </main>
      <footer style={styles.footerStyle}>
        <Link to="/" style={isActive('/') ? styles.footerLinkActive : styles.footerLink}>Início</Link>
        <Link to="/vagas" style={isActive('/vagas') ? styles.footerLinkActive : styles.footerLink}>Vagas</Link>
        <Link to="/cursos" style={isActive('/cursos') ? styles.footerLinkActive : styles.footerLink}>Formação</Link>
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
    if (!user) {
      alert("Registe-se para visualizar contactos e falar no WhatsApp!");
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
          <h1 style={styles.bannerTitle}>Conexão direta entre Cuidadores e Famílias.</h1>
          <p style={styles.bannerSubtitle}>Segurança e agilidade no suporte domiciliário em todo o Brasil.</p>
          {!user && <button onClick={() => navigate('/login')} style={styles.bannerBtnWhite}>Registe-se Agora</button>}
        </div>
      </section>

      <div style={styles.valuePropositionRow}>
        <div style={styles.valueCardGreen}>
          <div style={styles.valueCardIcon}>💎</div>
          <h3 style={styles.valueCardTitle}>PARA FAMÍLIAS</h3>
          <p style={styles.valueCardText}><b>100% Grátis</b> para publicar as suas vagas e necessidades.</p>
        </div>
        <div style={styles.valueCardGold}>
          <div style={styles.valueCardIcon}>⭐</div>
          <h3 style={styles.valueCardTitle}>PARA CUIDADORES</h3>
          <p style={styles.valueCardText}>Acesso <b>Premium 100%</b> disponível para todos os contactos.</p>
        </div>
      </div>

      <div style={styles.tabHeaderContainer}>
        <button onClick={() => setAbaAtiva('cuidadores')} style={abaAtiva === 'cuidadores' ? styles.tabBtnActive : styles.tabBtn}>Encontrar Cuidador</button>
        <button onClick={() => setAbaAtiva('paciente')} style={abaAtiva === 'paciente' ? styles.tabBtnActive : styles.tabBtn}>Encontrar Vagas</button>
      </div>

      <div style={styles.searchBox}>
        <input style={styles.searchField} placeholder={`📍 Filtrar por cidade...`} value={busca} onChange={e => setBusca(e.target.value)} />
      </div>

      {filtered.map(u => (
        <div key={u.id} style={styles.userCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{flex: 1}}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#2d3748' }}>{u.nome}</h3>
              <p style={{ fontSize: '13px', color: '#007b80', fontWeight: 'bold', margin: '4px 0' }}>📍 {u.cidade || "Localização não informada"}</p>
            </div>
            {u.tipo === 'cuidador' && <Stars rating={(u.ratingSum || 0) / (u.totalRatings || 1)} total={u.totalRatings || 0} />}
          </div>
          
          <div style={{marginTop: 12}}>
             {u.tipo === 'cuidador' ? (
                <div style={{display: 'flex', flexWrap: 'wrap', gap: 6}}>
                   {Array.isArray(u.especialidades) && u.especialidades.length > 0 ? u.especialidades.map((e, i) => (
                      <span key={i} style={styles.tagSkill}>{e}</span>
                   )) : <span style={styles.tagSkill}>Cuidador Geral</span>}
                </div>
             ) : (
                <p style={{fontSize: 14, color: '#4a5568', lineHeight: '1.5'}}><strong>Necessidade:</strong> {u.necessidade}</p>
             )}
          </div>

          {(userData?.tipo === 'paciente' || userData?.isPremium || user?.email === ADMIN_EMAIL) ? (
            <button style={styles.btnWhatsapp} onClick={() => handleContact(`https://wa.me/55${u.whatsapp?.replace(/\D/g, '')}`)}>Contactar via WhatsApp</button>
          ) : (
            <div style={styles.premiumLock} onClick={() => !user ? navigate('/login') : window.open("https://mpago.la/1AJppRz")}>
              <IconLock /> Ver Telefone e WhatsApp (R$ 9,90)
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
    if (!user) return navigate('/login');
    if (!vaga.titulo || !vaga.desc || !vaga.whatsappContato) return alert("Por favor, preencha o Título, Descrição e WhatsApp.");
    
    push(ref(db, 'vagas'), { 
        ...vaga, 
        autor: userData?.nome || "Responsável", 
        uid: user.uid, 
        data: new Date().toLocaleDateString() 
    });
    
    setVaga({ titulo: '', cidade: '', desc: '', whatsappContato: '' });
    alert("Vaga publicada com sucesso!");
  };

  const handleExcluirVaga = (id) => {
    if (window.confirm("Pretende remover esta vaga permanentemente?")) {
      remove(ref(db, `vagas/${id}`));
    }
  };

  const handleVerVaga = (num) => {
    if (!user) return navigate('/login');
    if (!userData?.isPremium && userData?.tipo === 'cuidador' && user?.email !== ADMIN_EMAIL) {
      alert("Acesso exclusivo: Apenas cuidadores Premium podem visualizar contactos diretos.");
      window.open("https://mpago.la/1AJppRz", "_blank");
      return;
    }
    window.open(`https://wa.me/55${num?.replace(/\D/g, '')}`, '_blank');
  };

  return (
    <div>
      <h2 style={styles.pageTitle}>Mural de Oportunidades</h2>
      
      {(userData?.tipo === 'paciente' || user?.email === ADMIN_EMAIL) && (
        <div style={styles.userCard}>
          <div style={styles.badgeFreeHeader}>DIVULGAÇÃO GRATUITA</div>
          <h3 style={{fontSize: 16, color: '#007b80', marginTop: 15}}>Publique a sua necessidade</h3>
          <input style={styles.inputStyle} placeholder="Título da Vaga (Ex: Cuidador 24h)" value={vaga.titulo} onChange={e => setVaga({...vaga, titulo: e.target.value})} />
          <input style={styles.inputStyle} placeholder="Cidade" value={vaga.cidade} onChange={e => setVaga({...vaga, cidade: e.target.value})} />
          <input style={styles.inputStyle} placeholder="WhatsApp (DDD + Número)" value={vaga.whatsappContato} onChange={e => setVaga({...vaga, whatsappContato: e.target.value})} />
          <textarea style={{...styles.inputStyle, height: 90}} placeholder="Descreva os requisitos e condições..." value={vaga.desc} onChange={e => setVaga({...vaga, desc: e.target.value})} />
          <button style={styles.btnPrimary} onClick={publicar}>Publicar Vaga Grátis</button>
        </div>
      )}

      {vagas.length > 0 ? vagas.map(v => (
        <div key={v.id} style={styles.userCard}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
            <h4 style={{margin: 0, fontSize: '18px', fontWeight: '800'}}>{v.titulo}</h4>
            {(user?.email === ADMIN_EMAIL || v.uid === user?.uid) && (
               <button onClick={() => handleExcluirVaga(v.id)} style={styles.deleteBtn} title="Remover Vaga">
                 <IconTrash />
               </button>
            )}
          </div>
          <p style={{fontSize: '13px', color: '#007b80', fontWeight: 'bold', margin: '4px 0'}}>📍 {v.cidade}</p>
          <p style={{fontSize: '14px', margin: '10px 0', color: '#4a5568', lineHeight: '1.5'}}>{v.desc}</p>
          <p style={{fontSize: 10, color: '#999', marginBottom: 15}}>Publicado em: {v.data} por {v.autor}</p>

          {(userData?.isPremium || userData?.tipo === 'paciente' || user?.email === ADMIN_EMAIL) ? (
            <button style={styles.btnWhatsapp} onClick={() => handleVerVaga(v.whatsappContato)}>
              Contactar Responsável (WhatsApp)
            </button>
          ) : (
            <div style={styles.premiumLock} onClick={() => handleVerVaga(v.whatsappContato)}>
              <IconLock /> Assine Premium para ver o contacto
            </div>
          )}
        </div>
      )) : <p style={styles.emptyState}>A carregar oportunidades...</p>}
    </div>
  );
};

// --- PAINEL DE GESTÃO MASTER ---
const AdminPanel = ({ todosUsuarios, vagas }) => {
  const excluirUser = async (uid) => {
    if (window.confirm("Confirmar a exclusão definitiva do utilizador?")) {
      await deleteDoc(doc(fs, "usuarios", uid));
      alert("Utilizador removido.");
    }
  };
  const excluirVaga = (id) => {
    if (window.confirm("Pretende remover esta vaga do mural?")) {
      remove(ref(db, `vagas/${id}`));
    }
  };

  return (
    <div style={{animation: 'fadeIn 0.5s'}}>
      <h3 style={{color: 'red', marginBottom: 15, borderBottom: '1px solid #fee2e2', paddingBottom: 10}}>Painel Admin Master</h3>
      <div style={styles.userCard}>
        <h4>Utilizadores ({todosUsuarios.length})</h4>
        <div style={{maxHeight: 250, overflowY: 'auto'}}>
          {todosUsuarios.map(u => (
            <div key={u.id} style={{display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f0f0f0'}}>
              <div style={{fontSize: 12}}><strong>{u.nome}</strong><br/>{u.email}</div>
              <button onClick={() => excluirUser(u.id)} style={{border: 'none', background: 'none', color: '#e53e3e'}}><IconTrash /></button>
            </div>
          ))}
        </div>
      </div>
      <div style={styles.userCard}>
        <h4>Vagas no Mural ({vagas.length})</h4>
        <div style={{maxHeight: 250, overflowY: 'auto'}}>
          {vagas.map(v => (
            <div key={v.id} style={{display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f0f0f0'}}>
              <span style={{fontSize: 12}}>{v.titulo}</span>
              <button onClick={() => excluirVaga(v.id)} style={{border: 'none', background: 'none', color: '#e53e3e'}}><IconTrash /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- LOGIN E PERFIL ---
const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [isCad, setIsCad] = useState(false);
  const [form, setForm] = useState({ nome: '', whatsapp: '', cidade: '', tipo: 'cuidador', especialidades: [], necessidade: '' });
  const navigate = useNavigate();

  const toggleEsp = (esp) => {
    const list = [...form.especialidades];
    if (list.includes(esp)) setForm({...form, especialidades: list.filter(e => e !== esp)});
    else setForm({...form, especialidades: [...list, esp]});
  };

  const handleAuth = async () => {
    try {
      if (isCad) {
        if (!form.nome || !form.cidade || !form.whatsapp) return alert("Por favor, preencha os campos obrigatórios (*)");
        const res = await createUserWithEmailAndPassword(auth, email, senha);
        await setDoc(doc(fs, "usuarios", res.user.uid), { ...form, uid: res.user.uid, email, isPremium: false, ratingSum: 0, totalRatings: 0 });
      } else {
        await signInWithEmailAndPassword(auth, email, senha);
      }
      navigate('/');
    } catch (e) { alert("Erro de autenticação: " + e.message); }
  };

  return (
    <div style={{ padding: 25 }}>
      <h2 style={styles.pageTitle}>{isCad ? "Novo Registo" : "Acesso ao SOS"}</h2>
      {isCad && (
        <div style={{display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20}}>
          <input style={styles.inputStyle} placeholder="Nome Completo *" onChange={e => setForm({...form, nome: e.target.value})} />
          <input style={styles.inputStyle} placeholder="Cidade e Estado *" onChange={e => setForm({...form, cidade: e.target.value})} />
          <input style={styles.inputStyle} placeholder="WhatsApp (com DDD) *" onChange={e => setForm({...form, whatsapp: e.target.value})} />
          <select style={styles.inputStyle} onChange={e => setForm({...form, tipo: e.target.value})}>
            <option value="cuidador">Sou Cuidador / Profissional</option>
            <option value="paciente">Sou Família / Contratante</option>
          </select>
          {form.tipo === 'cuidador' ? (
            <div>
               <p style={{fontSize: 13, fontWeight: 'bold', color: '#007b80', marginBottom: 10}}>Selecione as suas Especialidades:</p>
               <div style={{display: 'flex', flexWrap: 'wrap', gap: 8}}>
                  {LISTA_ESPECIALIDADES.map(e => (
                    <button key={e} onClick={() => toggleEsp(e)} style={form.especialidades.includes(e) ? styles.tagActive : styles.tagSimple}>{e}</button>
                  ))}
               </div>
            </div>
          ) : (
            <textarea style={{...styles.inputStyle, height: 90}} placeholder="Descreva aqui o que a sua família necessita detalhadamente... *" onChange={e => setForm({...form, necessidade: e.target.value})} />
          )}
        </div>
      )}
      <input style={styles.inputStyle} placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} />
      <input style={styles.inputStyle} type="password" placeholder="Palavra-passe" value={senha} onChange={e => setSenha(e.target.value)} />
      <button style={styles.btnPrimary} onClick={handleAuth}>{isCad ? "Criar Conta Grátis" : "Entrar"}</button>
      <button style={styles.btnOutline} onClick={() => setIsCad(!isCad)}>{isCad ? "Já tenho login" : "Ainda não tenho conta"}</button>
    </div>
  );
};

const PerfilPage = ({ user, todosUsuarios, vagas }) => {
  const [data, setData] = useState(null);
  const [aba, setAba] = useState('dados');
  useEffect(() => { if (user) onSnapshot(doc(fs, "usuarios", user.uid), d => setData(d.data())); }, [user]);

  if (!user) return <div style={styles.emptyState}>Inicie sessão para gerir o seu perfil.</div>;

  return (
    <div>
      <h2 style={styles.pageTitle}>O Meu Painel</h2>
      <div style={styles.tabHeaderContainer}>
         <button onClick={() => setAba('dados')} style={aba === 'dados' ? styles.tabBtnActive : styles.tabBtn}>Perfil</button>
         {user.email === ADMIN_EMAIL && <button onClick={() => setAba('admin')} style={aba === 'admin' ? styles.tabBtnActive : styles.tabBtn}>Admin</button>}
      </div>
      {aba === 'admin' ? <AdminPanel todosUsuarios={todosUsuarios} vagas={vagas} /> : (
         <div style={styles.userCard}>
            <p><strong>Nome:</strong> {data?.nome}</p>
            <p><strong>Tipo de Conta:</strong> {data?.tipo === 'cuidador' ? 'Profissional' : 'Contratante'}</p>
            <p><strong>Status:</strong> {data?.isPremium ? 'Membro Premium ⭐' : 'Conta Padrão'}</p>
            <button style={{...styles.btnOutline, color: 'red', borderColor: 'red', marginTop: 30}} onClick={() => signOut(auth)}>Terminar Sessão</button>
         </div>
      )}
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
      else setUserData(null);
    });
    onSnapshot(collection(fs, "usuarios"), s => setTodosUsuarios(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    onValue(ref(db, 'vagas'), s => {
      const val = s.val();
      setVagas(val ? Object.keys(val
