const db = DEMO_MODE ? createDemoClient() : supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let empresas = [];
let atendimentos = [];

const TIPOS = { impressora: 'Impressora', pc: 'PC', outro: 'Outro' };
const STATUS = {
  concluido: ['Concluído', 'bg-green-100 text-green-700'],
  em_andamento: ['Em andamento', 'bg-yellow-100 text-yellow-700'],
  aberto: ['Aberto', 'bg-red-100 text-red-700']
};

const esc = (s) => $('<div>').text(s ?? '').html();
const hoje = () => new Date().toISOString().slice(0, 10);
const fmtData = (d) => d.split('-').reverse().join('/');

function toast(msg) {
  $('#toast').text(msg).removeClass('hidden');
  setTimeout(() => $('#toast').addClass('hidden'), 2500);
}

function erro(e) {
  console.error(e);
  toast('Erro: ' + (e.message || e));
}

// ---------- Auth ----------
async function init() {
  if (DEMO_MODE) {
    $('#demo-aviso').removeClass('hidden');
    $('#login-email').val('demo@demo.com');
    $('#login-senha').val('demo123');
  }
  const { data: { session } } = await db.auth.getSession();
  session ? mostrarApp() : mostrarLogin();
  db.auth.onAuthStateChange((_ev, s) => (s ? mostrarApp() : mostrarLogin()));
}

function mostrarLogin() {
  $('#view-app').addClass('hidden');
  $('#view-login').removeClass('hidden');
}

async function mostrarApp() {
  $('#view-login').addClass('hidden');
  $('#view-app').removeClass('hidden');
  $('#at-data').val(hoje());
  trocarTab('dashboard');
  await carregarTudo();
}

$('#form-login').on('submit', async (e) => {
  e.preventDefault();
  $('#login-msg').text('');
  const { error } = await db.auth.signInWithPassword({
    email: $('#login-email').val(),
    password: $('#login-senha').val()
  });
  if (error) $('#login-msg').text('E-mail ou senha incorretos.');
});

$('#btn-signup').on('click', async () => {
  const email = $('#login-email').val();
  const password = $('#login-senha').val();
  if (!email || password.length < 6) return $('#login-msg').text('Preencha e-mail e senha (mín. 6 caracteres).');
  const { error } = await db.auth.signUp({ email, password });
  $('#login-msg').text(error ? error.message : 'Conta criada! Confirme o e-mail se o Supabase pedir, depois entre.');
});

$('#btn-logout').on('click', () => db.auth.signOut());

// ---------- Abas ----------
function trocarTab(nome) {
  $('.tabview').addClass('hidden');
  $('#tab-' + nome).removeClass('hidden');
  $('.tab').removeClass('bg-slate-700').filter(`[data-tab="${nome}"]`).addClass('bg-slate-700');
}
$('.tab').on('click', function () { trocarTab($(this).data('tab')); });

// ---------- Carregamento ----------
async function carregarTudo() {
  await carregarEmpresas();
  await carregarAtendimentos();
}

async function carregarEmpresas() {
  const { data, error } = await db.from('empresas').select('*').order('nome');
  if (error) return erro(error);
  empresas = data;
  renderEmpresas();
}

async function carregarAtendimentos() {
  const { data, error } = await db.from('atendimentos').select('*').order('data_atendimento', { ascending: false }).order('created_at', { ascending: false });
  if (error) return erro(error);
  atendimentos = data;
  renderAtendimentos();
  renderDashboard();
}

const nomeEmpresa = (id) => (empresas.find((e) => e.id === id) || {}).nome || '—';

