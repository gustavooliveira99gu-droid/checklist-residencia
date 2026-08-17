/* ============================================================
   Checklist Residência Médica — script.js
   HTML + CSS + JS puro. Sem frameworks, sem dependências.
   ============================================================ */

/* ---------- GOOGLE OAUTH CONFIG ----------
   Cole aqui o Client ID gerado no Google Cloud Console
   (APIs & Services > Credenciais > ID do cliente OAuth 2.0 > Aplicativo Web).
   Veja o README.md para o passo a passo completo.
------------------------------------------------------------- */
const GOOGLE_CLIENT_ID = "COLE_SEU_CLIENT_ID_AQUI";
const GOOGLE_SCOPES =
  "https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly";

/* ---------- STORAGE ---------- */
const STORAGE_KEY = "checklist_residencia_data_v1";

/* ---------- MODO NOTURNO ---------- */
const THEME_KEY = "checklist_residencia_theme";

function currentTheme() {
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}
function updateThemeToggleIcon(theme) {
  const btn = document.getElementById("btn-theme-toggle");
  if (btn) btn.textContent = theme === "dark" ? "☀️" : "🌙";
}
function setTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(THEME_KEY, theme);
  updateThemeToggleIcon(theme);
}

const btnThemeToggle = document.getElementById("btn-theme-toggle");
if (btnThemeToggle) {
  updateThemeToggleIcon(currentTheme());
  btnThemeToggle.addEventListener("click", () => {
    setTheme(currentTheme() === "dark" ? "light" : "dark");
  });
}

/* ---------- QUESTÕES POR TEMA ---------- */
const QUESTOES_POR_TEMA = 15;
function novaListaQuestoes() {
  return Array(QUESTOES_POR_TEMA).fill(false);
}
function normalizeTemas(temas) {
  temas.forEach((t) => {
    if (!Array.isArray(t.questoes) || t.questoes.length !== QUESTOES_POR_TEMA) {
      t.questoes = novaListaQuestoes();
    } else {
      t.questoes = t.questoes.map((v) => !!v);
    }
    if (!t.incidencia || typeof t.incidencia !== "object") {
      t.incidencia = { fmabc: 0, susSp: 0 };
    } else {
      if (typeof t.incidencia.fmabc !== "number" || Number.isNaN(t.incidencia.fmabc)) t.incidencia.fmabc = 0;
      if (typeof t.incidencia.susSp !== "number" || Number.isNaN(t.incidencia.susSp)) t.incidencia.susSp = 0;
    }
  });
}

/* Garante state.config.provaPrincipal / dataProva sem apagar campos já existentes (ex.: Google Agenda). */
function normalizeConfig(parsed) {
  if (!parsed.config) {
    parsed.config = { googleConnected: false, selectedCalendarId: null, selectedCalendarName: null };
  }
  const provasValidas = ["fmabc", "susSp", "ambas", "personalizada"];
  if (provasValidas.indexOf(parsed.config.provaPrincipal) === -1) {
    parsed.config.provaPrincipal = "fmabc";
  }
  if (parsed.config.dataProva === undefined) parsed.config.dataProva = null;
  if (typeof parsed.updatedAt !== "number") parsed.updatedAt = 0;
}

/* ---------- SEED DATA (usada apenas na primeira execução) ---------- */
function buildSeedData() {
  const especialidades = [
    { id: "esp1", nome: "Cardiologia", cor: "#e11d48" },
    { id: "esp2", nome: "Terapia Intensiva", cor: "#f97316" },
    { id: "esp3", nome: "Hepatologia", cor: "#ca8a04" },
    { id: "esp4", nome: "Endocrinologia", cor: "#65a30d" },
    { id: "esp5", nome: "Neurologia", cor: "#059669" },
    { id: "esp6", nome: "Pneumologia", cor: "#0891b2" },
    { id: "esp7", nome: "Medicina Preventiva / Epidemiologia", cor: "#2563eb" },
    { id: "esp8", nome: "Toxicologia / Urgências", cor: "#7c3aed" },
    { id: "esp9", nome: "Psiquiatria", cor: "#c026d3" },
    { id: "esp10", nome: "Nefrologia", cor: "#0d9488" },
    { id: "esp11", nome: "Reumatologia", cor: "#b45309" },
    { id: "esp12", nome: "Hematologia", cor: "#db2777" },
    { id: "esp13", nome: "Infectologia", cor: "#4338ca" },
  ];

  const rawTemas = [
    ["esp1", "Hipertensão arterial"],
    ["esp1", "Doença coronariana"],
    ["esp1", "Cardiomiopatias, valvopatias e pericardite aguda"],
    ["esp1", "Arritmias cardíacas"],
    ["esp1", "PCR"],
    ["esp1", "Insuficiência cardíaca"],
    ["esp2", "Instabilidade hemodinâmica (choque)"],
    ["esp3", "Hepatopatias agudas"],
    ["esp3", "Hepatopatias crônicas e cirrose"],
    ["esp3", "Síndrome de hipertensão porta"],
    ["esp4", "Diabetes mellitus"],
    ["esp4", "Tireoide"],
    ["esp4", "Paratireoide e suprarrenal"],
    ["esp5", "Acidente vascular encefálico"],
    ["esp5", "Cefaleia"],
    ["esp5", "Doenças motoras"],
    ["esp5", "Demência"],
    ["esp5", "Estado de mal epiléptico e crise febril"],
    ["esp6", "Asma"],
    ["esp6", "DPOC"],
    ["esp6", "Tromboembolia pulmonar"],
    ["esp6", "Câncer de pulmão"],
    ["esp6", "Tuberculose"],
    ["esp6", "Insuficiência respiratória aguda"],
    ["esp7", "Coeficientes (taxas)"],
    ["esp7", "Índices — transição demográfica e epidemiológica"],
    ["esp7", "Doenças crônicas não transmissíveis — declaração de óbito"],
    ["esp7", "Classificação dos estudos epidemiológicos"],
    ["esp7", "Análise I — medidas de frequência e associação"],
    ["esp7", "Análise II — estatística"],
    ["esp7", "Extras e validação de teste diagnóstico"],
    ["esp7", "Raiva, tétano e vigilância da saúde"],
    ["esp7", "Processo epidêmico / prevenção de doenças"],
    ["esp7", "Saúde do trabalhador"],
    ["esp7", "Ética médica"],
    ["esp7", "Evolução e legislação do SUS"],
    ["esp7", "Financiamento do SUS"],
    ["esp7", "Atenção básica"],
    ["esp8", "Intoxicações"],
    ["esp8", "Acidentes por animais peçonhentos"],
    ["esp9", "Delirium e transtornos relacionados a substâncias"],
    ["esp9", "Transtornos psicóticos e transtornos de humor"],
    ["esp9", "Transtornos de ansiedade e transtornos alimentares"],
    ["esp10", "Síndromes glomerulares"],
    ["esp10", "Síndromes tubulares e vasculares"],
    ["esp10", "Síndrome urêmica"],
    ["esp10", "Equilíbrio eletrolítico"],
    ["esp10", "Equilíbrio ácido-básico"],
    ["esp11", "Artrites"],
    ["esp11", "Colagenoses"],
    ["esp11", "Vasculites"],
    ["esp11", "Miscelânea"],
    ["esp12", "Série vermelha — anemias"],
    ["esp12", "Série branca — leucemias"],
    ["esp12", "Série branca — linfoma e mieloma"],
    ["esp12", "Série plaquetária"],
    ["esp13", "Síndromes febris"],
    ["esp13", "HIV/AIDS"],
    ["esp13", "Endocardite infecciosa"],
    ["esp13", "Meningites"],
    ["esp13", "Pneumonia"],
    ["esp13", "Hanseníase"],
  ];

  const temas = rawTemas.map((t, i) => ({
    id: "t" + (i + 1),
    especialidadeId: t[0],
    nome: t[1],
    concluido: false,
    dataEstudo: null,
    horario: null,
    duracaoMin: null,
    eventId: null,
    calendarId: null,
    observacoes: "",
    questoes: novaListaQuestoes(),
    incidencia: { fmabc: 0, susSp: 0 },
  }));

  getEspecialidadeExtras().forEach((grupo) => {
    const esp = { id: uid("esp"), nome: grupo.nome, cor: grupo.cor };
    especialidades.push(esp);
    grupo.temas.forEach((nomeTema) => {
      temas.push({
        id: uid("t"),
        especialidadeId: esp.id,
        nome: nomeTema,
        concluido: false,
        dataEstudo: null,
        horario: null,
        duracaoMin: null,
        eventId: null,
        calendarId: null,
        observacoes: "",
        questoes: novaListaQuestoes(),
        incidencia: { fmabc: 0, susSp: 0 },
      });
    });
  });

  return {
    especialidades,
    temas,
    updatedAt: 0,
    config: {
      googleConnected: false,
      selectedCalendarId: null,
      selectedCalendarName: null,
      provaPrincipal: "fmabc",
      dataProva: null,
    },
    cronograma: {
      atividades: [],
    },
  };
}

/* ---------- TEMAS ADICIONAIS (Intensivão R1: Cirurgia, GO, Pediatria, Panorama) ----------
   Lista única usada tanto no seed inicial (instalação nova) quanto na migração
   automática (addMissingTemas) para quem já tem dados salvos no navegador. ------- */
function getEspecialidadeExtras() {
  return [
    {
      nome: "Panorama Geral",
      cor: "#64748b",
      temas: ["Introdução (Clínica Médica I)", "Panorama do Dia 2 da Clínica", "Introdução (Cirurgia)"],
    },
    {
      nome: "Cirurgia",
      cor: "#dc2626",
      temas: [
        "Trauma — avaliação inicial e trauma de tórax",
        "Trauma — transição toracoabdominal, abdome, pelve e TCE",
        "Queimadura",
        "Risco cirúrgico",
        "Anestesiologia",
        "Fios de sutura",
        "Complicações cirúrgicas",
        "Cicatrização",
        "Doenças do esôfago",
        "Doenças do estômago",
        "Doença inflamatória intestinal",
        "Delgado e cólon — pólipos e câncer colorretal",
        "Abdome agudo",
        "Pâncreas",
        "Fígado e vias biliares",
        "Hérnias",
        "Urologia",
        "Proctologia",
        "Cirurgia vascular",
        "Cirurgia pediátrica",
        "Cirurgia bariátrica",
      ],
    },
    {
      nome: "Ginecologia e Obstetrícia",
      cor: "#ec4899",
      temas: [
        "Endocrinoginecologia e infertilidade",
        "Anticoncepção",
        "Sangramento uterino anormal e endometriose",
        "IST",
        "Uroginecologia (incontinência e prolapso)",
        "Neoplasias ginecológicas",
        "Diagnóstico de gravidez e modificações do organismo",
        "Pré-natal, estática fetal e indução de parto",
        "Parto e prematuridade",
        "Hemorragias na primeira metade",
        "Hemorragias na segunda metade e doença hemolítica perinatal",
        "Doenças clínicas na gestação",
        "Sofrimento fetal",
        "Fórcipe, endometrite e hemorragia puerperal",
      ],
    },
    {
      nome: "Pediatria",
      cor: "#0ea5e9",
      temas: [
        "Aleitamento materno e suplementação de micronutrientes",
        "Doenças gastrointestinais",
        "IRA: infecções das vias aéreas superiores",
        "IRA: doenças com estridor",
        "IRA: infecções das vias aéreas inferiores",
        "Crescimento e seus distúrbios",
        "Puberdade e seus distúrbios",
        "Neonatologia: infecções congênitas e distúrbios respiratórios",
        "Neonatologia: icterícia neonatal e reanimação neonatal",
        "Imunizações",
        "Doenças exantemáticas",
        "Infecção do trato urinário",
      ],
    },
  ];
}

/* Migração idempotente: adiciona especialidades/temas que ainda não existem
   nos dados já salvos no navegador, sem apagar ou alterar nada existente. */
function addMissingTemas() {
  const grupos = getEspecialidadeExtras();
  let mudou = false;
  grupos.forEach((grupo) => {
    let esp = state.especialidades.find((e) => e.nome.trim().toLowerCase() === grupo.nome.trim().toLowerCase());
    if (!esp) {
      esp = { id: uid("esp"), nome: grupo.nome, cor: grupo.cor };
      state.especialidades.push(esp);
      mudou = true;
    }
    grupo.temas.forEach((nomeTema) => {
      const jaExiste = state.temas.some(
        (t) => t.especialidadeId === esp.id && t.nome.trim().toLowerCase() === nomeTema.trim().toLowerCase()
      );
      if (jaExiste) return;
      state.temas.push({
        id: uid("t"),
        especialidadeId: esp.id,
        nome: nomeTema,
        concluido: false,
        dataEstudo: null,
        horario: null,
        duracaoMin: null,
        eventId: null,
        calendarId: null,
        observacoes: "",
        questoes: novaListaQuestoes(),
        incidencia: { fmabc: 0, susSp: 0 },
      });
      mudou = true;
    });
  });
  if (mudou) saveState();
}

/* ---------- INCIDÊNCIA INICIAL (SUS-SP / FMABC) ----------
   Scores de importância histórica por prova, fornecidos para os temas já
   cadastrados no app. Formato por especialidade: [nomeTema, susSp, fmabc].
   Aplicado apenas quando o tema ainda não tem incidência definida (0/0),
   nunca sobrescreve valores já editados pelo usuário. ------- */
function getIncidenciaSeedPorEspecialidade() {
  return {
    "Cirurgia": [
      ["Trauma — avaliação inicial e trauma de tórax", 100, 95],
      ["Trauma — transição toracoabdominal, abdome, pelve e TCE", 100, 95],
      ["Queimadura", 80, 80],
      ["Risco cirúrgico", 70, 70],
      ["Complicações cirúrgicas", 75, 80],
      ["Cicatrização", 65, 75],
      ["Delgado e cólon — pólipos e câncer colorretal", 75, 75],
      ["Abdome agudo", 100, 100],
      ["Pâncreas", 75, 75],
      ["Fígado e vias biliares", 85, 80],
      ["Hérnias", 75, 70],
      ["Proctologia", 90, 65],
      ["Cirurgia bariátrica", 55, 70],
    ],
    "Cardiologia": [
      ["Insuficiência cardíaca", 95, 90],
      ["Doença coronariana", 90, 85],
      ["Arritmias cardíacas", 85, 90],
      ["PCR", 80, 90],
      ["Hipertensão arterial", 75, 75],
    ],
    "Terapia Intensiva": [["Instabilidade hemodinâmica (choque)", 85, 80]],
    "Hepatologia": [
      ["Hepatopatias crônicas e cirrose", 70, 95],
      ["Síndrome de hipertensão porta", 70, 85],
    ],
    "Infectologia": [
      ["Pneumonia", 85, 80],
      ["HIV/AIDS", 75, 70],
      ["Meningites", 75, 70],
    ],
    "Pneumologia": [
      ["Tuberculose", 85, 75],
      ["Asma", 75, 70],
      ["DPOC", 75, 70],
      ["Tromboembolia pulmonar", 75, 70],
      ["Insuficiência respiratória aguda", 80, 75],
    ],
    "Neurologia": [["Acidente vascular encefálico", 80, 75]],
    "Endocrinologia": [["Diabetes mellitus", 75, 70]],
    "Nefrologia": [
      ["Equilíbrio eletrolítico", 80, 75],
      ["Equilíbrio ácido-básico", 80, 75],
    ],
    "Hematologia": [["Série vermelha — anemias", 70, 65]],
    "Medicina Preventiva / Epidemiologia": [
      ["Atenção básica", 100, 90],
      ["Evolução e legislação do SUS", 95, 95],
      ["Financiamento do SUS", 85, 80],
      ["Classificação dos estudos epidemiológicos", 95, 100],
      ["Análise I — medidas de frequência e associação", 95, 100],
      ["Extras e validação de teste diagnóstico", 90, 95],
      ["Coeficientes (taxas)", 85, 90],
      ["Raiva, tétano e vigilância da saúde", 90, 85],
      ["Processo epidêmico / prevenção de doenças", 90, 85],
      ["Ética médica", 80, 75],
      ["Índices — transição demográfica e epidemiológica", 80, 80],
      ["Doenças crônicas não transmissíveis — declaração de óbito", 75, 75],
    ],
    "Ginecologia e Obstetrícia": [
      ["Parto e prematuridade", 85, 78],
      ["Pré-natal, estática fetal e indução de parto", 88, 83],
      ["Doenças clínicas na gestação", 85, 95],
      ["Hemorragias na primeira metade", 85, 95],
      ["Hemorragias na segunda metade e doença hemolítica perinatal", 85, 85],
      ["Fórcipe, endometrite e hemorragia puerperal", 85, 85],
      ["Endocrinoginecologia e infertilidade", 90, 80],
      ["Sangramento uterino anormal e endometriose", 83, 85],
      ["Anticoncepção", 85, 85],
      ["IST", 75, 95],
      ["Sofrimento fetal", 80, 80],
    ],
    "Pediatria": [
      ["Imunizações", 90, 100],
      ["IRA: infecções das vias aéreas inferiores", 90, 95],
      ["Neonatologia: infecções congênitas e distúrbios respiratórios", 78, 90],
      ["Neonatologia: icterícia neonatal e reanimação neonatal", 80, 90],
      ["Aleitamento materno e suplementação de micronutrientes", 85, 80],
      ["Doenças gastrointestinais", 85, 80],
      ["IRA: infecções das vias aéreas superiores", 80, 85],
      ["IRA: doenças com estridor", 75, 80],
      ["Infecção do trato urinário", 75, 75],
      ["Doenças exantemáticas", 75, 75],
      ["Crescimento e seus distúrbios", 70, 75],
    ],
  };
}

