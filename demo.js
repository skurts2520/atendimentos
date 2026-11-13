// Modo demonstração: simula o Supabase no próprio navegador (localStorage).
// Login de teste: demo@demo.com / demo123
// Para usar o Supabase de verdade, coloque DEMO_MODE = false no config.js.
function createDemoClient() {
  const KEY = 'demo_db_v1';
  const SESSION = 'demo_session_v1';
  const listeners = [];

  const dia = (offset) => {
    const t = new Date();
    t.setDate(t.getDate() - offset);
    return t.toISOString().slice(0, 10);
  };
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2));

  function seed() {
    const e1 = uid(), e2 = uid(), e3 = uid();
    const emp = (id, nome, contato, telefone, email, endereco) =>
      ({ id, nome, contato, telefone, email, endereco, created_at: new Date().toISOString() });
    const at = (empresa_id, cliente_nome, tipo, status, off, descricao, solucao) =>
      ({ id: uid(), empresa_id, cliente_nome, tipo, status, data_atendimento: dia(off), descricao, solucao, created_at: new Date().toISOString() });
    const data = {
      empresas: [
        emp(e1, 'Tech Solutions Ltda', 'Marcos', '(47) 99999-1111', 'ti@techsolutions.com', 'Rua das Flores, 100'),
        emp(e2, 'Clínica Vida', 'Ana', '(47) 99999-2222', 'ana@clinicavida.com', 'Av. Central, 250'),
        emp(e3, 'Contábil Santos', 'Roberto', '(47) 99999-3333', 'roberto@contabilsantos.com', 'Rua do Comércio, 45')
      ],
      atendimentos: [
        at(e1, 'Carlos (Financeiro)', 'impressora', 'concluido', 0, 'Impressora travando papel', 'Limpeza dos roletes e troca do fusor'),
        at(e2, 'Recepção', 'pc', 'em_andamento', 1, 'PC muito lento', 'Aguardando peça (SSD)'),
        at(e3, 'Júlia', 'impressora', 'aberto', 2, 'Não imprime pela rede', ''),
        at(e1, 'Paulo (RH)', 'pc', 'concluido', 4, 'Não liga', 'Fonte de alimentação trocada'),
        at(e2, 'Dra. Fernanda', 'impressora', 'concluido', 8, 'Impressão com listras', 'Troca do cartucho e limpeza dos cabeçotes'),
        at(e3, 'Roberto', 'pc', 'concluido', 12, 'Formatação e backup', 'Windows reinstalado, arquivos restaurados'),
        at(e1, 'Marcos', 'outro', 'concluido', 18, 'Roteador sem sinal', 'Reset e reconfiguração'),
        at(e2, 'Recepção', 'impressora', 'concluido', 25, 'Impressora offline', 'Driver reinstalado'),
        at(e3, 'Júlia', 'pc', 'concluido', 33, 'Tela azul', 'Memória RAM trocada'),
        at(e1, 'Carlos (Financeiro)', 'pc', 'concluido', 41, 'Instalação de programas', 'Office e antivírus instalados'),
        at(e2, 'Ana', 'impressora', 'concluido', 55, 'Manutenção preventiva', 'Limpeza geral'),
        at(e3, 'Roberto', 'impressora', 'concluido', 70, 'Toner acabando rápido', 'Troca do toner e do cilindro'),
        at(e1, 'Paulo (RH)', 'impressora', 'concluido', 95, 'Papel enroscando', 'Ajuste da bandeja'),
        at(e2, 'Dra. Fernanda', 'pc', 'concluido', 120, 'Atualização do sistema', 'Windows atualizado')
      ]
    };
    localStorage.setItem(KEY, JSON.stringify(data));
    return data;
  }

  const load = () => JSON.parse(localStorage.getItem(KEY) || 'null') || seed();
  const save = (d) => localStorage.setItem(KEY, JSON.stringify(d));

  function from(table) {
    const st = { op: 'select', payload: null, filters: [], orders: [] };

    const exec = () => {
      const data = load();
      const rows = data[table];
      const match = (r) => st.filters.every(([c, v]) => r[c] === v);

      if (st.op === 'select') {
        const out = rows.filter(match);
        out.sort((a, b) => {
          for (const [c, asc] of st.orders) {
            if (a[c] < b[c]) return asc ? -1 : 1;
            if (a[c] > b[c]) return asc ? 1 : -1;
          }
          return 0;
        });
        return { data: out, error: null };
      }
      if (st.op === 'insert') {
        data[table].push({ id: uid(), created_at: new Date().toISOString(), ...st.payload });
        save(data);
        return { data: null, error: null };
      }
      if (st.op === 'update') {
        rows.filter(match).forEach((r) => Object.assign(r, st.payload));
        save(data);
        return { data: null, error: null };
      }
      if (st.op === 'delete') {
        const alvo = rows.filter(match).map((r) => r.id);
        if (table === 'empresas' && data.atendimentos.some((a) => alvo.includes(a.empresa_id))) {
          return { data: null, error: { message: 'A empresa possui atendimentos.' } };
        }
        data[table] = rows.filter((r) => !alvo.includes(r.id));
        save(data);
        return { data: null, error: null };
      }
    };

    const b = {
      select() { return b; },
      insert(p) { st.op = 'insert'; st.payload = p; return b; },
      update(p) { st.op = 'update'; st.payload = p; return b; },
      delete() { st.op = 'delete'; return b; },
      eq(c, v) { st.filters.push([c, v]); return b; },
      order(c, o) { st.orders.push([c, !(o && o.ascending === false)]); return b; },
      then(res, rej) { return Promise.resolve(exec()).then(res, rej); }
    };
    return b;
  }

  const getSess = () => JSON.parse(localStorage.getItem(SESSION) || 'null');
  const notify = () => listeners.forEach((cb) => cb('AUTH', getSess()));

  const auth = {
    async getSession() { return { data: { session: getSess() } }; },
    async signInWithPassword({ email, password }) {
      if (email === 'demo@demo.com' && password === 'demo123') {
        localStorage.setItem(SESSION, JSON.stringify({ user: { email } }));
        notify();
        return { error: null };
      }
      return { error: { message: 'Credenciais inválidas' } };
    },
    async signUp() {
      return { error: { message: 'Modo demonstração: use demo@demo.com / demo123' } };
    },
    async signOut() { localStorage.removeItem(SESSION); notify(); },
    onAuthStateChange(cb) { listeners.push(cb); }
  };

  return { from, auth };
}