// ---------- Empresas ----------
function renderEmpresas() {
  const $l = $('#em-lista').empty();
  if (!empresas.length) $l.append('<li class="py-3 text-slate-500">Nenhuma empresa cadastrada ainda.</li>');
  empresas.forEach((e) => {
    const total = atendimentos.filter((a) => a.empresa_id === e.id).length;
    $l.append(`
      <li class="py-3 flex items-center justify-between gap-2">
        <div>
          <p class="font-medium">${esc(e.nome)}</p>
          <p class="text-slate-500">${esc([e.contato, e.telefone, e.email].filter(Boolean).join(' · '))}</p>
        </div>
        <div class="flex gap-3 shrink-0">
          <button data-edit="${e.id}" class="em-edit text-blue-600 hover:underline">Editar</button>
          <button data-del="${e.id}" class="em-del text-red-600 hover:underline">Excluir</button>
        </div>
      </li>`);
  });

  const opts = empresas.map((e) => `<option value="${e.id}">${esc(e.nome)}</option>`).join('');
  const atual = $('#at-empresa').val();
  $('#at-empresa').html(opts).val(atual || (empresas[0] && empresas[0].id));
  const filtro = $('#filtro-empresa').val();
  $('#filtro-empresa').html('<option value="">Todas as empresas</option>' + opts).val(filtro || '');
}

function limparFormEmpresa() {
  $('#form-empresa')[0].reset();
  $('#em-id').val('');
  $('#em-titulo').text('Nova empresa');
  $('#em-cancelar').addClass('hidden');
}

$('#form-empresa').on('submit', async (e) => {
  e.preventDefault();
  const id = $('#em-id').val();
  const dados = {
    nome: $('#em-nome').val().trim(),
    contato: $('#em-contato').val().trim() || null,
    telefone: $('#em-telefone').val().trim() || null,
    email: $('#em-email').val().trim() || null,
    endereco: $('#em-endereco').val().trim() || null
  };
  const { error } = id ? await db.from('empresas').update(dados).eq('id', id) : await db.from('empresas').insert(dados);
  if (error) return erro(error);
  toast('Empresa salva');
  limparFormEmpresa();
  await carregarEmpresas();
});