function seedIncidenciaIniciais() {
  const seed = getIncidenciaSeedPorEspecialidade();
  let mudou = false;
  Object.keys(seed).forEach((nomeEsp) => {
    const esp = state.especialidades.find((e) => e.nome.trim().toLowerCase() === nomeEsp.trim().toLowerCase());
    if (!esp) return;
    seed[nomeEsp].forEach(([nomeTema, susSp, fmabc]) => {
      const tema = state.temas.find(
        (t) => t.especialidadeId === esp.id && t.nome.trim().toLowerCase() === nomeTema.trim().toLowerCase()
      );
      if (!tema) return;
      const semDados = !tema.incidencia || ((tema.incidencia.fmabc || 0) === 0 && (tema.incidencia.susSp || 0) === 0);
      if (!semDados) return;
      tema.incidencia = { fmabc, susSp };
      mudou = true;
    });
  });
  if (mudou) saveState();
}

/* ---------- STATE ---------- */
let state = loadState();

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seed = buildSeedData();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }
    const parsed = JSON.parse(raw);
    if (!parsed.especialidades || !parsed.temas) throw new Error("formato inválido");
    normalizeConfig(parsed);
    normalizeTemas(parsed.temas);
    normalizeCronograma(parsed);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    return parsed;
  } catch (e) {
    console.error("Erro ao carregar dados, iniciando com dados padrão.", e);
    const seed = buildSeedData();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }
}

function saveState() {
  state.updatedAt = Date.now();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  agendarSyncAutomatico();
}

function uid(prefix) {
  return prefix + "_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
}

/* ---------- UI STATE (não persistido) ---------- */
const ui = {
  search: "",
  statusFilter: "todos", // todos | pendentes | concluidos | programados
  especialidadeFilter: "todas",
  expandedQuestoes: new Set(), // temaIds com o painel de questões aberto
  cronogramaTab: "hoje", // hoje | semana | proximas | atrasadas | progresso
  dashPrio: {
    especialidade: "todas",
    incidencia: "todas",
    status: "pendentes",
    revisao: "todas",
    desempenho: "todos",
    ordenar: "prioridade",
  },
};

/* ---------- HELPERS ---------- */
function getEspecialidade(id) {
  return state.especialidades.find((e) => e.id === id);
}
function getTema(id) {
  return state.temas.find((t) => t.id === id);
}
function isProgramado(tema) {
  return !!tema.dataEstudo;
}
function todayStr() {
  const d = new Date();
  return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
}
function pad(n) {
  return String(n).padStart(2, "0");
}
function formatDateLabel(dateStr) {
  const today = todayStr();
  const d = new Date(dateStr + "T00:00:00");
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.getFullYear() + "-" + pad(tomorrow.getMonth() + 1) + "-" + pad(tomorrow.getDate());
  if (dateStr === today) return "Hoje";
  if (dateStr === tomorrowStr) return "Amanhã";
  return pad(d.getDate()) + "/" + pad(d.getMonth() + 1);
}
function formatDateFull(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return pad(d.getDate()) + "/" + pad(d.getMonth() + 1) + "/" + d.getFullYear();
}
function showToast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.remove("hidden");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => el.classList.add("hidden"), 2800);
}

/* ============================================================
   RENDER
   ============================================================ */
function renderAll() {
  renderDashboard();
  renderUpcoming();
  renderEspecialidadeFilterOptions();
  renderChecklist();
  renderCronograma();
  renderDashboardTab();
}

const PROGRESS_RING_RADIUS = 54;
const PROGRESS_RING_CIRCUMFERENCE = 2 * Math.PI * PROGRESS_RING_RADIUS;

function renderDashboard() {
  const total = state.temas.length;
  const done = state.temas.filter((t) => t.concluido).length;
  const pending = total - done;
  const scheduled = state.temas.filter((t) => isProgramado(t) && !t.concluido).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  document.getElementById("progress-title").textContent = `${done} / ${total} temas`;
  document.getElementById("progress-percent").textContent = `${pct}% concluído`;
  document.getElementById("progress-bar-fill").style.width = pct + "%";

  const ringFill = document.getElementById("progress-ring-fill");
  if (ringFill) {
    const offset = PROGRESS_RING_CIRCUMFERENCE - (pct / 100) * PROGRESS_RING_CIRCUMFERENCE;
    ringFill.style.strokeDasharray = `${PROGRESS_RING_CIRCUMFERENCE}`;
    ringFill.style.strokeDashoffset = `${offset}`;
  }
  const ringPct = document.getElementById("progress-ring-pct");
  if (ringPct) ringPct.textContent = pct + "%";

  document.getElementById("stat-total").textContent = total;
  document.getElementById("stat-done").textContent = done;
  document.getElementById("stat-pending").textContent = pending;
  document.getElementById("stat-scheduled").textContent = scheduled;
}

function renderUpcoming() {
  const container = document.getElementById("upcoming-list");
  const today = todayStr();
  const upcoming = state.temas
    .filter((t) => !t.concluido && t.dataEstudo && t.dataEstudo >= today)
    .sort((a, b) => {
      const da = a.dataEstudo + "T" + (a.horario || "00:00");
      const db = b.dataEstudo + "T" + (b.horario || "00:00");
      return da < db ? -1 : da > db ? 1 : 0;
    });

  if (upcoming.length === 0) {
    container.innerHTML = '<p class="empty-msg">Nenhum estudo programado.</p>';
    return;
  }

  let html = "";
  let lastLabel = null;
  upcoming.forEach((t) => {
    const esp = getEspecialidade(t.especialidadeId);
    const label = t.dataEstudo === today ? "Hoje" : formatDateLabel(t.dataEstudo) === "Amanhã" ? "Amanhã" : formatDateFull(t.dataEstudo);
    if (label !== lastLabel) {
      html += `<div class="upcoming-group-label">${escapeHtml(label)}</div>`;
      lastLabel = label;
    }
    html += `
      <div class="upcoming-item">
        <div class="upcoming-item-left">
          <span class="upcoming-dot" style="background:${esp ? esp.cor : "#999"}"></span>
          <div>
            <div class="upcoming-nome">${escapeHtml(t.nome)}</div>
            <div class="upcoming-esp">${esp ? escapeHtml(esp.nome) : ""}</div>
          </div>
        </div>
        <div class="upcoming-time">${t.horario ? t.horario : ""}</div>
      </div>`;
  });
  container.innerHTML = html;
}

function renderEspecialidadeFilterOptions() {
  const select = document.getElementById("filter-especialidade");
  const current = select.value || "todas";
  const options = ['<option value="todas">Todas as especialidades</option>'];
  state.especialidades.forEach((e) => {
    options.push(`<option value="${e.id}">${escapeHtml(e.nome)}</option>`);
  });
  select.innerHTML = options.join("");
  select.value = state.especialidades.some((e) => e.id === current) ? current : "todas";
  ui.especialidadeFilter = select.value;
}

function passesFilters(tema) {
  if (ui.search) {
    const q = ui.search.toLowerCase();
    if (!tema.nome.toLowerCase().includes(q)) return false;
  }
  if (ui.statusFilter === "pendentes" && tema.concluido) return false;
  if (ui.statusFilter === "concluidos" && !tema.concluido) return false;
  if (ui.statusFilter === "programados" && !isProgramado(tema)) return false;
  if (ui.especialidadeFilter !== "todas" && tema.especialidadeId !== ui.especialidadeFilter) return false;
  return true;
}

function renderChecklist() {
  const container = document.getElementById("checklist");
  const groups = state.especialidades
    .map((esp) => {
      const allTemas = state.temas.filter((t) => t.especialidadeId === esp.id);
      const visibleTemas = allTemas.filter(passesFilters);
      return { esp, allTemas, visibleTemas };
    })
    .filter((g) => g.visibleTemas.length > 0 || (g.allTemas.length === 0 && ui.search === "" && ui.statusFilter === "todos" && ui.especialidadeFilter === "todas"));

  if (groups.every((g) => g.visibleTemas.length === 0)) {
    container.innerHTML = '<p class="empty-msg">Nenhum tema encontrado.</p>';
    return;
  }

  container.innerHTML = groups
    .map((g) => {
      const total = g.allTemas.length;
      const done = g.allTemas.filter((t) => t.concluido).length;
      const pct = total > 0 ? Math.round((done / total) * 100) : 0;

      const rows = g.visibleTemas
        .map((t) => {
          const metaParts = [];
          const estudoPendente = getEstudoPendente(t.id);
          if (estudoPendente) {
            const atrasado = estudoPendente.dataPlanejada < todayStr();
            metaParts.push(
              `<span class="badge-data-estudo ${atrasado ? "atrasado" : ""}">📖 Estudo: ${formatDateFull(estudoPendente.dataPlanejada)}</span>`
            );
          }
          if (isProgramado(t)) {
            metaParts.push(
              `<span class="badge-scheduled">📅 ${formatDateFull(t.dataEstudo)}${t.horario ? " · " + t.horario : ""}</span>`
            );
          }
          const doneQ = t.questoes.filter(Boolean).length;
          const isQuestoesComplete = doneQ === QUESTOES_POR_TEMA;
          metaParts.push(
            `<span class="badge-questoes ${isQuestoesComplete ? "completo" : ""}" id="questoes-badge-${t.id}">📝 Questões: ${doneQ}/${QUESTOES_POR_TEMA}${isQuestoesComplete ? " ✓" : ""}</span>`
          );
          const incInfo = getIncidenciaInfo(t);
          if (incInfo.temDados) {
            metaParts.push(
              `<span class="badge-incidencia ${incInfo.classe.cls}" title="SUS-SP: ${incInfo.susSp} | FMABC: ${incInfo.fmabc}">${incInfo.classe.emoji ? incInfo.classe.emoji + " " : ""}Incidência: ${incInfo.classe.label}${incInfo.destaqueAmbas ? " ⭐" : ""}</span>`
            );
          }
          if (!t.concluido) {
            const prio = calcularPrioridadeTema(t);
            metaParts.push(
              `<button type="button" class="badge-prioridade ${prio.nivel.toLowerCase()}" data-action="ver-prioridade" data-tema-id="${t.id}">🎯 Prioridade ${prio.score} · ${prio.nivel}</button>`
            );
          }
          return `
          <div class="tema-block">
            <div class="tema-row ${t.concluido ? "concluido" : ""}" data-tema-id="${t.id}">
              <input type="checkbox" class="tema-checkbox" data-action="toggle" ${t.concluido ? "checked" : ""}>
              <div class="tema-info">
                <div class="tema-nome">${escapeHtml(t.nome)}</div>
                <div class="tema-meta">${metaParts.join("")}</div>
              </div>
              <div class="tema-actions">
                <button class="icon-btn" data-action="questoes" title="Questões">📝</button>
                <button class="icon-btn" data-action="agendar" title="Agendar">📅</button>
                ${estudoPendente ? `<button class="icon-btn" data-action="reagendar" title="Reagendar">🔁</button>` : ""}
                <button class="icon-btn" data-action="editar" title="Editar">✏️</button>
                <button class="icon-btn" data-action="excluir" title="Excluir">🗑</button>
              </div>
            </div>
            ${renderQuestoesPanel(t)}
          </div>`;
        })
        .join("");

      return `
      <div class="especialidade-group">
        <div class="especialidade-header" style="--esp-color:${g.esp.cor}">
          <div class="especialidade-header-top">
            <span class="especialidade-nome">${escapeHtml(g.esp.nome)}</span>
            <span class="especialidade-stats">${done} / ${total} concluídos · ${pct}%</span>
          </div>
          <div class="especialidade-progress-outer">
            <div class="especialidade-progress-fill" style="width:${pct}%"></div>
          </div>
        </div>
        <div class="tema-list">${rows || '<p class="empty-msg" style="padding:14px 20px;">Nenhum tema nesta especialidade.</p>'}</div>
      </div>`;
    })
    .join("");
}

function renderQuestoesPanel(tema) {
  const doneQ = tema.questoes.filter(Boolean).length;
  const pctQ = Math.round((doneQ / QUESTOES_POR_TEMA) * 100);
  const isComplete = doneQ === QUESTOES_POR_TEMA;
  const expanded = ui.expandedQuestoes.has(tema.id);

  const checkboxes = tema.questoes
    .map((marcada, i) => {
      const numero = i + 1;
      const inputId = `q-${tema.id}-${numero}`;
      return `
        <label class="questao-check ${marcada ? "marcada" : ""}" for="${inputId}">
          <input type="checkbox" id="${inputId}" data-action="toggle-questao" data-tema-id="${tema.id}" data-q-index="${i}" ${marcada ? "checked" : ""}>
          <span>${numero}</span>
        </label>`;
    })
    .join("");

  return `
    <div class="tema-questoes ${expanded ? "" : "hidden"} ${isComplete ? "completo" : ""}" id="questoes-panel-${tema.id}">
      <div class="questoes-top">
        <span class="questoes-label">Questões</span>
        <span class="questoes-counter" id="questoes-counter-${tema.id}">Questões: ${doneQ}/${QUESTOES_POR_TEMA}</span>
      </div>
      <div class="questoes-progress-outer">
        <div class="questoes-progress-fill ${isComplete ? "completo" : ""}" id="questoes-progress-${tema.id}" style="width:${pctQ}%"></div>
      </div>
      <div class="questoes-grid">${checkboxes}</div>
    </div>`;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str == null ? "" : String(str);
  return div.innerHTML;
}

/* ============================================================
   CHECKLIST ACTIONS (delegação de eventos)
   ============================================================ */
document.getElementById("checklist").addEventListener("click", (e) => {
  const row = e.target.closest(".tema-row");
  if (!row) return;
  const temaId = row.dataset.temaId;
  const action = e.target.dataset.action;
  if (!action) return;

  if (action === "editar") openEditTema(temaId);
  else if (action === "excluir") openConfirmDelete(temaId);
  else if (action === "agendar") openAgendar(temaId);
  else if (action === "reagendar") openReagendarTema(temaId);
  else if (action === "questoes") toggleQuestoesPanel(temaId);
  else if (action === "ver-prioridade") openPrioridadeModal(temaId);
});

/* Reagenda o tema a partir do Checklist, reaproveitando o modal de
   editar/reagendar atividade já usado no Cronograma. */
function openReagendarTema(temaId) {
  const ativ = getEstudoPendente(temaId);
  if (!ativ) {
    showToast("Este tema não tem um estudo pendente para reagendar.");
    return;
  }
  openEditarAtividade(ativ.id);
}

document.getElementById("checklist").addEventListener("change", (e) => {
  if (e.target.dataset.action === "toggle") {
    const row = e.target.closest(".tema-row");
    const tema = getTema(row.dataset.temaId);
    if (!tema) return;
    tema.concluido = e.target.checked;
    saveState();
    renderAll();
  } else if (e.target.dataset.action === "toggle-questao") {
    const temaId = e.target.dataset.temaId;
    const qIndex = parseInt(e.target.dataset.qIndex, 10);
    const tema = getTema(temaId);
    if (!tema || Number.isNaN(qIndex)) return;
    tema.questoes[qIndex] = e.target.checked;
    saveState();
    const label = e.target.closest(".questao-check");
    if (label) label.classList.toggle("marcada", e.target.checked);
    updateQuestoesUI(tema);
  }
});

function toggleQuestoesPanel(temaId) {
  const panel = document.getElementById("questoes-panel-" + temaId);
  if (!panel) return;
  const isHidden = panel.classList.contains("hidden");
  if (isHidden) {
    panel.classList.remove("hidden");
    ui.expandedQuestoes.add(temaId);
  } else {
    panel.classList.add("hidden");
    ui.expandedQuestoes.delete(temaId);
  }
}

function updateQuestoesUI(tema) {
  const doneQ = tema.questoes.filter(Boolean).length;
  const pctQ = Math.round((doneQ / QUESTOES_POR_TEMA) * 100);
  const isComplete = doneQ === QUESTOES_POR_TEMA;

  const counterEl = document.getElementById("questoes-counter-" + tema.id);
  if (counterEl) counterEl.textContent = `Questões: ${doneQ}/${QUESTOES_POR_TEMA}`;

  const badgeEl = document.getElementById("questoes-badge-" + tema.id);
  if (badgeEl) {
    badgeEl.textContent = `📝 Questões: ${doneQ}/${QUESTOES_POR_TEMA}${isComplete ? " ✓" : ""}`;
    badgeEl.classList.toggle("completo", isComplete);
  }

  const fillEl = document.getElementById("questoes-progress-" + tema.id);
  if (fillEl) {
    fillEl.style.width = pctQ + "%";
    fillEl.classList.toggle("completo", isComplete);
  }

  const panelEl = document.getElementById("questoes-panel-" + tema.id);
  if (panelEl) panelEl.classList.toggle("completo", isComplete);
}

/* ============================================================
   BUSCA E FILTROS
   ============================================================ */
document.getElementById("search-input").addEventListener("input", (e) => {
  ui.search = e.target.value.trim();
  renderChecklist();
});

document.getElementById("status-filters").addEventListener("click", (e) => {
  const btn = e.target.closest(".filter-btn");
  if (!btn) return;
  document.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
  ui.statusFilter = btn.dataset.filter;
  renderChecklist();
});

document.getElementById("filter-especialidade").addEventListener("change", (e) => {
  ui.especialidadeFilter = e.target.value;
  renderChecklist();
});

/* ============================================================
   MODAL: ADICIONAR / EDITAR TEMA
   ============================================================ */
const modalTema = document.getElementById("modal-tema");
const formTema = document.getElementById("form-tema");
const selectEspecialidade = document.getElementById("tema-especialidade");

