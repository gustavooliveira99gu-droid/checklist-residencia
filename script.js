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
  });
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
  }));

  return {
    especialidades,
    temas,
    config: {
      googleConnected: false,
      selectedCalendarId: null,
      selectedCalendarName: null,
    },
  };
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
    if (!parsed.config) parsed.config = { googleConnected: false, selectedCalendarId: null, selectedCalendarName: null };
    normalizeTemas(parsed.temas);
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
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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
}

function renderDashboard() {
  const total = state.temas.length;
  const done = state.temas.filter((t) => t.concluido).length;
  const pending = total - done;
  const scheduled = state.temas.filter((t) => isProgramado(t) && !t.concluido).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  document.getElementById("progress-title").textContent = `${done} / ${total} temas`;
  document.getElementById("progress-percent").textContent = `${pct}% concluído`;
  document.getElementById("progress-bar-fill").style.width = pct + "%";

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
  else if (action === "questoes") toggleQuestoesPanel(temaId);
});

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
  selectEspecialidade.value = tema.especialidadeId;
  modalTema.classList.remove("hidden");
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
    };
    state.temas.push(novoTema);
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

function refreshSettingsUI() {
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
      if (!parsed.config) parsed.config = { googleConnected: false, selectedCalendarId: null, selectedCalendarName: null };
      normalizeTemas(parsed.temas);
      state = parsed;
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
renderAll();
initGoogleClient();