$('#em-lista').on('click', '.em-edit', function () {
  const e = empresas.find((x) => x.id === $(this).data('edit'));
  $('#em-id').val(e.id);
  $('#em-nome').val(e.nome);
  $('#em-contato').val(e.contato);
  $('#em-telefone').val(e.telefone);
  $('#em-email').val(e.email);
  $('#em-endereco').val(e.endereco);
  $('#em-titulo').text('Editando empresa');
  $('#em-cancelar').removeClass('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

$('#em-lista').on('click', '.em-del', async function () {
  if (!confirm('Excluir esta empresa? (só é possível se ela não tiver atendimentos)')) return;
  const { error } = await db.from('empresas').delete().eq('id', $(this).data('del'));
  if (error) return toast('Não foi possível excluir: a empresa tem atendimentos registrados.');
  toast('Empresa excluída');
  await carregarEmpresas();
});

$('#em-cancelar').on('click', limparFormEmpresa);

// ---------- Atendimentos ----------
function limparFormAtendimento() {
  $('#form-atendimento')[0].reset();
  $('#at-id').val('');
  $('#at-data').val(hoje());
  $('#at-titulo').text('Novo atendimento');
  $('#at-cancelar').addClass('hidden');
}

$('#form-atendimento').on('submit', async (e) => {
  e.preventDefault();
  if (!empresas.length) return toast('Cadastre uma empresa primeiro.');
  const id = $('#at-id').val();
  const dados = {
    empresa_id: $('#at-empresa').val(),
    cliente_nome: $('#at-cliente').val().trim(),
    data_atendimento: $('#at-data').val(),
    tipo: $('#at-tipo').val(),
    status: $('#at-status').val(),
    descricao: $('#at-descricao').val().trim() || null,
    solucao: $('#at-solucao').val().trim() || null
  };
  const { error } = id ? await db.from('atendimentos').update(dados).eq('id', id) : await db.from('atendimentos').insert(dados);
  if (error) return erro(error);
  toast('Atendimento salvo');
  limparFormAtendimento();
  await carregarAtendimentos();
  renderEmpresas();
});

function atendimentosFiltrados() {
  const emp = $('#filtro-empresa').val();
  const mes = $('#filtro-mes').val();
  return atendimentos.filter((a) => (!emp || a.empresa_id === emp) && (!mes || a.data_atendimento.startsWith(mes)));
}

function renderAtendimentos() {
  const lista = atendimentosFiltrados();
  $('#at-contagem').text(`(${lista.length})`);
  const $t = $('#at-lista').empty();
  if (!lista.length) $t.append('<tr><td colspan="6" class="py-4 text-slate-500">Nenhum atendimento encontrado.</td></tr>');
  lista.forEach((a) => {
    const [txt, cls] = STATUS[a.status];
    $t.append(`
      <tr class="border-b align-top">
        <td class="py-2 whitespace-nowrap">${fmtData(a.data_atendimento)}</td>
        <td>${esc(nomeEmpresa(a.empresa_id))}</td>
        <td>${esc(a.cliente_nome)}<p class="text-xs text-slate-500">${esc(a.descricao)}</p></td>
        <td>${TIPOS[a.tipo]}</td>
        <td><span class="px-2 py-0.5 rounded text-xs ${cls}">${txt}</span></td>
        <td class="whitespace-nowrap text-right">
          <button data-edit="${a.id}" class="at-edit text-blue-600 hover:underline">Editar</button>
          <button data-del="${a.id}" class="at-del text-red-600 hover:underline ml-2">Excluir</button>
        </td>
      </tr>`);
  });
}

$('#filtro-empresa, #filtro-mes').on('change', renderAtendimentos);
$('#filtro-limpar').on('click', () => { $('#filtro-empresa').val(''); $('#filtro-mes').val(''); renderAtendimentos(); });

$('#at-lista').on('click', '.at-edit', function () {
  const a = atendimentos.find((x) => x.id === $(this).data('edit'));
  $('#at-id').val(a.id);
  $('#at-empresa').val(a.empresa_id);
  $('#at-cliente').val(a.cliente_nome);
  $('#at-data').val(a.data_atendimento);
  $('#at-tipo').val(a.tipo);
  $('#at-status').val(a.status);
  $('#at-descricao').val(a.descricao);
  $('#at-solucao').val(a.solucao);
  $('#at-titulo').text('Editando atendimento');
  $('#at-cancelar').removeClass('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

$('#at-lista').on('click', '.at-del', async function () {
  if (!confirm('Excluir este atendimento?')) return;
  const { error } = await db.from('atendimentos').delete().eq('id', $(this).data('del'));
  if (error) return erro(error);
  toast('Atendimento excluído');
  await carregarAtendimentos();
  renderEmpresas();
});

$('#at-cancelar').on('click', limparFormAtendimento);

// ---------- Painel ----------
function renderDashboard() {
  const agora = hoje();
  const mesAtual = agora.slice(0, 7);
  const anoAtual = agora.slice(0, 4);

  $('#kpi-total').text(atendimentos.length);
  $('#kpi-mes').text(atendimentos.filter((a) => a.data_atendimento.startsWith(mesAtual)).length);
  $('#kpi-ano').text(atendimentos.filter((a) => a.data_atendimento.startsWith(anoAtual)).length);
  $('#kpi-abertos').text(atendimentos.filter((a) => a.status !== 'concluido').length);

  const linha = (nome, n) => `<li class="py-2 flex justify-between"><span>${esc(nome)}</span><span class="font-semibold">${n}</span></li>`;

  const $e = $('#dash-empresas').empty();
  empresas.forEach((e) => $e.append(linha(e.nome, atendimentos.filter((a) => a.empresa_id === e.id).length)));
  if (!empresas.length) $e.append('<li class="py-2 text-slate-500">Sem empresas.</li>');

  const porMes = {};
  atendimentos.forEach((a) => { const m = a.data_atendimento.slice(0, 7); porMes[m] = (porMes[m] || 0) + 1; });
  const $m = $('#dash-meses').empty();
  Object.keys(porMes).sort().reverse().forEach((m) => $m.append(linha(m.split('-').reverse().join('/'), porMes[m])));
  if (!atendimentos.length) $m.append('<li class="py-2 text-slate-500">Sem atendimentos.</li>');
}

init();