function fillEspecialidadeSelect() {
  const options = state.especialidades.map((e) => `<option value="${e.id}">${escapeHtml(e.nome)}</option>`);
  options.push('<option value="__nova__">+ Nova especialidade</option>');
  selectEspecialidade.innerHTML = options.join("");
}

selectEspecialidade.addEventListener("change", () => {
  const wrap = document.getElementById("nova-especialidade-wrap");
  wrap.classList.toggle("hidden", selectEspecialidade.value !== "__nova__");
});

function openAddTema() {
  fillEspecialidadeSelect();
  document.getElementById("modal-tema-title").textContent = "Adicionar tema";
  document.getElementById("tema-id").value = "";
  document.getElementById("tema-nome").value = "";
  document.getElementById("tema-data").value = "";
  document.getElementById("nova-especialidade-nome").value = "";
  document.getElementById("nova-especialidade-wrap").classList.add("hidden");
  document.getElementById("tema-incidencia-fmabc").value = "";
  document.getElementById("tema-incidencia-sussp").value = "";
  selectEspecialidade.value = state.especialidades[0] ? state.especialidades[0].id : "__nova__";
  modalTema.classList.remove("hidden");
}

function openEditTema(temaId) {
  const tema = getTema(temaId);
  if (!tema) return;
  fillEspecialidadeSelect();
  document.getElementById("modal-tema-title").textContent = "Editar tema";
  document.getElementById("tema-id").value = tema.id;
  document.getElementById("tema-nome").value = tema.nome;
  document.getElementById("tema-data").value = tema.dataEstudo || "";
  document.getElementById("nova-especialidade-nome").value = "";
  document.getElementById("nova-especialidade-wrap").classList.add("hidden");
  document.getElementById("tema-incidencia-fmabc").value = tema.incidencia ? tema.incidencia.fmabc || "" : "";
  document.getElementById("tema-incidencia-sussp").value = tema.incidencia ? tema.incidencia.susSp || "" : "";
  selectEspecialidade.value = tema.especialidadeId;
  modalTema.classList.remove("hidden");
}

function lerIncidenciaDoForm() {
  const fmabc = parseInt(document.getElementById("tema-incidencia-fmabc").value, 10);
  const susSp = parseInt(document.getElementById("tema-incidencia-sussp").value, 10);
  return {
    fmabc: Number.isNaN(fmabc) ? 0 : Math.max(0, Math.min(100, fmabc)),
    susSp: Number.isNaN(susSp) ? 0 : Math.max(0, Math.min(100, susSp)),
  };
}

document.getElementById("btn-add-tema").addEventListener("click", openAddTema);
document.getElementById("btn-cancel-tema").addEventListener("click", () => modalTema.classList.add("hidden"));

formTema.addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("tema-id").value;
  const nome = document.getElementById("tema-nome").value.trim();
  const novaData = document.getElementById("tema-data").value || null;
  let especialidadeId = selectEspecialidade.value;

  if (!nome) return;

  if (especialidadeId === "__nova__") {
    const novoNome = document.getElementById("nova-especialidade-nome").value.trim();
    if (!novoNome) {
      showToast("Informe o nome da nova especialidade.");
      return;
    }
    const novaEsp = { id: uid("esp"), nome: novoNome, cor: randomColor() };
    state.especialidades.push(novaEsp);
    especialidadeId = novaEsp.id;
  }

  if (id) {
    const tema = getTema(id);
    tema.nome = nome;
    tema.especialidadeId = especialidadeId;
    const dataChanged = tema.dataEstudo !== novaData;
    tema.dataEstudo = novaData;
    tema.incidencia = lerIncidenciaDoForm();
    if (!novaData) {
      tema.horario = null;
      tema.duracaoMin = null;
    }
    saveState();
    renderAll();
    modalTema.classList.add("hidden");
    showToast("Tema atualizado.");

    if (dataChanged && tema.eventId && tema.calendarId && novaData && tema.horario) {
      try {
        await updateGoogleEvent(tema);
      } catch (err) {
        console.error(err);
      }
    }
  } else {
    const novoTema = {
      id: uid("t"),
      especialidadeId,
      nome,
      concluido: false,
      dataEstudo: novaData,
      horario: null,
      duracaoMin: null,
      eventId: null,
      calendarId: null,
      observacoes: "",
      questoes: novaListaQuestoes(),
      incidencia: lerIncidenciaDoForm(),
    };
    state.temas.push(novoTema);
    agendarEstudoTema(novoTema);
    saveState();
    renderAll();
    modalTema.classList.add("hidden");
    showToast("Tema adicionado.");
  }
});

function randomColor() {
  const palette = ["#0f766e", "#9333ea", "#b91c1c", "#0369a1", "#a16207", "#4d7c0f", "#be185d", "#1d4ed8"];
  return palette[Math.floor(Math.random() * palette.length)];
}

/* ============================================================
   MODAL: CONFIRMAR EXCLUSÃO
   ============================================================ */
const modalConfirm = document.getElementById("modal-confirm");
let temaIdToDelete = null;

function openConfirmDelete(temaId) {
  const tema = getTema(temaId);
  if (!tema) return;
  temaIdToDelete = temaId;
  document.getElementById("confirm-tema-nome").textContent = tema.nome;
  modalConfirm.classList.remove("hidden");
}

document.getElementById("btn-cancel-confirm").addEventListener("click", () => {
  temaIdToDelete = null;
  modalConfirm.classList.add("hidden");
});

document.getElementById("btn-confirm-delete").addEventListener("click", async () => {
  if (!temaIdToDelete) return;
  const tema = getTema(temaIdToDelete);
  if (tema && tema.eventId && tema.calendarId) {
    try {
      await deleteGoogleEvent(tema);
    } catch (err) {
      console.error(err);
    }
  }
  state.temas = state.temas.filter((t) => t.id !== temaIdToDelete);
  state.cronograma.atividades = state.cronograma.atividades.filter((a) => a.temaId !== temaIdToDelete);
  saveState();
  temaIdToDelete = null;
  modalConfirm.classList.add("hidden");
  renderAll();
  showToast("Tema excluído.");
});

/* ============================================================
   MODAL: AGENDAR (Google Agenda)
   ============================================================ */
const modalAgendar = document.getElementById("modal-agendar");
const formAgendar = document.getElementById("form-agendar");

function openAgendar(temaId) {
  const tema = getTema(temaId);
  if (!tema) return;
  document.getElementById("agendar-tema-id").value = tema.id;
  document.getElementById("agendar-tema-nome").textContent = tema.nome;
  document.getElementById("agendar-data").value = tema.dataEstudo || todayStr();
  document.getElementById("agendar-horario").value = tema.horario || "19:00";
  document.getElementById("agendar-duracao").value = tema.duracaoMin || 60;
  document.getElementById("agendar-status").textContent = "";
  document.getElementById("btn-remove-agendamento").classList.toggle("hidden", !isProgramado(tema));
  document.getElementById("btn-save-agendar").disabled = false;
  modalAgendar.classList.remove("hidden");
}

document.getElementById("btn-cancel-agendar").addEventListener("click", () => modalAgendar.classList.add("hidden"));

document.getElementById("btn-remove-agendamento").addEventListener("click", async () => {
  const temaId = document.getElementById("agendar-tema-id").value;
  const tema = getTema(temaId);
  if (!tema) return;
  const statusEl = document.getElementById("agendar-status");
  try {
    if (tema.eventId && tema.calendarId) {
      statusEl.textContent = "Removendo evento do Google Agenda...";
      await deleteGoogleEvent(tema);
    }
    tema.dataEstudo = null;
    tema.horario = null;
    tema.duracaoMin = null;
    tema.eventId = null;
    tema.calendarId = null;
    saveState();
    renderAll();
    modalAgendar.classList.add("hidden");
    showToast("Agendamento removido.");
  } catch (err) {
    console.error(err);
    statusEl.textContent = "Erro ao remover evento do Google Agenda.";
  }
});

formAgendar.addEventListener("submit", async (e) => {
  e.preventDefault();
  const temaId = document.getElementById("agendar-tema-id").value;
  const tema = getTema(temaId);
  if (!tema) return;

  const data = document.getElementById("agendar-data").value;
  const horario = document.getElementById("agendar-horario").value;
  const duracaoMin = parseInt(document.getElementById("agendar-duracao").value, 10);
  const statusEl = document.getElementById("agendar-status");
  const saveBtn = document.getElementById("btn-save-agendar");

  tema.dataEstudo = data;
  tema.horario = horario;
  tema.duracaoMin = duracaoMin;
  saveState();
  renderAll();

  if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID === "COLE_SEU_CLIENT_ID_AQUI") {
    saveState();
    modalAgendar.classList.add("hidden");
    showToast("Tema agendado localmente. Configure o Google Client ID para sincronizar com o Google Agenda.");
    return;
  }

  saveBtn.disabled = true;
  statusEl.textContent = "Conectando ao Google Agenda...";

  try {
    if (!state.config.googleConnected || !accessToken) {
      await connectGoogleFlow();
    }
    if (!state.config.selectedCalendarId) {
      statusEl.textContent = "Selecione uma agenda em Configurações antes de agendar.";
      saveBtn.disabled = false;
      showToast("Abra Configurações e selecione uma agenda do Google.");
      return;
    }

    statusEl.textContent = "Sincronizando com o Google Agenda...";
    if (tema.eventId && tema.calendarId) {
      await updateGoogleEvent(tema);
    } else {
      await createGoogleEvent(tema);
    }
    saveState();
    renderAll();
    statusEl.textContent = "";
    modalAgendar.classList.add("hidden");
    showToast("Estudo agendado e sincronizado com o Google Agenda.");
  } catch (err) {
    console.error(err);
    statusEl.textContent = "Não foi possível sincronizar com o Google Agenda. O tema foi salvo localmente.";
  } finally {
    saveBtn.disabled = false;
  }
});

/* ============================================================
   MODAL: CONFIGURAÇÕES
   ============================================================ */
const modalSettings = document.getElementById("modal-settings");

document.getElementById("btn-settings").addEventListener("click", () => {
  refreshSettingsUI();
  modalSettings.classList.remove("hidden");
});
document.getElementById("btn-close-settings").addEventListener("click", () => modalSettings.classList.add("hidden"));

/* Fonte única de troca de prova-alvo: usada em Configurações e no Dashboard,
   mantém os dois seletores sincronizados e recalcula tudo imediatamente. */
function setProvaPrincipal(valor) {
  state.config.provaPrincipal = valor;
  saveState();
  const c1 = document.getElementById("config-prova-principal");
  const c2 = document.getElementById("dash-prova-select");
  if (c1) c1.value = valor;
  if (c2) c2.value = valor;
  renderAll();
  showToast("Prova principal atualizada. Prioridades recalculadas.");
}

const configProvaPrincipal = document.getElementById("config-prova-principal");
if (configProvaPrincipal) {
  configProvaPrincipal.addEventListener("change", (e) => setProvaPrincipal(e.target.value));
}

const dashProvaSelect = document.getElementById("dash-prova-select");
if (dashProvaSelect) {
  dashProvaSelect.addEventListener("change", (e) => setProvaPrincipal(e.target.value));
}

const configDataProva = document.getElementById("config-data-prova");
if (configDataProva) {
  configDataProva.addEventListener("change", (e) => {
    state.config.dataProva = e.target.value || null;
    saveState();
    renderAll();
  });
}

function refreshSettingsUI() {
  document.getElementById("config-prova-principal").value = state.config.provaPrincipal || "fmabc";
  document.getElementById("config-data-prova").value = state.config.dataProva || "";
  const ghInput = document.getElementById("gh-token-input");
  if (ghInput) ghInput.value = getGhToken();
  const ghGistInput = document.getElementById("gh-gistid-input");
  if (ghGistInput) ghGistInput.value = getGhGistId();
  setSyncStatus(syncConfigurado() ? (getGhGistId() ? "Conectado." : "Token salvo. Toque em Sincronizar agora.") : "Nenhum token salvo.");
  const statusEl = document.getElementById("google-status");
  if (state.config.googleConnected) {
    statusEl.textContent = "Conectado ao Google";
    statusEl.classList.add("connected");
  } else {
    statusEl.textContent = "Não conectado";
    statusEl.classList.remove("connected");
  }

  const wrap = document.getElementById("calendar-select-wrap");
  if (state.config.googleConnected) {
    wrap.classList.remove("hidden");
    if (calendarListCache) {
      populateCalendarSelect(calendarListCache);
    } else {
      fetchCalendarList().catch((err) => console.error(err));
    }
  } else {
    wrap.classList.add("hidden");
  }
}

/* ---------- Backup: Exportar / Importar ---------- */
document.getElementById("btn-export").addEventListener("click", () => {
  const dataStr = JSON.stringify(state, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const dateSuffix = todayStr();
  a.href = url;
  a.download = `checklist-residencia-backup-${dateSuffix}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast("Backup exportado.");
});

document.getElementById("btn-import").addEventListener("click", () => {
  document.getElementById("import-file-input").click();
});

document.getElementById("import-file-input").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (evt) => {
    try {
      const parsed = JSON.parse(evt.target.result);
      if (!parsed.especialidades || !parsed.temas) throw new Error("Arquivo inválido.");
      normalizeConfig(parsed);
      normalizeTemas(parsed.temas);
      normalizeCronograma(parsed);
      state = parsed;
      addMissingTemas();
      bootstrapCronograma();
      saveState();
      renderAll();
      refreshSettingsUI();
      showToast("Backup importado com sucesso.");
    } catch (err) {
      console.error(err);
      showToast("Erro ao importar backup: arquivo inválido.");
    } finally {
      e.target.value = "";
    }
  };
  reader.readAsText(file);
});

/* ============================================================
   CRONOGRAMA INTELIGENTE (Estudo → Questões → Revisão D1 → D7 → D30)
   ============================================================ */
const DIAS_DISPONIVEIS_ESTUDO = [1, 2, 3]; // 1=segunda, 2=terça, 3=quarta (Date.getDay())
const MINUTOS_POR_DIA_CRONOGRAMA = 180;
const DURACAO_ESTUDO = 90;
const DURACAO_QUESTOES_ATIV = 30;
const DURACAO_REVISAO = 30;
const NOMES_DIAS_SEMANA = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];

const TIPO_ATIVIDADE_INFO = {
  estudo: { label: "Estudo", icon: "📖", ordem: 4, cls: "estudo" },
  questoes: { label: `${QUESTOES_POR_TEMA} questões`, icon: "📝", ordem: 5, cls: "questoes" },
  revisao_d1: { label: "Revisão D1", icon: "🔁", ordem: 1, cls: "d1" },
  revisao_d7: { label: "Revisão D7", icon: "🔁", ordem: 2, cls: "d7" },
  revisao_d30: { label: "Revisão D30", icon: "🔁", ordem: 3, cls: "d30" },
};
/* Ordem de urgência usada na timeline do Cronograma (revisões atrasam mais rápido que estudo novo). */
const TIPO_URGENCIA_ORDEM = ["d1", "d7", "d30", "estudo", "questoes"];

function formatRelativeCountdown(dataStr) {
  const dias = diasEntre(todayStr(), dataStr);
  if (dias < 0) return "atrasada";
  if (dias === 0) return "Hoje";
  if (dias === 1) return "Amanhã";
  return `em ${dias} dias`;
}

function normalizeCronograma(parsed) {
  if (!parsed.cronograma || !Array.isArray(parsed.cronograma.atividades)) {
    parsed.cronograma = { atividades: [] };
  }
}

/* ---------- Datas locais (evita erro de timezone do UTC parse) ---------- */
function parseLocalDate(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function formatLocalDate(date) {
  return date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate());
}
function addDaysStr(dateStr, dias) {
  const d = parseLocalDate(dateStr);
  d.setDate(d.getDate() + dias);
  return formatLocalDate(d);
}
function diaDaSemanaNum(dateStr) {
  return parseLocalDate(dateStr).getDay();
}
function ehDiaDisponivel(dateStr) {
  return DIAS_DISPONIVEIS_ESTUDO.includes(diaDaSemanaNum(dateStr));
}
function proximoDiaDisponivel(dateStr) {
  let d = dateStr;
  let guard = 0;
  while (!ehDiaDisponivel(d) && guard < 14) {
    d = addDaysStr(d, 1);
    guard++;
  }
  return d;
}
function segundaDaSemanaDe(dateStr) {
  const d = parseLocalDate(dateStr);
  const dow = d.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + diff);
  return formatLocalDate(d);
}
function formatDuracao(min) {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}h` : `${h}h${pad(m)}`;
}

/* ---------- CRUD de atividades ---------- */
function criarAtividade(temaId, tipo, dataPlanejada, duracaoMin, extra) {
  const atividade = Object.assign(
    {
      id: uid("ativ"),
      temaId,
      tipo,
      dataPlanejada,
      duracaoMin,
      concluida: false,
      dataConclusao: null,
      acertos: null,
      erros: null,
      percentual: null,
      origemDataEstudo: null,
    },
    extra || {}
  );
  state.cronograma.atividades.push(atividade);
  return atividade;
}
function getAtividadesDoTema(temaId) {
  return state.cronograma.atividades.filter((a) => a.temaId === temaId);
}
/* Data individual de estudo do tema: a atividade "estudo" pendente no Cronograma
   (fonte única usada no Checklist, no Cronograma e no Dashboard). */
function getEstudoPendente(temaId) {
  return state.cronograma.atividades.find((a) => a.temaId === temaId && a.tipo === "estudo" && !a.concluida);
}
function getEstudoAtividade(temaId) {
  return state.cronograma.atividades.find((a) => a.temaId === temaId && a.tipo === "estudo");
}
function minutosUsadosNoDia(dataStr) {
  return state.cronograma.atividades
    .filter((a) => a.dataPlanejada === dataStr)
    .reduce((soma, a) => soma + (a.duracaoMin || 0), 0);
}

/* ---------- Agendamento automático do estudo inicial de um tema ---------- */
function agendarEstudoTema(tema) {
  const jaTemEstudo = state.cronograma.atividades.some((a) => a.temaId === tema.id && a.tipo === "estudo");
  if (jaTemEstudo) return;
  let cursor = proximoDiaDisponivel(todayStr());
  let guard = 0;
  while (guard < 500) {
    const usado = minutosUsadosNoDia(cursor);
    if (MINUTOS_POR_DIA_CRONOGRAMA - usado >= DURACAO_ESTUDO + DURACAO_QUESTOES_ATIV) {
      criarAtividade(tema.id, "estudo", cursor, DURACAO_ESTUDO);
      criarAtividade(tema.id, "questoes", cursor, DURACAO_QUESTOES_ATIV);
      return;
    }
    cursor = proximoDiaDisponivel(addDaysStr(cursor, 1));
    guard++;
  }
}

/* ---------- Geração das revisões D1 / D7 / D30 a partir da data real de conclusão ---------- */
function gerarRevisoes(atividadeEstudo) {
  const dataConclusao = atividadeEstudo.dataConclusao;
  if (!dataConclusao) return;
  const specs = [
    { tipo: "revisao_d1", dias: 1 },
    { tipo: "revisao_d7", dias: 7 },
    { tipo: "revisao_d30", dias: 30 },
  ];
  specs.forEach(({ tipo, dias }) => {
    const jaExiste = state.cronograma.atividades.some((a) => a.temaId === atividadeEstudo.temaId && a.tipo === tipo);
    if (jaExiste) return;
    const dataAlvo = proximoDiaDisponivel(addDaysStr(dataConclusao, dias));
    criarAtividade(atividadeEstudo.temaId, tipo, dataAlvo, DURACAO_REVISAO, { origemDataEstudo: dataConclusao });
  });
}

/* ---------- Bootstrap: garante que todo tema (existente ou novo) tenha atividades ---------- */
function bootstrapCronograma() {
  let mudou = false;
  const temasOrdenados = state.temas
    .slice()
    .sort((a, b) => (a.concluido || b.concluido ? 0 : calcularPrioridadeTema(b).score - calcularPrioridadeTema(a).score));
  temasOrdenados.forEach((tema) => {
    const temAtividades = state.cronograma.atividades.some((a) => a.temaId === tema.id);
    if (temAtividades) return;
    mudou = true;
    if (tema.concluido) {
      // Tema já estava marcado como concluído antes deste recurso existir:
      // entra direto no ciclo de revisões, ancorado em hoje.
      const hoje = todayStr();
      const estudo = criarAtividade(tema.id, "estudo", hoje, DURACAO_ESTUDO, { concluida: true, dataConclusao: hoje });
      criarAtividade(tema.id, "questoes", hoje, DURACAO_QUESTOES_ATIV);
      gerarRevisoes(estudo);
    } else {
      agendarEstudoTema(tema);
    }
  });
  if (mudou) saveState();
}

/* ---------- Revisão adaptativa: ajusta a PRÓXIMA revisão pendente conforme o desempenho ----------
   <60% antecipa · 60–79% mantém o intervalo · ≥80% amplia moderadamente.
   Só mexe em revisões futuras (não concluídas) e nunca cria uma nova (evita duplicar). ------- */
function ajustarProximaRevisaoPorDesempenho(temaId, tipoAtual, percentual, dataBase) {
  if (percentual == null || !dataBase) return;
  const proximoTipo = tipoAtual === "revisao_d1" ? "revisao_d7" : tipoAtual === "revisao_d7" ? "revisao_d30" : null;
  if (!proximoTipo) return;
  const proxima = state.cronograma.atividades.find((a) => a.temaId === temaId && a.tipo === proximoTipo && !a.concluida);
  if (!proxima) return;
  const diasPadrao = proximoTipo === "revisao_d7" ? 7 : 30;
  let diasAjustados = diasPadrao;
  if (percentual < 60) diasAjustados = Math.max(1, Math.round(diasPadrao * 0.6));
  else if (percentual >= 80) diasAjustados = Math.round(diasPadrao * 1.25);
  proxima.dataPlanejada = proximoDiaDisponivel(addDaysStr(dataBase, diasAjustados));
}

/* ---------- Ações sobre atividades ---------- */
function concluirAtividade(atividadeId) {
  const atividade = state.cronograma.atividades.find((a) => a.id === atividadeId);
  if (!atividade) return;
  atividade.concluida = true;
  atividade.dataConclusao = todayStr();
  if (atividade.tipo === "estudo") gerarRevisoes(atividade);
  else if (atividade.tipo.indexOf("revisao_") === 0 && atividade.percentual != null) {
    ajustarProximaRevisaoPorDesempenho(atividade.temaId, atividade.tipo, atividade.percentual, atividade.dataConclusao);
  }
  saveState();
  renderCronograma();
  renderDashboard();
  renderDashboardTab();
}
function desfazerAtividade(atividadeId) {
  const atividade = state.cronograma.atividades.find((a) => a.id === atividadeId);
  if (!atividade) return;
  atividade.concluida = false;
  atividade.dataConclusao = null;
  saveState();
  renderCronograma();
}
function registrarAcertosAtividade(atividadeId, valor) {
  const atividade = state.cronograma.atividades.find((a) => a.id === atividadeId);
  if (!atividade) return;
  if (valor === "" || valor == null || Number.isNaN(valor)) {
    atividade.acertos = null;
    atividade.erros = null;
    atividade.percentual = null;
  } else {
    const clamped = Math.max(0, Math.min(QUESTOES_POR_TEMA, Math.round(valor)));
    atividade.acertos = clamped;
    atividade.erros = QUESTOES_POR_TEMA - clamped;
    atividade.percentual = Math.round((clamped / QUESTOES_POR_TEMA) * 100);
    if (atividade.concluida && atividade.tipo.indexOf("revisao_") === 0) {
      ajustarProximaRevisaoPorDesempenho(atividade.temaId, atividade.tipo, atividade.percentual, atividade.dataConclusao);
    }
  }
  saveState();
}

/* ---------- Dica de revisão baseada no desempenho anterior ---------- */
function dicaParaRevisao(temaId) {
  const historico = getAtividadesDoTema(temaId)
    .filter((a) => a.acertos != null)
    .sort((a, b) => (a.dataConclusao || "").localeCompare(b.dataConclusao || ""));
  if (!historico.length) return null;
  const ultima = historico[historico.length - 1];
  if (ultima.erros > 0) {
    return `Foco nos pontos de dificuldade — ${ultima.erros} questão(ões) errada(s) na última tentativa (${ultima.acertos}/${QUESTOES_POR_TEMA} · ${ultima.percentual}%).`;
  }
  return `Última tentativa: ${ultima.acertos}/${QUESTOES_POR_TEMA} acertos (${ultima.percentual}%). Revise os pontos-chave do tema.`;
}

/* ---------- Ordenação por prioridade (atrasadas > D1 > D7 > D30 > novos temas) ---------- */
function ativPrioridadeSort(a, b) {
  const hoje = todayStr();
  const aAtrasada = !a.concluida && a.dataPlanejada < hoje;
  const bAtrasada = !b.concluida && b.dataPlanejada < hoje;
  if (aAtrasada !== bAtrasada) return aAtrasada ? -1 : 1;
  const ordemA = TIPO_ATIVIDADE_INFO[a.tipo] ? TIPO_ATIVIDADE_INFO[a.tipo].ordem : 9;
  const ordemB = TIPO_ATIVIDADE_INFO[b.tipo] ? TIPO_ATIVIDADE_INFO[b.tipo].ordem : 9;
  return ordemA - ordemB;
}

/* ---------- Renderização ---------- */
function renderAtividadeCard(atividade) {
  const tema = getTema(atividade.temaId);
  if (!tema) return "";
  const esp = getEspecialidade(tema.especialidadeId);
  const hoje = todayStr();
  const atrasada = !atividade.concluida && atividade.dataPlanejada < hoje;
  const info = TIPO_ATIVIDADE_INFO[atividade.tipo] || { label: atividade.tipo, icon: "•" };
  const temAcertos = atividade.tipo !== "estudo";
  const ehRevisao = atividade.tipo.indexOf("revisao_") === 0;
  const dica = ehRevisao ? dicaParaRevisao(atividade.temaId) : null;

  return `
    <div class="ativ-card ${atividade.concluida ? "concluida" : ""} ${atrasada ? "atrasada" : ""}" data-ativ-id="${atividade.id}" style="--esp-color:${esp ? esp.cor : "var(--accent)"}">
      <div class="ativ-main">
        <span class="ativ-icon">${info.icon}</span>
        <div class="ativ-info">
          <div class="ativ-title">${escapeHtml(tema.nome)}</div>
          <div class="ativ-meta">
            <span class="ativ-tipo-label ativ-tipo--${info.cls || ""}">${info.label}</span>
            <span class="ativ-duracao">${formatDuracao(atividade.duracaoMin)}</span>
            <span class="ativ-data">${formatDateFull(atividade.dataPlanejada)}</span>
            ${atrasada ? '<span class="ativ-badge ativ-badge-atrasada">Atrasada</span>' : ""}
            ${atividade.concluida ? '<span class="ativ-badge ativ-badge-concluida">✓ Concluída</span>' : ""}
          </div>
          ${dica ? `<div class="ativ-dica">💡 ${escapeHtml(dica)}</div>` : ""}
          ${
            temAcertos
              ? `<div class="ativ-acertos">
                  <label for="acertos-${atividade.id}">Acertos</label>
                  <input type="number" min="0" max="${QUESTOES_POR_TEMA}" id="acertos-${atividade.id}" data-action="registrar-acertos" data-ativ-id="${atividade.id}" value="${atividade.acertos != null ? atividade.acertos : ""}" placeholder="0-${QUESTOES_POR_TEMA}">
                  <span class="ativ-acertos-total">/ ${QUESTOES_POR_TEMA}</span>
                  ${atividade.percentual != null ? `<span class="ativ-pct">${atividade.percentual}%</span>` : ""}
                </div>`
              : ""
          }
        </div>
      </div>
      <div class="ativ-actions">
        ${
          atividade.concluida
            ? `<button class="btn-ativ btn-ativ-undo" data-action="desfazer-ativ" data-ativ-id="${atividade.id}">↺ Desfazer</button>`
            : `<button class="btn-ativ btn-ativ-done" data-action="concluir-ativ" data-ativ-id="${atividade.id}">✓ Concluir</button>`
        }
        <button class="icon-btn" data-action="reagendar-ativ" data-ativ-id="${atividade.id}" title="Reagendar">🔁</button>
        <button class="icon-btn" data-action="editar-ativ" data-ativ-id="${atividade.id}" title="Editar">✏️</button>
        <button class="icon-btn" data-action="trocar-ativ" data-ativ-id="${atividade.id}" title="Trocar tema">🔀</button>
        <button class="icon-btn" data-action="remover-ativ" data-ativ-id="${atividade.id}" title="Remover deste dia">✕</button>
      </div>
    </div>`;
}

function renderAddTemaDiaBtn(dataStr) {
  return `<button type="button" class="btn-add-dia" data-action="add-tema-dia" data-data="${dataStr}">+ Tema</button>`;
}

/* ---------- Linha do tempo visual (próximos 14 dias, sempre visível no Cronograma) ---------- */
function renderCronogramaTimeline() {
  const el = document.getElementById("crono-timeline");
  if (!el) return;
  const hoje = todayStr();
  const atrasadas = state.cronograma.atividades.filter((a) => !a.concluida && a.dataPlanejada < hoje).length;

  const porDia = {};
  state.cronograma.atividades.forEach((a) => {
    if (a.concluida) return;
    (porDia[a.dataPlanejada] = porDia[a.dataPlanejada] || []).push(a);
  });

  const dias = [];
  for (let i = 0; i < 14; i++) dias.push(addDaysStr(hoje, i));

  const pills = dias
    .map((d) => {
      const ativs = porDia[d] || [];
      const isHoje = d === hoje;
      const contagem = {};
      ativs.forEach((a) => {
        const cls = TIPO_ATIVIDADE_INFO[a.tipo] && TIPO_ATIVIDADE_INFO[a.tipo].cls;
        if (cls) contagem[cls] = (contagem[cls] || 0) + 1;
      });
      const dots = TIPO_URGENCIA_ORDEM.filter((cls) => contagem[cls])
        .map((cls) => `<span class="crono-tl-dot crono-tl-dot--${cls}"></span>`)
        .join("");
      const destaqueCls = TIPO_URGENCIA_ORDEM.find((cls) => contagem[cls]);
      const tooltip = ativs.length
        ? `${formatDateFull(d)}: ${ativs.map((a) => (TIPO_ATIVIDADE_INFO[a.tipo] || {}).label || a.tipo).join(", ")}`
        : formatDateFull(d);
      return `
        <button type="button" class="crono-tl-pill ${isHoje ? "hoje" : ""} ${ativs.length ? "" : "vazio"}" data-action="crono-tl-dia" data-date="${d}" title="${escapeHtml(tooltip)}">
          ${ativs.length ? `<span class="crono-tl-count crono-tl-count--${destaqueCls}">${ativs.length}</span>` : ""}
          <span class="crono-tl-dow">${NOMES_DIAS_SEMANA[diaDaSemanaNum(d)].slice(0, 3)}</span>
          <span class="crono-tl-daynum">${pad(parseLocalDate(d).getDate())}</span>
          <span class="crono-tl-dots">${dots}</span>
        </button>`;
    })
    .join("");

  const chipAtrasadas = atrasadas
    ? `<button type="button" class="crono-tl-pill crono-tl-atrasadas" data-action="crono-tl-atrasadas" title="${atrasadas} atividade(s) atrasada(s)">
        <span class="crono-tl-count crono-tl-count--d1">${atrasadas}</span>
        <span class="crono-tl-dow">Atrasadas</span>
        <span class="crono-tl-daynum">⚠️</span>
      </button>`
    : "";

  el.innerHTML = `<div class="crono-timeline-scroll">${chipAtrasadas}${pills}</div>`;
}

const cronoTimelineEl = document.getElementById("crono-timeline");
if (cronoTimelineEl) {
  cronoTimelineEl.addEventListener("click", (e) => {
    if (e.target.closest("[data-action='crono-tl-atrasadas']")) {
      document.querySelector('[data-crono-tab="atrasadas"]').click();
      return;
    }
    const diaBtn = e.target.closest("[data-action='crono-tl-dia']");
    if (diaBtn) {
      const alvo = diaBtn.dataset.date === todayStr() ? "hoje" : "proximas";
      document.querySelector(`[data-crono-tab="${alvo}"]`).click();
    }
  });
}

function renderCronograma() {
  renderCronogramaTimeline();
  const container = document.getElementById("cronograma-content");
  if (!container) return;
  if (ui.cronogramaTab === "hoje") renderCronogramaHoje(container);
  else if (ui.cronogramaTab === "semana") renderCronogramaSemana(container);
  else if (ui.cronogramaTab === "proximas") renderCronogramaProximasRevisoes(container);
  else if (ui.cronogramaTab === "atrasadas") renderCronogramaAtrasadas(container);
  else if (ui.cronogramaTab === "progresso") renderCronogramaProgresso(container);
}

function renderCronogramaHoje(container) {
  const hoje = todayStr();
  const disponivelHoje = ehDiaDisponivel(hoje);
  const doDia = state.cronograma.atividades.filter((a) => a.dataPlanejada === hoje && !a.concluida);
  const atrasadas = disponivelHoje
    ? state.cronograma.atividades.filter((a) => !a.concluida && a.dataPlanejada < hoje)
    : [];
  const todas = atrasadas.concat(doDia).sort(ativPrioridadeSort);
  const totalMin = todas.reduce((s, a) => s + (a.duracaoMin || 0), 0);

  if (!disponivelHoje) {
    container.innerHTML = `
      <div class="crono-day-heading"><span>${NOMES_DIAS_SEMANA[diaDaSemanaNum(hoje)]} — hoje não é dia de estudo programado</span>${renderAddTemaDiaBtn(hoje)}</div>
      <p class="empty-msg">Sua disponibilidade fixa é segunda, terça e quarta. Confira a aba "Atrasadas" caso haja pendências.</p>`;
    return;
  }

  if (todas.length === 0) {
    container.innerHTML = `
      <div class="crono-day-heading"><span>Hoje — ${formatDateFull(hoje)}</span><span class="crono-day-heading-right"><span class="crono-day-total">0 min / ${formatDuracao(MINUTOS_POR_DIA_CRONOGRAMA)}</span>${renderAddTemaDiaBtn(hoje)}</span></div>
      <p class="empty-msg">Nada programado para hoje.</p>`;
    return;
  }

  container.innerHTML = `
    <div class="crono-day-heading">
      <span>Hoje — ${formatDateFull(hoje)}</span>
      <span class="crono-day-heading-right">
        <span class="crono-day-total">${formatDuracao(totalMin)} / ${formatDuracao(MINUTOS_POR_DIA_CRONOGRAMA)}</span>
        ${renderAddTemaDiaBtn(hoje)}
      </span>
    </div>
    <div class="ativ-list">${todas.map(renderAtividadeCard).join("")}</div>`;
}

function renderCronogramaSemana(container) {
  const segunda = segundaDaSemanaDe(todayStr());
  const dias = [segunda, addDaysStr(segunda, 1), addDaysStr(segunda, 2)];
  const nomes = ["Segunda-feira", "Terça-feira", "Quarta-feira"];

  const blocos = dias
    .map((dia, i) => {
      const ativs = state.cronograma.atividades.filter((a) => a.dataPlanejada === dia).sort(ativPrioridadeSort);
      const totalMin = ativs.reduce((s, a) => s + (a.duracaoMin || 0), 0);
      return `
        <div class="crono-day-block">
          <div class="crono-day-heading">
            <span>${nomes[i]} — ${formatDateFull(dia)}${dia === todayStr() ? " · Hoje" : ""}</span>
            <span class="crono-day-heading-right">
              <span class="crono-day-total">${formatDuracao(totalMin)} / ${formatDuracao(MINUTOS_POR_DIA_CRONOGRAMA)}</span>
              ${renderAddTemaDiaBtn(dia)}
            </span>
          </div>
          ${
            ativs.length
              ? `<div class="ativ-list">${ativs.map(renderAtividadeCard).join("")}</div>`
              : '<p class="empty-msg">Nada programado.</p>'
          }
        </div>`;
    })
    .join("");

  container.innerHTML = blocos;
}

function renderCronogramaProximasRevisoes(container) {
  const hoje = todayStr();
  const revisoes = state.cronograma.atividades
    .filter((a) => !a.concluida && a.tipo.indexOf("revisao_") === 0 && a.dataPlanejada >= hoje)
    .sort((a, b) => a.dataPlanejada.localeCompare(b.dataPlanejada) || ativPrioridadeSort(a, b));

  if (!revisoes.length) {
    container.innerHTML = '<p class="empty-msg">Nenhuma revisão futura agendada ainda.</p>';
    return;
  }

  let html = "";
  let lastDate = null;
  revisoes.forEach((a) => {
    if (a.dataPlanejada !== lastDate) {
      const doDia = revisoes.filter((r) => r.dataPlanejada === a.dataPlanejada);
      const contagem = {};
      doDia.forEach((r) => {
        const cls = TIPO_ATIVIDADE_INFO[r.tipo] && TIPO_ATIVIDADE_INFO[r.tipo].cls;
        if (cls) contagem[cls] = (contagem[cls] || 0) + 1;
      });
      const chips = TIPO_URGENCIA_ORDEM.filter((cls) => contagem[cls])
        .map((cls) => `<span class="crono-day-chip crono-day-chip--${cls}">${contagem[cls]}× ${cls.toUpperCase()}</span>`)
        .join("");
      const nomeDia = NOMES_DIAS_SEMANA[diaDaSemanaNum(a.dataPlanejada)].slice(0, 3);
      html += `
        <div class="crono-day-heading" id="crono-dia-${a.dataPlanejada}">
          <span>${nomeDia} · ${formatDateFull(a.dataPlanejada)} · ${formatRelativeCountdown(a.dataPlanejada)}</span>
          <span class="crono-day-heading-right">${chips}</span>
        </div>`;
      lastDate = a.dataPlanejada;
    }
    html += `<div class="ativ-list">${renderAtividadeCard(a)}</div>`;
  });
  container.innerHTML = html;
}

function renderCronogramaAtrasadas(container) {
  const hoje = todayStr();
  const atrasadas = state.cronograma.atividades
    .filter((a) => !a.concluida && a.dataPlanejada < hoje)
    .sort((a, b) => a.dataPlanejada.localeCompare(b.dataPlanejada));

  if (!atrasadas.length) {
    container.innerHTML = '<p class="empty-msg">Nenhuma atividade atrasada. 🎉</p>';
    return;
  }

  container.innerHTML = `<div class="ativ-list">${atrasadas.map(renderAtividadeCard).join("")}</div>`;
}

function renderCronogramaProgresso(container) {
  const ativs = state.cronograma.atividades;
  const temasEstudados = new Set(ativs.filter((a) => a.tipo === "estudo" && a.concluida).map((a) => a.temaId)).size;
  const comAcertos = ativs.filter((a) => a.acertos != null);
  const questoesRealizadas = comAcertos.length;
  const mediaAcertos = questoesRealizadas
    ? Math.round(comAcertos.reduce((s, a) => s + (a.percentual || 0), 0) / questoesRealizadas)
    : 0;
  const d1 = ativs.filter((a) => a.tipo === "revisao_d1" && a.concluida).length;
  const d7 = ativs.filter((a) => a.tipo === "revisao_d7" && a.concluida).length;
  const d30 = ativs.filter((a) => a.tipo === "revisao_d30" && a.concluida).length;
  const hoje = todayStr();
  const atrasadas = ativs.filter((a) => !a.concluida && a.dataPlanejada < hoje).length;

  container.innerHTML = `
    <div class="stat-cards">
      <div class="card stat-card stat-card--total">
        <span class="stat-value">${temasEstudados}</span>
        <span class="stat-label">Temas estudados</span>
      </div>
      <div class="card stat-card stat-card--scheduled">
        <span class="stat-value">${questoesRealizadas}</span>
        <span class="stat-label">Ciclos de questões registrados</span>
      </div>
      <div class="card stat-card stat-card--done">
        <span class="stat-value">${mediaAcertos}%</span>
        <span class="stat-label">Média de acertos</span>
      </div>
      <div class="card stat-card stat-card--pending">
        <span class="stat-value">${atrasadas}</span>
        <span class="stat-label">Revisões atrasadas</span>
      </div>
      <div class="card stat-card stat-card--total">
        <span class="stat-value">${d1}</span>
        <span class="stat-label">Revisões D1 concluídas</span>
      </div>
      <div class="card stat-card stat-card--total">
        <span class="stat-value">${d7}</span>
        <span class="stat-label">Revisões D7 concluídas</span>
      </div>
      <div class="card stat-card stat-card--total">
        <span class="stat-value">${d30}</span>
        <span class="stat-label">Revisões D30 concluídas</span>
      </div>
    </div>`;
}

/* ---------- Navegação entre abas principais (Checklist / Cronograma) ---------- */
document.querySelectorAll(".main-tab").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".main-tab").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    const view = btn.dataset.view;
    document.getElementById("view-checklist").classList.toggle("hidden", view !== "checklist");
    document.getElementById("view-cronograma").classList.toggle("hidden", view !== "cronograma");
    document.getElementById("view-dashboard").classList.toggle("hidden", view !== "dashboard");
    if (view === "cronograma") renderCronograma();
    else if (view === "dashboard") renderDashboardTab();
  });
});

document.getElementById("cronograma-tabs").addEventListener("click", (e) => {
  const btn = e.target.closest(".filter-btn");
  if (!btn) return;
  document.querySelectorAll("#cronograma-tabs .filter-btn").forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
  ui.cronogramaTab = btn.dataset.cronoTab;
  renderCronograma();
});

/* ---------- Ações sobre atividades (delegação de eventos) ---------- */
const cronogramaContent = document.getElementById("cronograma-content");
cronogramaContent.addEventListener("click", (e) => {
  const addBtn = e.target.closest("[data-action='add-tema-dia']");
  if (addBtn) {
    openAdicionarTemaDia(addBtn.dataset.data);
    return;
  }
  const btn = e.target.closest("[data-ativ-id]");
  if (!btn || !btn.dataset.action) return;
  const ativId = btn.dataset.ativId;
  const action = btn.dataset.action;
  if (action === "concluir-ativ") concluirAtividade(ativId);
  else if (action === "desfazer-ativ") desfazerAtividade(ativId);
  else if (action === "reagendar-ativ" || action === "editar-ativ") openEditarAtividade(ativId);
  else if (action === "trocar-ativ") openTrocarTemaDia(ativId);
  else if (action === "remover-ativ") removerAtividadeDoDia(ativId);
});

cronogramaContent.addEventListener("change", (e) => {
  if (e.target.dataset.action === "registrar-acertos") {
    const ativId = e.target.dataset.ativId;
    const valor = e.target.value === "" ? null : parseInt(e.target.value, 10);
    registrarAcertosAtividade(ativId, valor);
    renderCronograma();
  }
});

/* ---------- Modal: Editar / Reagendar atividade ---------- */
const modalAtividade = document.getElementById("modal-atividade");
const formAtividade = document.getElementById("form-atividade");

function openEditarAtividade(atividadeId) {
  const atividade = state.cronograma.atividades.find((a) => a.id === atividadeId);
  if (!atividade) return;
  const tema = getTema(atividade.temaId);
  const info = TIPO_ATIVIDADE_INFO[atividade.tipo] || { label: atividade.tipo };
  document.getElementById("atividade-id").value = atividade.id;
  document.getElementById("atividade-modal-info").textContent = `${tema ? tema.nome : ""} — ${info.label}`;
  document.getElementById("atividade-data").value = atividade.dataPlanejada;
  document.getElementById("atividade-duracao").value = atividade.duracaoMin;
  modalAtividade.classList.remove("hidden");
}

document.getElementById("btn-cancel-atividade").addEventListener("click", () => modalAtividade.classList.add("hidden"));

formAtividade.addEventListener("submit", (e) => {
  e.preventDefault();
  const id = document.getElementById("atividade-id").value;
  const novaData = document.getElementById("atividade-data").value;
  const novaDuracao = parseInt(document.getElementById("atividade-duracao").value, 10);
  const atividade = state.cronograma.atividades.find((a) => a.id === id);
  if (!atividade) return;
  if (novaData) atividade.dataPlanejada = novaData;
  if (novaDuracao) atividade.duracaoMin = novaDuracao;
  saveState();
  modalAtividade.classList.add("hidden");
  renderAll();
  showToast("Atividade atualizada.");
});

/* ---------- Remover tema de um dia do Cronograma (não apaga o tema nem seu progresso) ---------- */
function removerAtividadeDoDia(ativId) {
  const atividade = state.cronograma.atividades.find((a) => a.id === ativId);
  if (!atividade) return;
  const tema = getTema(atividade.temaId);
  if (!confirm(`Remover "${tema ? tema.nome : "este tema"}" deste dia? O tema e seu progresso continuam salvos.`)) return;
  state.cronograma.atividades = state.cronograma.atividades.filter((a) => a.id !== ativId);
  saveState();
  renderAll();
  showToast("Removido deste dia.");
}

/* ---------- Modal: Adicionar / Trocar tema em um dia do Cronograma ---------- */
const modalDiaTema = document.getElementById("modal-dia-tema");
const formDiaTema = document.getElementById("form-dia-tema");
const selectDiaTema = document.getElementById("dia-tema-select");

function fillDiaTemaSelect(excluirTemaId) {
  const html = state.especialidades
    .map((esp) => {
      const temas = state.temas.filter((t) => t.especialidadeId === esp.id && t.id !== excluirTemaId);
      if (!temas.length) return "";
      const opts = temas
        .map((t) => `<option value="${t.id}">${escapeHtml(t.nome)}${t.concluido ? " (concluído)" : ""}</option>`)
        .join("");
      return `<optgroup label="${escapeHtml(esp.nome)}">${opts}</optgroup>`;
    })
    .join("");
  selectDiaTema.innerHTML = html;
}

function openAdicionarTemaDia(dataStr) {
  fillDiaTemaSelect(null);
  document.getElementById("modal-dia-tema-title").textContent = "Adicionar tema ao dia";
  document.getElementById("dia-tema-data-label").textContent = formatDateFull(dataStr);
  document.getElementById("dia-tema-modo").value = "adicionar";
  document.getElementById("dia-tema-data").value = dataStr;
  document.getElementById("dia-tema-ativ-id").value = "";
  modalDiaTema.classList.remove("hidden");
}

function openTrocarTemaDia(ativId) {
  const atividade = state.cronograma.atividades.find((a) => a.id === ativId);
  if (!atividade) return;
  fillDiaTemaSelect(atividade.temaId);
  document.getElementById("modal-dia-tema-title").textContent = "Trocar tema";
  document.getElementById("dia-tema-data-label").textContent = formatDateFull(atividade.dataPlanejada);
  document.getElementById("dia-tema-modo").value = "trocar";
  document.getElementById("dia-tema-data").value = atividade.dataPlanejada;
  document.getElementById("dia-tema-ativ-id").value = ativId;
  modalDiaTema.classList.remove("hidden");
}

document.getElementById("btn-cancel-dia-tema").addEventListener("click", () => modalDiaTema.classList.add("hidden"));

formDiaTema.addEventListener("submit", (e) => {
  e.preventDefault();
  const modo = document.getElementById("dia-tema-modo").value;
  const dataStr = document.getElementById("dia-tema-data").value;
  const temaId = selectDiaTema.value;
  if (!temaId) return;

  if (modo === "adicionar") {
    const existente = getEstudoPendente(temaId);
    if (existente) {
      existente.dataPlanejada = dataStr;
      showToast("Tema já estava programado — movido para este dia.");
    } else {
      criarAtividade(temaId, "estudo", dataStr, DURACAO_ESTUDO);
      criarAtividade(temaId, "questoes", dataStr, DURACAO_QUESTOES_ATIV);
      showToast("Tema adicionado a este dia.");
    }
  } else if (modo === "trocar") {
    const ativId = document.getElementById("dia-tema-ativ-id").value;
    const atividade = state.cronograma.atividades.find((a) => a.id === ativId);
    if (!atividade) return;
    atividade.temaId = temaId;
    atividade.concluida = false;
    atividade.dataConclusao = null;
    atividade.acertos = null;
    atividade.erros = null;
    atividade.percentual = null;
    showToast("Tema trocado.");
  }

  saveState();
  modalDiaTema.classList.add("hidden");
  renderAll();
});

/* ============================================================
   SINCRONIZAÇÃO ENTRE DISPOSITIVOS (GitHub Gist)
   Guarda uma cópia do state num Gist secreto do GitHub. Cada aparelho
   com o mesmo token consegue puxar/enviar os dados. Token e ID do gist
   ficam fora do `state` (chaves próprias no localStorage), então nunca
   entram no backup exportado nem no próprio conteúdo sincronizado.
   Estratégia: last-write-wins por `state.updatedAt`. ------- */
const GH_TOKEN_KEY = "checklist_residencia_gh_token";
const GH_GIST_ID_KEY = "checklist_residencia_gh_gist_id";
const GH_SYNC_FILENAME = "checklist-residencia-sync.json";
const GH_SYNC_DEBOUNCE_MS = 4000;

let syncApplyingRemote = false;
let syncAutoTimer = null;
let syncEmAndamento = false;

function getGhToken() {
  return (localStorage.getItem(GH_TOKEN_KEY) || "").trim();
}
function setGhToken(token) {
  if (token) localStorage.setItem(GH_TOKEN_KEY, token);
  else localStorage.removeItem(GH_TOKEN_KEY);
}
function getGhGistId() {
  return localStorage.getItem(GH_GIST_ID_KEY) || "";
}
function setGhGistId(id) {
  if (id) localStorage.setItem(GH_GIST_ID_KEY, id);
  else localStorage.removeItem(GH_GIST_ID_KEY);
}
function syncConfigurado() {
  return !!getGhToken();
}

function setSyncStatus(msg, isError) {
  const el = document.getElementById("sync-status");
  if (!el) return;
  el.textContent = msg;
  el.classList.toggle("sync-error", !!isError);
}

async function ghApi(path, options) {
  const resp = await fetch("https://api.github.com" + path, {
    ...options,
    headers: {
      Authorization: "token " + getGhToken(),
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      ...(options && options.headers),
    },
  });
  if (!resp.ok) {
    const body = await resp.text().catch(() => "");
    let msg = body;
    try {
      msg = JSON.parse(body).message || body;
    } catch (e) {}
    throw new Error(`GitHub API ${resp.status}: ${msg.slice(0, 200)}`);
  }
  return resp.json();
}

/* Procura, entre os gists da própria conta, um que já tenha o arquivo de
   sincronização — assim o 2º/3º aparelho encontra o mesmo gist do 1º
   automaticamente, em vez de criar um gist novo e isolado pra cada um. */
async function encontrarGistExistente() {
  const gists = await ghApi("/gists", { method: "GET" });
  const achado = gists.find((g) => g.files && g.files[GH_SYNC_FILENAME]);
  return achado ? achado.id : null;
}

async function resolverGistId() {
  let gistId = getGhGistId();
  if (gistId) return gistId;
  gistId = await encontrarGistExistente();
  if (gistId) setGhGistId(gistId);
  return gistId;
}

async function pushParaGithub() {
  if (!syncConfigurado()) return;
  const conteudo = JSON.stringify(state, null, 0);
  const gistId = await resolverGistId();
  if (!gistId) {
    const criado = await ghApi("/gists", {
      method: "POST",
      body: JSON.stringify({
        description: "Checklist Residência Médica — sincronização automática",
        public: false,
        files: { [GH_SYNC_FILENAME]: { content: conteudo } },
      }),
    });
    setGhGistId(criado.id);
  } else {
    await ghApi("/gists/" + gistId, {
      method: "PATCH",
      body: JSON.stringify({ files: { [GH_SYNC_FILENAME]: { content: conteudo } } }),
    });
  }
}

/* Ignora qualquer gist existente (local ou achado por busca) e cria um novo
   já com os dados atuais deste aparelho — usado pra "resetar" a sincronização
   quando sobrou gist antigo/errado de tentativas anteriores. */
async function criarGistNovoForcado() {
  if (!syncConfigurado()) {
    showToast("Cole seu token do GitHub em Configurações primeiro.");
    return;
  }
  setSyncStatus("Criando gist novo...");
  try {
    const conteudo = JSON.stringify(state, null, 0);
    const criado = await ghApi("/gists", {
      method: "POST",
      body: JSON.stringify({
        description: "Checklist Residência Médica — sincronização automática",
        public: false,
        files: { [GH_SYNC_FILENAME]: { content: conteudo } },
      }),
    });
    setGhGistId(criado.id);
    const gistIdInput = document.getElementById("gh-gistid-input");
    if (gistIdInput) gistIdInput.value = criado.id;
    setSyncStatus("Gist novo criado. Copie o Gist ID acima e cole nos outros aparelhos antes de sincronizar lá.");
    showToast("Gist novo criado com os dados deste aparelho.");
  } catch (e) {
    console.error(e);
    setSyncStatus("Erro: " + e.message, true);
  }
}

/* Traz os dados do gist e substitui os locais sem comparar updatedAt —
   usado quando o "mais novo por data" não é o correto (ex.: aparelho com
   dados incompletos que teve o updatedAt atualizado por engano). */
async function forcarPuxarDoGithub() {
  if (!syncConfigurado()) {
    showToast("Cole seu token do GitHub em Configurações primeiro.");
    return;
  }
  if (!confirm("Isso vai substituir os dados deste aparelho pelos que estão no GitHub. Continuar?")) return;
  setSyncStatus("Puxando do GitHub...");
  try {
    const remoto = await puxarDoGithub();
    if (!remoto) {
      setSyncStatus("Nenhum gist encontrado com esse token/Gist ID.", true);
      return;
    }
    aplicarEstadoRemoto(remoto);
    setSyncStatus("Dados substituídos pelos do GitHub.");
  } catch (e) {
    console.error(e);
    setSyncStatus("Erro: " + e.message, true);
  }
}

async function puxarDoGithub() {
  const gistId = await resolverGistId();
  if (!gistId) return null;
  const gist = await ghApi("/gists/" + gistId, { method: "GET" });
  const file = gist.files && gist.files[GH_SYNC_FILENAME];
  if (!file || !file.content) return null;
  return JSON.parse(file.content);
}

function agendarSyncAutomatico() {
  if (!syncConfigurado() || syncApplyingRemote) return;
  clearTimeout(syncAutoTimer);
  syncAutoTimer = setTimeout(() => {
    pushParaGithub().catch((e) => console.error("Falha ao sincronizar com o GitHub:", e));
  }, GH_SYNC_DEBOUNCE_MS);
}

/* Substitui o state local pelos dados vindos do gist e re-renderiza. */
function aplicarEstadoRemoto(remoto) {
  syncApplyingRemote = true;
  state = remoto;
  normalizeConfig(state);
  normalizeTemas(state.temas);
  normalizeCronograma(state);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  syncApplyingRemote = false;
  renderAll();
  setSyncStatus("Dados atualizados a partir de outro aparelho.");
  showToast("Dados sincronizados do GitHub.");
}

async function sincronizarAgora() {
  if (!syncConfigurado()) {
    showToast("Cole seu token do GitHub em Configurações primeiro.");
    return;
  }
  if (syncEmAndamento) return;
  syncEmAndamento = true;
  setSyncStatus("Sincronizando...");
  try {
    const remoto = await puxarDoGithub();
    if (!remoto) {
      await pushParaGithub();
      setSyncStatus("Sincronizado agora (primeiro envio).");
    } else if ((remoto.updatedAt || 0) > (state.updatedAt || 0)) {
      aplicarEstadoRemoto(remoto);
    } else if ((state.updatedAt || 0) > (remoto.updatedAt || 0)) {
      await pushParaGithub();
      setSyncStatus("Sincronizado agora (enviado deste aparelho).");
    } else {
      setSyncStatus("Já estava tudo sincronizado.");
    }
  } catch (e) {
    console.error(e);
    setSyncStatus("Erro: " + e.message, true);
  } finally {
    syncEmAndamento = false;
  }
}

/* Checagem silenciosa: só atualiza a tela se realmente vier algo mais novo,
   sem escrever "Sincronizando..." nem mexer em nada quando não há novidade. */
async function checarAtualizacaoSilenciosa() {
  if (!syncConfigurado() || syncEmAndamento) return;
  syncEmAndamento = true;
  try {
    const remoto = await puxarDoGithub();
    if (remoto && (remoto.updatedAt || 0) > (state.updatedAt || 0)) {
      aplicarEstadoRemoto(remoto);
    }
  } catch (e) {
    console.error("Falha na checagem periódica do GitHub:", e);
  } finally {
    syncEmAndamento = false;
  }
}

/* Puxa uma vez ao abrir o app, sem travar o primeiro render local. */
function pullDoGithubNaInicializacao() {
  if (!syncConfigurado()) return;
  puxarDoGithub()
    .then((remoto) => {
      if (remoto && (remoto.updatedAt || 0) > (state.updatedAt || 0)) {
        aplicarEstadoRemoto(remoto);
      } else {
        setSyncStatus(getGhGistId() ? "Sincronizado." : "Ainda não sincronizado.");
      }
    })
    .catch((e) => {
      console.error("Falha ao puxar do GitHub na inicialização:", e);
      setSyncStatus("Erro: " + e.message, true);
    });
}

/* Checa periodicamente enquanto o app está aberto (a cada 1 min, só com a aba
   visível) e também assim que a aba volta a ficar visível — assim quem deixa
   o app aberto vê as mudanças de outro aparelho sem precisar recarregar. */
const GH_POLL_INTERVAL_MS = 60000;
function iniciarSyncPeriodico() {
  setInterval(() => {
    if (document.visibilityState === "visible") checarAtualizacaoSilenciosa();
  }, GH_POLL_INTERVAL_MS);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") checarAtualizacaoSilenciosa();
  });
}

const ghTokenInput = document.getElementById("gh-token-input");
const ghGistIdInput = document.getElementById("gh-gistid-input");
const btnSyncAgora = document.getElementById("btn-sync-agora");
const btnSyncForcarNovo = document.getElementById("btn-sync-forcar-novo");
const btnSyncForcarPuxar = document.getElementById("btn-sync-forcar-puxar");
const btnSyncDesconectar = document.getElementById("btn-sync-desconectar");

if (ghTokenInput) {
  ghTokenInput.addEventListener("change", (e) => {
    setGhToken(e.target.value.trim());
    setSyncStatus(syncConfigurado() ? "Token salvo. Toque em Sincronizar agora." : "Nenhum token salvo.");
  });
}
if (ghGistIdInput) {
  ghGistIdInput.addEventListener("change", (e) => setGhGistId(e.target.value.trim()));
}
function lerCamposSyncAntesDeAgir() {
  if (ghTokenInput && ghTokenInput.value.trim()) setGhToken(ghTokenInput.value.trim());
  if (ghGistIdInput) setGhGistId(ghGistIdInput.value.trim());
}
if (btnSyncAgora) {
  btnSyncAgora.addEventListener("click", () => {
    lerCamposSyncAntesDeAgir();
    sincronizarAgora();
  });
}
if (btnSyncForcarNovo) {
  btnSyncForcarNovo.addEventListener("click", () => {
    lerCamposSyncAntesDeAgir();
    criarGistNovoForcado();
  });
}
if (btnSyncForcarPuxar) {
  btnSyncForcarPuxar.addEventListener("click", () => {
    lerCamposSyncAntesDeAgir();
    forcarPuxarDoGithub();
  });
}
if (btnSyncDesconectar) {
  btnSyncDesconectar.addEventListener("click", () => {
    setGhToken("");
    setGhGistId("");
    if (ghTokenInput) ghTokenInput.value = "";
    if (ghGistIdInput) ghGistIdInput.value = "";
    setSyncStatus("Desconectado deste aparelho.");
    showToast("Sincronização removida deste aparelho (o gist no GitHub não foi apagado).");
  });
}

/* ============================================================
   GOOGLE CALENDAR INTEGRATION (Google Identity Services)
   ============================================================ */
let tokenClient = null;
let accessToken = null;
let tokenExpiry = 0;
let calendarListCache = null;
let googleInitAttempted = false;

function initGoogleClient() {
  if (googleInitAttempted) return;
  googleInitAttempted = true;
  if (typeof google === "undefined" || !google.accounts || !google.accounts.oauth2) {
    // A biblioteca do Google ainda não carregou (ou está bloqueada); tenta novamente mais tarde.
    setTimeout(() => {
      googleInitAttempted = false;
      initGoogleClient();
    }, 1500);
    return;
  }
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: GOOGLE_CLIENT_ID,
    scope: GOOGLE_SCOPES,
    callback: () => {}, // sobrescrito a cada chamada em requestAccessToken()
  });
}

function requestAccessToken(promptMode) {
  return new Promise((resolve, reject) => {
    if (!tokenClient) {
      reject(new Error("Cliente do Google ainda não está pronto."));
      return;
    }
    tokenClient.callback = (resp) => {
      if (resp.error) {
        reject(resp);
        return;
      }
      accessToken = resp.access_token;
      tokenExpiry = Date.now() + resp.expires_in * 1000;
      resolve(accessToken);
    };
    tokenClient.requestAccessToken({ prompt: promptMode });
  });
}

async function getValidToken() {
  if (accessToken && Date.now() < tokenExpiry - 60000) return accessToken;
  return requestAccessToken("");
}

async function connectGoogleFlow() {
  if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID === "COLE_SEU_CLIENT_ID_AQUI") {
    showToast("Configure o GOOGLE_CLIENT_ID em script.js para usar o Google Agenda.");
    throw new Error("Client ID não configurado");
  }
  if (!tokenClient) initGoogleClient();
  await requestAccessToken("consent");
  state.config.googleConnected = true;
  saveState();
  await fetchCalendarList();
}

document.getElementById("btn-connect-google").addEventListener("click", async () => {
  const statusEl = document.getElementById("google-status");
  try {
    statusEl.textContent = "Conectando...";
    await connectGoogleFlow();
    refreshSettingsUI();
    showToast("Conectado ao Google Agenda.");
  } catch (err) {
    console.error(err);
    statusEl.textContent = "Não foi possível conectar ao Google.";
  }
});

async function fetchCalendarList() {
  const token = await getValidToken();
  const res = await fetch("https://www.googleapis.com/calendar/v3/users/me/calendarList?minAccessRole=writer", {
    headers: { Authorization: "Bearer " + token },
  });
  if (!res.ok) throw new Error("Falha ao listar agendas do Google.");
  const data = await res.json();
  calendarListCache = data.items || [];
  populateCalendarSelect(calendarListCache);
  return calendarListCache;
}

function populateCalendarSelect(calendars) {
  const select = document.getElementById("calendar-select");
  select.innerHTML = calendars
    .map((c) => `<option value="${c.id}">${escapeHtml(c.summary)}${c.primary ? " (principal)" : ""}</option>`)
    .join("");
  if (state.config.selectedCalendarId && calendars.some((c) => c.id === state.config.selectedCalendarId)) {
    select.value = state.config.selectedCalendarId;
  } else if (calendars.length) {
    const primary = calendars.find((c) => c.primary) || calendars[0];
    select.value = primary.id;
    state.config.selectedCalendarId = primary.id;
    state.config.selectedCalendarName = primary.summary;
    saveState();
  }
}

document.getElementById("calendar-select").addEventListener("change", (e) => {
  const select = e.target;
  const selected = calendarListCache.find((c) => c.id === select.value);
  state.config.selectedCalendarId = select.value;
  state.config.selectedCalendarName = selected ? selected.summary : select.value;
  saveState();
  showToast("Agenda selecionada: " + state.config.selectedCalendarName);
});

function toRFC3339(dateStr, timeStr) {
  return `${dateStr}T${timeStr}:00`;
}

function buildEventBody(tema) {
  const start = toRFC3339(tema.dataEstudo, tema.horario);
  const startDate = new Date(start);
  const endDate = new Date(startDate.getTime() + (tema.duracaoMin || 60) * 60000);
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return {
    summary: `Estudo — ${tema.nome}`,
    description: "Checklist Residência Médica",
    start: { dateTime: start, timeZone },
    end: { dateTime: endDate.toISOString().slice(0, 19), timeZone },
  };
}

async function createGoogleEvent(tema) {
  const token = await getValidToken();
  const calendarId = state.config.selectedCalendarId;
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
    {
      method: "POST",
      headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
      body: JSON.stringify(buildEventBody(tema)),
    }
  );
  if (!res.ok) throw new Error("Falha ao criar evento no Google Agenda.");
  const created = await res.json();
  tema.eventId = created.id;
  tema.calendarId = calendarId;
}

async function updateGoogleEvent(tema) {
  const token = await getValidToken();
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(tema.calendarId)}/events/${encodeURIComponent(tema.eventId)}`,
    {
      method: "PATCH",
      headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
      body: JSON.stringify(buildEventBody(tema)),
    }
  );
  if (!res.ok) throw new Error("Falha ao atualizar evento no Google Agenda.");
}

async function deleteGoogleEvent(tema) {
  const token = await getValidToken();
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(tema.calendarId)}/events/${encodeURIComponent(tema.eventId)}`,
    { method: "DELETE", headers: { Authorization: "Bearer " + token } }
  );
  if (!res.ok && res.status !== 410 && res.status !== 404) {
    throw new Error("Falha ao excluir evento no Google Agenda.");
  }
  tema.eventId = null;
  tema.calendarId = null;
}

/* ============================================================
   PRIORIDADE INTELIGENTE
   score = 40% incidência + 30% deficiência + 20% revisão + 10% urgência da prova
   ============================================================ */
function diasEntre(dataInicioStr, dataFimStr) {
  const a = parseLocalDate(dataInicioStr);
  const b = parseLocalDate(dataFimStr);
  return Math.round((b - a) / 86400000);
}

function getIncidenciaTema(tema, prova) {
  if (!tema.incidencia) return 0;
  if (prova === "personalizada" || prova === "ambas") {
    return Math.round(((tema.incidencia.fmabc || 0) + (tema.incidencia.susSp || 0)) / 2);
  }
  return tema.incidencia[prova] || 0;
}

/* Classificação visual da incidência (independente dos 3 níveis de prioridade). */
function classificarIncidencia(score) {
  if (score >= 85) return { label: "Muito alta", emoji: "🔥", cls: "muito-alta" };
  if (score >= 70) return { label: "Alta", emoji: "", cls: "alta" };
  if (score >= 50) return { label: "Média", emoji: "", cls: "media" };
  if (score >= 30) return { label: "Baixa", emoji: "", cls: "baixa" };
  return { label: "Muito baixa", emoji: "", cls: "muito-baixa" };
}

/* Info completa de incidência para um tema na prova ativa, incluindo destaque
   quando "Ambas" e o tema tem alta incidência simultânea nas duas provas. */
function getIncidenciaInfo(tema) {
  const prova = state.config.provaPrincipal || "fmabc";
  const fmabc = (tema.incidencia && tema.incidencia.fmabc) || 0;
  const susSp = (tema.incidencia && tema.incidencia.susSp) || 0;
  const temDados = fmabc > 0 || susSp > 0;
  const valor = getIncidenciaTema(tema, prova);
  const destaqueAmbas = prova === "ambas" && fmabc >= 70 && susSp >= 70;
  return { valor, fmabc, susSp, temDados, destaqueAmbas, prova, classe: classificarIncidencia(valor) };
}

function getDesempenhoRecenteTema(temaId) {
  const hist = getAtividadesDoTema(temaId)
    .filter((a) => a.percentual != null)
    .sort((a, b) => (a.dataConclusao || "").localeCompare(b.dataConclusao || ""));
  return hist.length ? hist[hist.length - 1].percentual : null;
}

function getRevisaoInfoTema(temaId) {
  const hoje = todayStr();
  const pendentes = getAtividadesDoTema(temaId).filter((a) => !a.concluida && a.tipo.indexOf("revisao_") === 0);
  if (!pendentes.length) return { score: 0, label: "Nenhuma revisão pendente" };
  pendentes.sort((a, b) => a.dataPlanejada.localeCompare(b.dataPlanejada));
  const proxima = pendentes[0];
  const diffDias = diasEntre(hoje, proxima.dataPlanejada);
  const nomeTipo = TIPO_ATIVIDADE_INFO[proxima.tipo] ? TIPO_ATIVIDADE_INFO[proxima.tipo].label : proxima.tipo;
  const score = diffDias < 0 ? 100 : Math.max(0, 100 - diffDias * 15);
  const label = diffDias < 0 ? `${nomeTipo} atrasada` : diffDias === 0 ? `${nomeTipo} hoje` : `${nomeTipo} em ${diffDias}d`;
  return { score, label };
}

function getUrgenciaProva() {
  if (!state.config.dataProva) return { score: 0, label: "Data da prova não definida" };
  const diffDias = diasEntre(todayStr(), state.config.dataProva);
  if (diffDias <= 0) return { score: 100, label: "Prova hoje/atrasada" };
  const score = Math.max(0, 100 - diffDias * 2);
  return { score, label: score >= 60 ? "Prova próxima" : "Prova distante" };
}

function calcularPrioridadeTema(tema) {
  const prova = state.config.provaPrincipal || "fmabc";
  const incInfo = getIncidenciaInfo(tema);
  const desempenho = getDesempenhoRecenteTema(tema.id);
  const deficiencia = desempenho != null ? 100 - desempenho : 50;
  const revInfo = getRevisaoInfoTema(tema.id);
  const provaInfo = getUrgenciaProva();
  let scoreRaw = 0.4 * incInfo.valor + 0.3 * deficiencia + 0.2 * revInfo.score + 0.1 * provaInfo.score;
  if (incInfo.destaqueAmbas) scoreRaw += 5;
  const score = Math.max(0, Math.min(100, Math.round(scoreRaw)));
  const nivel = score >= 70 ? "Alta" : score >= 40 ? "Média" : "Baixa";
  const nomeProva = prova === "fmabc" ? "FMABC" : prova === "susSp" ? "SUS-SP" : prova === "ambas" ? "Ambas" : "Personalizada";

  const motivoPartes = [];
  if (incInfo.temDados) motivoPartes.push(`${incInfo.classe.emoji ? incInfo.classe.emoji + " " : ""}incidência ${incInfo.classe.label.toLowerCase()}`);
  if (desempenho != null) motivoPartes.push(`desempenho ${desempenho}%`);
  if (revInfo.score > 0) motivoPartes.push(revInfo.label.toLowerCase());
  const motivo = motivoPartes.join(" · ") || "sem histórico ainda";

  return {
    score,
    nivel,
    incidenciaVal: incInfo.valor,
    incidenciaClasse: incInfo.classe,
    incidenciaFmabc: incInfo.fmabc,
    incidenciaSusSp: incInfo.susSp,
    incidenciaTemDados: incInfo.temDados,
    destaqueAmbas: incInfo.destaqueAmbas,
    nomeProva,
    desempenho,
    revisaoLabel: revInfo.label,
    provaLabel: provaInfo.label,
    motivo,
  };
}

/* ---------- Modal: detalhe da prioridade ---------- */
const modalPrioridade = document.getElementById("modal-prioridade");

function openPrioridadeModal(temaId) {
  const tema = getTema(temaId);
  if (!tema) return;
  const prio = calcularPrioridadeTema(tema);
  document.getElementById("prioridade-tema-nome").textContent = `${tema.nome} — Prioridade ${prio.score} (${prio.nivel})`;
  document.getElementById("prioridade-fatores").innerHTML = `
    <div class="prioridade-fator"><span>Incidência (${escapeHtml(prio.nomeProva)})</span><strong>${prio.incidenciaClasse.emoji} ${prio.incidenciaClasse.label}</strong></div>
    ${prio.incidenciaTemDados ? `<div class="prioridade-fator prioridade-fator-sub"><span>SUS-SP ${prio.incidenciaSusSp} · FMABC ${prio.incidenciaFmabc}</span></div>` : ""}
    ${prio.destaqueAmbas ? `<div class="prioridade-fator prioridade-fator-sub"><span>⭐ Alta incidência nas duas provas</span></div>` : ""}
    <div class="prioridade-fator"><span>Desempenho</span><strong>${prio.desempenho != null ? prio.desempenho + "%" : "Sem dados"}</strong></div>
    <div class="prioridade-fator"><span>Revisão</span><strong>${escapeHtml(prio.revisaoLabel)}</strong></div>
    <div class="prioridade-fator"><span>Prova</span><strong>${escapeHtml(prio.provaLabel)}</strong></div>
  `;
  modalPrioridade.classList.remove("hidden");
}
const btnClosePrioridade = document.getElementById("btn-close-prioridade");
if (btnClosePrioridade) btnClosePrioridade.addEventListener("click", () => modalPrioridade.classList.add("hidden"));

/* ============================================================
   DASHBOARD (aba)
   ============================================================ */
const AREA_MAP = {
  Cardiologia: "Clínica Médica",
  "Terapia Intensiva": "Clínica Médica",
  Hepatologia: "Clínica Médica",
  Endocrinologia: "Clínica Médica",
  Neurologia: "Clínica Médica",
  Pneumologia: "Clínica Médica",
  Nefrologia: "Clínica Médica",
  Reumatologia: "Clínica Médica",
  Hematologia: "Clínica Médica",
  Infectologia: "Clínica Médica",
  "Medicina Preventiva / Epidemiologia": "Preventiva",
  "Toxicologia / Urgências": "Preventiva",
  Psiquiatria: "Preventiva",
  Cirurgia: "Cirurgia",
  "Ginecologia e Obstetrícia": "GO",
  Pediatria: "Pediatria",
};
const AREAS_DASHBOARD = ["Cirurgia", "Clínica Médica", "Pediatria", "GO", "Preventiva"];
const AREA_CORES = {
  Cirurgia: "#dc2626",
  "Clínica Médica": "#2563eb",
  Pediatria: "#0ea5e9",
  GO: "#ec4899",
  Preventiva: "#16a34a",
};

function getAreaDaEspecialidade(nomeEsp) {
  return AREA_MAP[nomeEsp] || null;
}

function calcularDesempenhoPorArea() {
  const acc = {};
  AREAS_DASHBOARD.forEach((a) => (acc[a] = { somaPct: 0, countPct: 0, concluidos: 0, total: 0 }));
  state.temas.forEach((t) => {
    const esp = getEspecialidade(t.especialidadeId);
    const area = esp ? getAreaDaEspecialidade(esp.nome) : null;
    if (!area || !acc[area]) return;
    acc[area].total++;
    if (t.concluido) acc[area].concluidos++;
  });
  state.cronograma.atividades.forEach((a) => {
    if (a.percentual == null) return;
    const tema = getTema(a.temaId);
    const esp = tema ? getEspecialidade(tema.especialidadeId) : null;
    const area = esp ? getAreaDaEspecialidade(esp.nome) : null;
    if (!area || !acc[area]) return;
    acc[area].somaPct += a.percentual;
    acc[area].countPct++;
  });
  return AREAS_DASHBOARD.map((area) => {
    const r = acc[area];
    const pct = r.countPct > 0 ? Math.round(r.somaPct / r.countPct) : r.total > 0 ? Math.round((r.concluidos / r.total) * 100) : 0;
    return { area, pct, total: r.total, concluidos: r.concluidos };
  });
}

/* ---------- Temas prioritários (top 5, com filtros e ordenação) ---------- */
function renderDashPrioEspecialidadeOptions() {
  const select = document.getElementById("dash-prio-especialidade");
  if (!select) return;
  const current = select.value || ui.dashPrio.especialidade;
  const options = ['<option value="todas">Todas as especialidades</option>'];
  state.especialidades.forEach((e) => options.push(`<option value="${e.id}">${escapeHtml(e.nome)}</option>`));
  select.innerHTML = options.join("");
  select.value = state.especialidades.some((e) => e.id === current) ? current : "todas";
  ui.dashPrio.especialidade = select.value;
}

function passaFiltroDashPrio(tema, prio) {
  const f = ui.dashPrio;
  if (f.especialidade !== "todas" && tema.especialidadeId !== f.especialidade) return false;
  if (f.status === "pendentes" && tema.concluido) return false;
  if (f.status === "concluidos" && !tema.concluido) return false;
  if (f.incidencia !== "todas" && prio.incidenciaClasse.cls !== f.incidencia) return false;
  if (f.revisao === "pendente" && prio.revisaoLabel === "Nenhuma revisão pendente") return false;
  if (f.revisao === "atrasada" && prio.revisaoLabel.indexOf("atrasada") === -1) return false;
  if (f.desempenho === "baixo" && (prio.desempenho == null || prio.desempenho >= 60)) return false;
  if (f.desempenho === "sem-dados" && prio.desempenho != null) return false;
  return true;
}

function ordenarDashPrio(lista) {
  const modo = ui.dashPrio.ordenar;
  if (modo === "incidencia") return lista.sort((a, b) => b.prio.incidenciaVal - a.prio.incidenciaVal);
  if (modo === "desempenho") {
    return lista.sort((a, b) => (a.prio.desempenho == null ? -1 : a.prio.desempenho) - (b.prio.desempenho == null ? -1 : b.prio.desempenho));
  }
  if (modo === "atraso") {
    return lista.sort((a, b) => {
      const aAtr = a.prio.revisaoLabel.indexOf("atrasada") !== -1 ? 1 : 0;
      const bAtr = b.prio.revisaoLabel.indexOf("atrasada") !== -1 ? 1 : 0;
      return bAtr - aAtr || b.prio.score - a.prio.score;
    });
  }
  if (modo === "cronologica") {
    return lista.sort((a, b) => (a.tema.dataEstudo || "9999") .localeCompare(b.tema.dataEstudo || "9999"));
  }
  return lista.sort((a, b) => b.prio.score - a.prio.score);
}

function renderDashTopPrioritarios() {
  const container = document.getElementById("dash-top-prioritarios");
  if (!container) return;
  renderDashPrioEspecialidadeOptions();

  const candidatos = state.temas
    .map((tema) => ({ tema, prio: calcularPrioridadeTema(tema) }))
    .filter(({ tema, prio }) => passaFiltroDashPrio(tema, prio));

  const ordenados = ordenarDashPrio(candidatos).slice(0, 5);

  if (!ordenados.length) {
    container.innerHTML = '<p class="empty-msg">Nenhum tema encontrado com esses filtros.</p>';
    return;
  }

  container.innerHTML = ordenados
    .map(({ tema, prio }, i) => {
      const esp = getEspecialidade(tema.especialidadeId);
      return `
        <div class="dash-prio-item ${prio.destaqueAmbas ? "destaque" : ""}" data-action="ver-prioridade-dash" data-tema-id="${tema.id}">
          <span class="dash-prio-rank">${i + 1}</span>
          <div class="dash-prio-body">
            <div class="dash-prio-top">
              <span class="dash-prio-nome">${escapeHtml(tema.nome)}</span>
              <span class="dash-prio-score">${prio.score}</span>
            </div>
            <div class="dash-prio-motivo">${esp ? escapeHtml(esp.nome) + " · " : ""}${escapeHtml(prio.motivo)}</div>
          </div>
        </div>`;
    })
    .join("");
}

const dashPrioListEl = document.getElementById("dash-top-prioritarios");
if (dashPrioListEl) {
  dashPrioListEl.addEventListener("click", (e) => {
    const item = e.target.closest("[data-action='ver-prioridade-dash']");
    if (item) openPrioridadeModal(item.dataset.temaId);
  });
}

["dash-prio-especialidade", "dash-prio-incidencia", "dash-prio-status", "dash-prio-revisao", "dash-prio-desempenho", "dash-prio-ordenar"].forEach(
  (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("change", (e) => {
      const chave = id.replace("dash-prio-", "");
      ui.dashPrio[chave] = e.target.value;
      renderDashTopPrioritarios();
    });
  }
);

function renderDashStatCards() {
  const container = document.getElementById("dash-stat-cards");
  if (!container) return;
  const ativs = state.cronograma.atividades;
  const hoje = todayStr();

  const estudados = new Set(ativs.filter((a) => a.tipo === "estudo" && a.concluida).map((a) => a.temaId)).size;
  const atrasados = ativs.filter((a) => !a.concluida && a.dataPlanejada < hoje).length;
  const concluidos = state.temas.filter((t) => t.concluido).length;
  const comAcertos = ativs.filter((a) => a.percentual != null);
  const acertoMedio = comAcertos.length ? Math.round(comAcertos.reduce((s, a) => s + a.percentual, 0) / comAcertos.length) : 0;
  const questoesRespondidas = comAcertos.length * QUESTOES_POR_TEMA;
  const minutosConcluidos = ativs.filter((a) => a.concluida).reduce((s, a) => s + (a.duracaoMin || 0), 0);
  const horas = (minutosConcluidos / 60).toFixed(1).replace(".0", "");

  const cards = [
    { valor: estudados, label: "Estudados", variante: "total" },
    { valor: atrasados, label: "Atrasados", variante: "pending" },
    { valor: concluidos, label: "Concluídos", variante: "done" },
    { valor: acertoMedio + "%", label: "Acerto médio", variante: "done" },
    { valor: questoesRespondidas, label: "Questões", variante: "scheduled" },
    { valor: horas + "h", label: "Horas", variante: "total" },
  ];
  container.innerHTML = cards
    .map(
      (c) => `
      <div class="card stat-card stat-card--${c.variante}">
        <span class="stat-value">${c.valor}</span>
        <span class="stat-label">${c.label}</span>
      </div>`
    )
    .join("");
}

function renderDashAreaGrid() {
  const container = document.getElementById("dash-area-grid");
  if (!container) return;
  const dados = calcularDesempenhoPorArea();
  container.innerHTML = dados
    .map(
      (d) => `
      <div class="dash-area-card">
        <div class="dash-area-nome">${escapeHtml(d.area)}</div>
        <div class="dash-area-pct">${d.pct}%</div>
        <div class="dash-area-outer"><div class="dash-area-fill" style="width:${d.pct}%;background:${AREA_CORES[d.area] || "var(--accent)"}"></div></div>
        <div class="dash-area-sub">${d.concluidos}/${d.total} temas concluídos</div>
      </div>`
    )
    .join("");
}

function renderDashHeatmap() {
  const container = document.getElementById("dash-heatmap");
  if (!container) return;
  const hoje = todayStr();
  const dias = [];
  for (let i = 97; i >= 0; i--) dias.push(addDaysStr(hoje, -i));

  const contagem = {};
  state.cronograma.atividades.forEach((a) => {
    if (a.concluida && a.dataConclusao) contagem[a.dataConclusao] = (contagem[a.dataConclusao] || 0) + 1;
  });
  const max = Math.max(1, ...Object.values(contagem));

  const cells = dias
    .map((d) => {
      const c = contagem[d] || 0;
      const razao = c / max;
      const nivel = c === 0 ? 0 : razao <= 0.25 ? 1 : razao <= 0.5 ? 2 : razao <= 0.75 ? 3 : 4;
      return `<span class="dash-heat-cell dash-heat-${nivel}" title="${formatDateFull(d)}: ${c} atividade(s)"></span>`;
    })
    .join("");

  container.innerHTML = `
    <div class="dash-heat-grid">${cells}</div>
    <div class="dash-heat-legend"><span>Menos</span>
      <span class="dash-heat-cell dash-heat-0"></span><span class="dash-heat-cell dash-heat-1"></span>
      <span class="dash-heat-cell dash-heat-2"></span><span class="dash-heat-cell dash-heat-3"></span>
      <span class="dash-heat-cell dash-heat-4"></span><span>Mais</span>
    </div>`;
}

ui.dashCalendarioOffset = 0;

function renderDashCalendario() {
  const container = document.getElementById("dash-calendario");
  if (!container) return;
  const hoje = todayStr();
  const base = parseLocalDate(hoje);
  base.setDate(1);
  base.setMonth(base.getMonth() + ui.dashCalendarioOffset);
  const ano = base.getFullYear();
  const mes = base.getMonth();
  const primeiroDiaSemana = new Date(ano, mes, 1).getDay();
  const diasNoMes = new Date(ano, mes + 1, 0).getDate();
  const nomeMes = base.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  const porDia = {};
  state.cronograma.atividades.forEach((a) => {
    (porDia[a.dataPlanejada] = porDia[a.dataPlanejada] || []).push(a);
  });

  let html = `
    <div class="dash-cal-header">
      <button type="button" class="dash-cal-nav" data-cal-nav="-1">‹</button>
      <span>${escapeHtml(nomeMes)}</span>
      <button type="button" class="dash-cal-nav" data-cal-nav="1">›</button>
    </div>
    <div class="dash-cal-grid">`;
  ["D", "S", "T", "Q", "Q", "S", "S"].forEach((d) => (html += `<div class="dash-cal-dow">${d}</div>`));
  for (let i = 0; i < primeiroDiaSemana; i++) html += `<div class="dash-cal-cell dash-cal-empty"></div>`;
  for (let d = 1; d <= diasNoMes; d++) {
    const dataStr = `${ano}-${pad(mes + 1)}-${pad(d)}`;
    const ativsDia = (porDia[dataStr] || []).sort(ativPrioridadeSort);
    const isHoje = dataStr === hoje;
    const visiveis = ativsDia.slice(0, 3);
    const chips = visiveis
      .map((a) => {
        const atrasada = !a.concluida && a.dataPlanejada < hoje;
        const ehEstudo = a.tipo === "estudo" || a.tipo === "questoes";
        const cls = a.concluida ? "concluido" : atrasada ? "atrasado" : ehEstudo ? "estudo" : "revisao";
        const tema = getTema(a.temaId);
        const nome = tema ? tema.nome : "";
        const info = TIPO_ATIVIDADE_INFO[a.tipo] || {};
        return `<button type="button" class="dash-cal-chip dash-cal-chip--${cls}" data-action="abrir-tema-cal" data-tema-id="${a.temaId}" title="${escapeHtml(info.label || "")}${info.label ? " — " : ""}${escapeHtml(nome)}">${info.icon || ""} ${escapeHtml(nome)}</button>`;
      })
      .join("");
    const extra = ativsDia.length > 3 ? `<span class="dash-cal-more">+${ativsDia.length - 3} mais</span>` : "";
    html += `<div class="dash-cal-cell ${isHoje ? "dash-cal-hoje" : ""}"><span class="dash-cal-daynum">${d}</span><div class="dash-cal-chips">${chips}${extra}</div></div>`;
  }
  html += `</div>`;
  container.innerHTML = html;
}

const dashCalendarioEl = document.getElementById("dash-calendario");
if (dashCalendarioEl) {
  dashCalendarioEl.addEventListener("click", (e) => {
    const navBtn = e.target.closest("[data-cal-nav]");
    if (navBtn) {
      ui.dashCalendarioOffset += parseInt(navBtn.dataset.calNav, 10);
      renderDashCalendario();
      return;
    }
    const chip = e.target.closest("[data-action='abrir-tema-cal']");
    if (chip) openEditTema(chip.dataset.temaId);
  });
}

function renderDashPainel() {
  const container = document.getElementById("dash-painel");
  if (!container) return;
  const hoje = todayStr();
  const naoConcluidas = state.cronograma.atividades.filter((a) => !a.concluida);

  const doHoje = naoConcluidas.filter((a) => a.dataPlanejada === hoje).sort(ativPrioridadeSort);
  const atrasadas = naoConcluidas.filter((a) => a.dataPlanejada < hoje).sort((a, b) => a.dataPlanejada.localeCompare(b.dataPlanejada));
  const proximas = naoConcluidas
    .filter((a) => a.dataPlanejada > hoje)
    .sort((a, b) => a.dataPlanejada.localeCompare(b.dataPlanejada))
    .slice(0, 8);

  const renderCol = (titulo, lista) => {
    if (!lista.length) return `<div class="dash-panel-col"><div class="dash-panel-col-title">${titulo}</div><p class="empty-msg">Nada aqui.</p></div>`;
    const itens = lista
      .slice(0, 8)
      .map((a) => {
        const tema = getTema(a.temaId);
        if (!tema) return "";
        const info = TIPO_ATIVIDADE_INFO[a.tipo] || { label: a.tipo };
        return `<div class="dash-panel-item" data-action="abrir-tema-painel" data-tema-id="${tema.id}">
          <span class="dash-panel-item-nome">${escapeHtml(tema.nome)}</span>
          <span class="dash-panel-item-meta">${escapeHtml(info.label)}</span>
        </div>`;
      })
      .join("");
    return `<div class="dash-panel-col"><div class="dash-panel-col-title">${titulo} (${lista.length})</div>${itens}</div>`;
  };

  container.innerHTML =
    renderCol("Hoje", doHoje) + renderCol("Atrasadas", atrasadas) + renderCol("Próximas", proximas);
}

const dashPainelEl = document.getElementById("dash-painel");
if (dashPainelEl) {
  dashPainelEl.addEventListener("click", (e) => {
    const item = e.target.closest("[data-action='abrir-tema-painel']");
    if (item) openEditTema(item.dataset.temaId);
  });
}

function renderDashboardTab() {
  const viewDashboard = document.getElementById("view-dashboard");
  if (!viewDashboard || viewDashboard.classList.contains("hidden")) return;
  const provaSelect = document.getElementById("dash-prova-select");
  if (provaSelect) provaSelect.value = state.config.provaPrincipal || "fmabc";
  renderDashTopPrioritarios();
  renderDashStatCards();
  renderDashAreaGrid();
  renderDashHeatmap();
  renderDashCalendario();
  renderDashPainel();
}

/* ============================================================
   ASSISTENTE DE ESTUDOS (100% local — lê apenas os dados já
   existentes em `state`; nenhuma chamada de rede, nenhuma IA
   generativa/externa, nenhuma chave de API).
   ============================================================ */
function calcularDesempenhoPorEspecialidade() {
  const acc = {};
  state.especialidades.forEach((e) => {
    acc[e.id] = { nome: e.nome, somaPct: 0, countPct: 0, concluidos: 0, total: 0 };
  });
  state.temas.forEach((t) => {
    if (!acc[t.especialidadeId]) return;
    acc[t.especialidadeId].total++;
    if (t.concluido) acc[t.especialidadeId].concluidos++;
  });
  state.cronograma.atividades.forEach((a) => {
    if (a.percentual == null) return;
    const tema = getTema(a.temaId);
    if (!tema || !acc[tema.especialidadeId]) return;
    acc[tema.especialidadeId].somaPct += a.percentual;
    acc[tema.especialidadeId].countPct++;
  });
  return Object.values(acc)
    .filter((r) => r.total > 0)
    .map((r) => ({
      nome: r.nome,
      pct: r.countPct > 0 ? Math.round(r.somaPct / r.countPct) : Math.round((r.concluidos / r.total) * 100),
      temDadosDeAcerto: r.countPct > 0,
      concluidos: r.concluidos,
      total: r.total,
    }));
}

function respostaEstudarHoje() {
  const hoje = todayStr();
  if (!ehDiaDisponivel(hoje)) {
    const atrasadas = state.cronograma.atividades.filter((a) => !a.concluida && a.dataPlanejada < hoje);
    if (!atrasadas.length) {
      return `Hoje (${NOMES_DIAS_SEMANA[diaDaSemanaNum(hoje)]}) não é dia de estudo programado (sua rotina é segunda, terça e quarta) e você não tem nada atrasado. 🎉`;
    }
    return `Hoje não é dia de estudo programado na sua rotina, mas você tem ${atrasadas.length} atividade(s) atrasada(s). Pergunte "o que está atrasado?" para ver a lista.`;
  }
  const doDia = state.cronograma.atividades.filter((a) => a.dataPlanejada === hoje && !a.concluida);
  const atrasadas = state.cronograma.atividades.filter((a) => !a.concluida && a.dataPlanejada < hoje);
  const todas = atrasadas.concat(doDia).sort(ativPrioridadeSort);
  if (!todas.length) return `Nada programado para hoje (${formatDateFull(hoje)}). Aproveite para adiantar uma revisão futura.`;
  const linhas = todas.slice(0, 8).map((a) => {
    const tema = getTema(a.temaId);
    const info = TIPO_ATIVIDADE_INFO[a.tipo] || {};
    const atrasada = a.dataPlanejada < hoje;
    return `${info.icon || "•"} ${info.label || a.tipo} — ${tema ? tema.nome : "?"}${atrasada ? " (atrasada)" : ""}`;
  });
  const extra = todas.length > 8 ? `\n...e mais ${todas.length - 8}.` : "";
  return `🗓️ Hoje (${formatDateFull(hoje)}) você tem ${todas.length} atividade(s):\n\n${linhas.join("\n")}${extra}`;
}

function respostaAtrasados() {
  const hoje = todayStr();
  const atrasadas = state.cronograma.atividades
    .filter((a) => !a.concluida && a.dataPlanejada < hoje)
    .sort((a, b) => a.dataPlanejada.localeCompare(b.dataPlanejada));
  if (!atrasadas.length) return "Nenhuma atividade atrasada. 🎉 Você está em dia!";
  const linhas = atrasadas.slice(0, 10).map((a) => {
    const tema = getTema(a.temaId);
    const info = TIPO_ATIVIDADE_INFO[a.tipo] || {};
    const dias = diasEntre(a.dataPlanejada, hoje);
    return `${info.icon || "•"} ${tema ? tema.nome : "?"} — ${info.label} (${dias}d atrasado, previsto ${formatDateFull(a.dataPlanejada)})`;
  });
  const extra = atrasadas.length > 10 ? `\n...e mais ${atrasadas.length - 10}.` : "";
  return `⚠️ Você tem ${atrasadas.length} atividade(s) atrasada(s):\n\n${linhas.join("\n")}${extra}`;
}

function respostaRevisoesHoje() {
  const hoje = todayStr();
  const revisoes = state.cronograma.atividades.filter(
    (a) => !a.concluida && a.tipo.indexOf("revisao_") === 0 && a.dataPlanejada === hoje
  );
  if (!revisoes.length) return "Nenhuma revisão marcada para hoje.";
  const linhas = revisoes.map((a) => {
    const tema = getTema(a.temaId);
    const info = TIPO_ATIVIDADE_INFO[a.tipo] || {};
    return `🔁 ${info.label} — ${tema ? tema.nome : "?"}`;
  });
  return `Você tem ${revisoes.length} revisão(ões) hoje:\n\n${linhas.join("\n")}`;
}

function respostaPioresTemas() {
  const comDados = state.temas
    .map((t) => ({ tema: t, desempenho: getDesempenhoRecenteTema(t.id) }))
    .filter((x) => x.desempenho != null)
    .sort((a, b) => a.desempenho - b.desempenho);
  if (!comDados.length) {
    return "Ainda não há registros de acertos suficientes para eu avaliar seu desempenho por tema. Responda questões nas atividades do Cronograma para eu conseguir te ajudar aqui.";
  }
  const linhas = comDados.slice(0, 5).map(({ tema, desempenho }) => {
    const esp = getEspecialidade(tema.especialidadeId);
    return `📉 ${tema.nome}${esp ? " (" + esp.nome + ")" : ""} — ${desempenho}%`;
  });
  return `Seus temas com pior desempenho recente:\n\n${linhas.join("\n")}\n\nVale focar a revisão nesses.`;
}

function respostaEspecialidadePior() {
  const dados = calcularDesempenhoPorEspecialidade().filter((d) => d.temDadosDeAcerto);
  if (!dados.length) {
    return "Ainda não há questões respondidas o suficiente por especialidade para eu identificar onde focar. Responda mais questões nas atividades do Cronograma.";
  }
  dados.sort((a, b) => a.pct - b.pct);
  const pior = dados[0];
  const outras = dados
    .slice(1, 4)
    .map((d) => `${d.nome}: ${d.pct}%`)
    .join(" · ");
  return `🎯 A especialidade que mais precisa de atenção é ${pior.nome}, com ${pior.pct}% de acerto médio (${pior.concluidos}/${pior.total} temas concluídos).${outras ? "\n\nOutras especialidades: " + outras : ""}`;
}

function respostaPlanejamentoSemana() {
  const segunda = segundaDaSemanaDe(todayStr());
  const dias = [segunda, addDaysStr(segunda, 1), addDaysStr(segunda, 2)];
  const nomes = ["Segunda-feira", "Terça-feira", "Quarta-feira"];
  const blocos = dias.map((dia, i) => {
    const ativs = state.cronograma.atividades.filter((a) => a.dataPlanejada === dia).sort(ativPrioridadeSort);
    if (!ativs.length) return `${nomes[i]} (${formatDateFull(dia)}): nada programado.`;
    const linhas = ativs.map((a) => {
      const tema = getTema(a.temaId);
      const info = TIPO_ATIVIDADE_INFO[a.tipo] || {};
      return `  ${info.icon || "•"} ${info.label} — ${tema ? tema.nome : "?"}`;
    });
    return `${nomes[i]} (${formatDateFull(dia)}):\n${linhas.join("\n")}`;
  });
  return `📅 Seu planejamento desta semana:\n\n${blocos.join("\n\n")}`;
}

function respostaAnaliseDesempenho() {
  const total = state.temas.length;
  const concluidos = state.temas.filter((t) => t.concluido).length;
  const pct = total > 0 ? Math.round((concluidos / total) * 100) : 0;
  const hoje = todayStr();
  const atrasadas = state.cronograma.atividades.filter((a) => !a.concluida && a.dataPlanejada < hoje).length;
  const revisoesPendentes = state.cronograma.atividades.filter(
    (a) => !a.concluida && a.tipo.indexOf("revisao_") === 0
  ).length;
  const comAcertos = state.cronograma.atividades.filter((a) => a.percentual != null);
  const mediaAcertos = comAcertos.length
    ? Math.round(comAcertos.reduce((s, a) => s + a.percentual, 0) / comAcertos.length)
    : null;
  const dados = calcularDesempenhoPorEspecialidade().filter((d) => d.temDadosDeAcerto);
  let linhaEsp = "";
  if (dados.length) {
    dados.sort((a, b) => a.pct - b.pct);
    linhaEsp = `\n\nEspecialidade que mais precisa de atenção: ${dados[0].nome} (${dados[0].pct}%).`;
    if (dados.length > 1) {
      const melhor = dados[dados.length - 1];
      linhaEsp += ` Melhor desempenho: ${melhor.nome} (${melhor.pct}%).`;
    }
  }
  return `📊 Análise geral:\n\n• ${concluidos}/${total} temas concluídos (${pct}%)\n• ${atrasadas} atividade(s) atrasada(s)\n• ${revisoesPendentes} revisão(ões) pendente(s)\n• Média de acertos: ${
    mediaAcertos != null ? mediaAcertos + "%" : "sem dados ainda"
  }${linhaEsp}`;
}

function normalizarTextoAssistente(str) {
  return (str || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

/* Cada "chave" é uma string (precisa aparecer na pergunta) ou um array de
   strings (todas precisam aparecer, em qualquer ordem/posição) — assim
   frases como "quais revisões tenho hoje" batem mesmo com palavras no meio. */
const AI_ASSISTANT_INTENTS = [
  { chaves: [["planejamento", "semana"], ["planeje", "semana"], ["cronograma", "semana"], ["semana", "inteira"]], handler: respostaPlanejamentoSemana },
  { chaves: [["revis", "hoje"]], handler: respostaRevisoesHoje },
  { chaves: ["atrasad", "atraso"], handler: respostaAtrasados },
  { chaves: ["pior", "piores", "fraco", "fracos", "dificuldade"], handler: respostaPioresTemas },
  { chaves: ["especialidade", ["area", "atencao"], ["onde", "foca"]], handler: respostaEspecialidadePior },
  { chaves: ["analis", ["desempenho", "geral"], "resumo", "progresso"], handler: respostaAnaliseDesempenho },
  { chaves: [["estudar", "hoje"], ["hoje", "devo"], ["fazer", "hoje"], ["programado", "hoje"], ["agenda", "hoje"], "devo estudar"], handler: respostaEstudarHoje },
];

function chaveBateNoTexto(chave, q) {
  if (Array.isArray(chave)) return chave.every((parte) => q.includes(parte));
  return q.includes(chave);
}

/* Roteador de intenção por palavras-chave (sem IA generativa/externa —
   apenas casamento de padrões em texto e consulta aos dados locais). */
function responderAssistente(perguntaOriginal) {
  const q = normalizarTextoAssistente(perguntaOriginal);
  if (!q) return "Pode repetir a pergunta?";
  if (/^(oi|ola|opa|bom dia|boa tarde|boa noite|eae|e ai)\b/.test(q)) {
    return "Olá! 👋 Posso te ajudar com: o que estudar hoje, o que está atrasado, suas revisões de hoje, temas mais fracos, qual especialidade precisa de atenção, seu planejamento da semana, ou uma análise geral do desempenho. O que você quer saber?";
  }
  if (/obrigad/.test(q)) return "Disponha! Bons estudos. 📚";
  for (const intent of AI_ASSISTANT_INTENTS) {
    if (intent.chaves.some((c) => chaveBateNoTexto(c, q))) return intent.handler();
  }
  return "Não entendi essa pergunta ainda. Tente uma destas:\n\n• O que devo estudar hoje?\n• O que está atrasado?\n• Quais revisões tenho hoje?\n• Em quais temas estou pior?\n• Qual especialidade precisa de mais atenção?\n• Monte meu planejamento da semana.\n• Analise meu desempenho.";
}

const AI_SUGESTOES = [
  "O que devo estudar hoje?",
  "O que está atrasado?",
  "Quais revisões tenho hoje?",
  "Em quais temas estou pior?",
  "Qual especialidade precisa de mais atenção?",
  "Monte meu planejamento da semana.",
  "Analise meu desempenho.",
];

let aiChatHistorico = [];
let aiChatAberto = false;

const modalAiAssistant = document.getElementById("modal-ai-assistant");
const aiChatMessagesEl = document.getElementById("ai-chat-messages");
const aiChatSuggestionsEl = document.getElementById("ai-chat-suggestions");
const aiChatForm = document.getElementById("ai-chat-form");
const aiChatInput = document.getElementById("ai-chat-input");

function renderAiChatMessages() {
  if (!aiChatMessagesEl) return;
  aiChatMessagesEl.innerHTML = aiChatHistorico
    .map((m) => `<div class="ai-chat-msg ai-chat-msg--${m.role}">${escapeHtml(m.text)}</div>`)
    .join("");
  aiChatMessagesEl.scrollTop = aiChatMessagesEl.scrollHeight;
}

function renderAiSuggestions() {
  if (!aiChatSuggestionsEl) return;
  aiChatSuggestionsEl.innerHTML = AI_SUGESTOES.map(
    (s) => `<button type="button" class="ai-chat-chip" data-pergunta="${escapeHtml(s)}">${escapeHtml(s)}</button>`
  ).join("");
}

function abrirAiAssistant() {
  if (!modalAiAssistant) return;
  if (!aiChatAberto) {
    aiChatHistorico.push({
      role: "bot",
      text: "Olá! 👋 Sou seu assistente de estudos local — analiso os dados já salvos aqui no app (nada é enviado para fora). Toque numa pergunta abaixo ou digite a sua.",
    });
    renderAiSuggestions();
    aiChatAberto = true;
  }
  renderAiChatMessages();
  modalAiAssistant.classList.remove("hidden");
  if (aiChatInput) aiChatInput.focus();
}

const btnAiAssistant = document.getElementById("btn-ai-assistant");
if (btnAiAssistant) btnAiAssistant.addEventListener("click", abrirAiAssistant);

const btnCloseAiAssistant = document.getElementById("btn-close-ai-assistant");
if (btnCloseAiAssistant) {
  btnCloseAiAssistant.addEventListener("click", () => modalAiAssistant.classList.add("hidden"));
}

function enviarPerguntaAssistente(texto) {
  const pergunta = (texto || "").trim();
  if (!pergunta || !aiChatMessagesEl) return;
  aiChatHistorico.push({ role: "user", text: pergunta });
  renderAiChatMessages();
  if (aiChatInput) aiChatInput.value = "";

  aiChatMessagesEl.insertAdjacentHTML(
    "beforeend",
    `<div class="ai-chat-msg ai-chat-msg--bot" id="ai-chat-typing"><span class="ai-chat-typing"><span></span><span></span><span></span></span></div>`
  );
  aiChatMessagesEl.scrollTop = aiChatMessagesEl.scrollHeight;

  setTimeout(() => {
    const resposta = responderAssistente(pergunta);
    const typingEl = document.getElementById("ai-chat-typing");
    if (typingEl) typingEl.remove();
    aiChatHistorico.push({ role: "bot", text: resposta });
    renderAiChatMessages();
  }, 450);
}

if (aiChatForm) {
  aiChatForm.addEventListener("submit", (e) => {
    e.preventDefault();
    enviarPerguntaAssistente(aiChatInput.value);
  });
}

if (aiChatSuggestionsEl) {
  aiChatSuggestionsEl.addEventListener("click", (e) => {
    const chip = e.target.closest("[data-pergunta]");
    if (chip) enviarPerguntaAssistente(chip.dataset.pergunta);
  });
}

/* ============================================================
   FECHAR MODAIS CLICANDO NO OVERLAY
   ============================================================ */
document.querySelectorAll(".modal-overlay").forEach((overlay) => {
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.classList.add("hidden");
  });
});

/* ============================================================
   INIT
   ============================================================ */
addMissingTemas();
seedIncidenciaIniciais();
bootstrapCronograma();
renderAll();
initGoogleClient();
pullDoGithubNaInicializacao();
iniciarSyncPeriodico();
