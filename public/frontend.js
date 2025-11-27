// ==========================================================
// =============== FRONTEND.JS - VENDA+ =====================
// ==========================================================
// Conecta FRONT-END (HTML) com BACK-END (Express + MySQL)
// ==========================================================

// ==========================================================
// SIDEBAR TOGGLE (funciona em todas as páginas do painel)
// ==========================================================
document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.getElementById("menu-toggle");
  const wrapper = document.getElementById("dashboard-wrapper");
  if (toggleBtn && wrapper) {
    toggleBtn.addEventListener("click", () => {
      wrapper.classList.toggle("collapsed");
    });
  }
});
// ==========================================================
// 1 - HELPERS COMUNS
// ==========================================================

// Exibe mensagens temporárias de sucesso/erro
function flash(msg, type = "success", ms = 4000) {
  const box = document.getElementById("feedbackMessage");
  if (!box) return;
  box.innerHTML = `<div class="alert alert-${type}">${msg}</div>`;
  setTimeout(() => (box.innerHTML = ""), ms);
}

// Remove classes de validação dos inputs
function limparValidacoes() {
  document
    .querySelectorAll(".is-valid, .is-invalid")
    .forEach((el) => el.classList.remove("is-valid", "is-invalid"));
}
// Apenas números em certos campos
function aplicarMascaraNumerica(ids = []) {
  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (el)
      el.addEventListener("input", () => {
        el.value = el.value.replace(/\D/g, "");
      });
  });
}
// Detecta qual página está ativa
const paginaAtual = window.location.pathname.split("/").pop();

// ==========================================================
// 2️ - LOGIN
// ==========================================================
function inicializarLogin() {
  const formLogin = document.getElementById("formLogin");
  if (!formLogin) return;

  formLogin.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value.trim();

    if (!email || !senha) {
      alert("⚠️ Por favor, preencha todos os campos.");
      return;
    }

    try {
      const resp = await fetch("http://projetovendamais-production.up.railway.app/api/vendedor/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });

      const data = await resp.json();
      if (resp.ok) {
        alert("✅ Login realizado com sucesso!");
        window.location.href = "dashboard.html";
      } else {
        alert("❌ " + data.message);
      }
    } catch {
      alert("Erro de conexão com o servidor.");
    }
  });
}
// ==========================================================
// 3️ - CLIENTES (CRUD + Validações + Paginação)
// ==========================================================
function inicializarCadastroClientes() {
  console.log("✅ Página: cadastro-cliente.html detectada");

  const form = document.getElementById("clienteForm");
  const tabela = document.getElementById("listaClientesBody");
  const cancelarBtn = document.getElementById("cancelarBtn");
  const submitBtn = document.getElementById("submitBtn");

  if (!form) return;

  let todosClientes = [];
  let filtrados = [];
  let clienteEditando = null;
  let currentPage = 1;
  const pageSize = 10;

  // ==========================================================
  // VALIDAÇÕES
  // ==========================================================
  const camposRegras = {
    clienteNome: (v) => v.trim() !== "",
    clienteCpf: (v) => /^\d{11}$/.test(v),
    clienteNascimento: (v) => v.trim() !== "",
    clienteGenero: (v) => v.trim() !== "",
    clienteCep: (v) => /^\d{8}$/.test(v),
    clienteEndereco: (v) => v.trim() !== "",
    clienteNumero: (v) => v.trim() !== "",
    clienteBairro: (v) => v.trim() !== "",
    clienteCidade: (v) => v.trim() !== "",
    clienteEstado: (v) => v.trim() !== "",
    clienteTelefone1: (v) => /^\d{10,11}$/.test(v),
    clienteTelefone2: (v) => v.trim() === "" || /^\d{10,11}$/.test(v), // OPCIONAL
    clienteEmail: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
  };
  // ==========================================================
  // 🏠 VIA CEP - Busca automática de endereço
  // ==========================================================
  const campoCep = document.getElementById("clienteCep");
  const campoEndereco = document.getElementById("clienteEndereco");
  const campoBairro = document.getElementById("clienteBairro");
  const campoCidade = document.getElementById("clienteCidade");
  const campoEstado = document.getElementById("clienteEstado");

  campoCep?.addEventListener("blur", async () => {
    let cep = campoCep.value.replace(/\D/g, "");

    if (cep.length !== 8) return;

    try {
      const resp = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await resp.json();

      if (data.erro) return;

      campoEndereco.value = data.logradouro || "";
      campoBairro.value = data.bairro || "";
      campoCidade.value = data.localidade || "";
      campoEstado.value = data.uf || "";

      // Aciona validação automática dos campos preenchidos
      ["clienteEndereco", "clienteBairro", "clienteCidade", "clienteEstado"].forEach((id) => {
        const el = document.getElementById(id);
        if (el && el.value.trim() !== "") {
          el.classList.add("is-valid");
          el.classList.remove("is-invalid");
        }
      });

    } catch (err) {
      console.error("Erro ViaCEP:", err);
    }
  });


  // ==========================================================
  // APLICAÇÃO DE MÁSCARAS NUMÉRICAS
  // ==========================================================
  aplicarMascaraNumerica([
    "clienteCpf",
    "clienteCep",
    "clienteTelefone1",
    "clienteTelefone2",
    "clienteNumero",
  ]);

  // ==========================================================
  // VALIDAÇÃO EM TEMPO REAL
  // ==========================================================
  Object.keys(camposRegras).forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;

    // 🔥 TELEFONE 2 → totalmente opcional e SEM validação visual
    if (id === "clienteTelefone2") {
      el.addEventListener("input", () => {
        el.classList.remove("is-valid", "is-invalid");
        atualizarLabel(id, false);
      });
      el.addEventListener("blur", () => {
        if (el.value.trim() === "") {
          el.classList.remove("is-valid", "is-invalid");
          atualizarLabel(id, false);
        }
      });
      return; // pula para o próximo campo
    }

    const validar = () => {
      const valor = el.value.trim();
      const valido = camposRegras[id](valor);

      // campo vazio → sempre neutro
      if (valor === "") {
        el.classList.remove("is-valid", "is-invalid");
        atualizarLabel(id, false);
        return;
      }

      // INPUT → só mostra verde quando está válido
      if (valido) {
        el.classList.add("is-valid");
        el.classList.remove("is-invalid");
        atualizarLabel(id, true);
      } else {
        // não mostra vermelho durante a digitação
        el.classList.remove("is-valid");
        atualizarLabel(id, false);
      }
    };

    const validarBlur = () => {
      const valor = el.value.trim();
      const valido = camposRegras[id](valor);

      if (valor === "") {
        el.classList.remove("is-valid", "is-invalid");
        atualizarLabel(id, false);
        return;
      }

      // BLUR → se inválido, aí sim fica vermelho
      if (!valido) {
        el.classList.add("is-invalid");
        atualizarLabel(id, false);
      } else {
        el.classList.add("is-valid");
        el.classList.remove("is-invalid");
        atualizarLabel(id, true);
      }
    };

    // 🔥 Eventos
    el.addEventListener("input", validar);
    el.addEventListener("blur", validarBlur);
  });

  // ==========================================================
  // VALIDAÇÃO FINAL (AO SALVAR)
  // ==========================================================
  function validarCampos() {
    let ok = true;

    Object.entries(camposRegras).forEach(([id, regra]) => {
      const el = document.getElementById(id);
      const valor = el.value.trim();
      const valido = regra(valor);

      if (id === "clienteTelefone2" && valor === "") {
        el.classList.remove("is-valid", "is-invalid");
        return;
      }

      el.classList.toggle("is-invalid", !valido);
      el.classList.toggle("is-valid", valido);

      if (!valido && el.hasAttribute("required")) ok = false;
    });

    return ok;
  }

  // ==========================================================
  // RESETAR VALIDAÇÕES
  // ==========================================================
  function limparValidacoes() {
    document.querySelectorAll(".is-valid, .is-invalid")
      .forEach((el) => el.classList.remove("is-valid", "is-invalid"));
  }

  // ==========================================================
  // BUSCAR CLIENTES
  // ==========================================================
  async function fetchClientes() {
    tabela.innerHTML = "<tr><td colspan='6'>Carregando...</td></tr>";

    try {
      const resp = await fetch("http://projetovendamais-production.up.railway.app/api/clientes");
      const data = await resp.json();

      todosClientes = Array.isArray(data) ? data : [];
      aplicarFiltroEPaginar();
    } catch {
      tabela.innerHTML =
        "<tr><td colspan='6' class='text-danger text-center'>Erro ao carregar clientes.</td></tr>";
    }
  }

  // ==========================================================
  // FILTRO + PAGINAÇÃO
  // ==========================================================
  function aplicarFiltroEPaginar() {
    const termo =
      (document.getElementById("pesquisarInput")?.value || "")
        .toLowerCase()
        .trim();

    filtrados = !termo
      ? [...todosClientes]
      : todosClientes.filter(
        (c) =>
          String(c.idCliente).includes(termo) ||
          (c.nome || "").toLowerCase().includes(termo) ||
          (c.email || "").toLowerCase().includes(termo) ||
          (c.telefone1 || "").includes(termo)
      );

    filtrados.sort((a, b) => Number(b.idCliente) - Number(a.idCliente));

    const maxPage = Math.max(1, Math.ceil(filtrados.length / pageSize));
    if (currentPage > maxPage) currentPage = maxPage;

    renderTabelaPaginada();
    renderPaginacao();
  }

  function getPaginaAtual() {
    const start = (currentPage - 1) * pageSize;
    return filtrados.slice(start, start + pageSize);
  }

  // ==========================================================
  // LISTAGEM
  // ==========================================================
  function renderTabelaPaginada() {
    const page = getPaginaAtual();

    if (!page.length) {
      tabela.innerHTML =
        '<tr><td colspan="6" class="text-center">Nenhum cliente encontrado.</td></tr>';
      return;
    }

    tabela.innerHTML = "";

    page.forEach((c) => {
      const tr = document.createElement("tr");

      const botaoStatus =
        c.statusCliente === "ATIVO"
          ? `
      <button class="btn btn-sm btn-outline-danger btn-toggle-status"
              data-id="${c.idCliente}" data-status="ATIVO">
        <i class="fas fa-user-slash"></i>
      </button>`
          : `
      <button class="btn btn-sm btn-outline-success btn-toggle-status"
              data-id="${c.idCliente}" data-status="INATIVO">
        <i class="fas fa-user-check"></i>
      </button>`;

      tr.innerHTML = `
        <td>${c.idCliente}</td>
        <td>${c.nome}</td>
        <td>${c.dataNascimento ? new Date(c.dataNascimento).toLocaleDateString("pt-BR") : ""}</td>
        <td>${c.telefone1 || ""}</td>
        <td>${c.email || ""}</td>
        <td class="text-center">
          <button class="btn btn-sm btn-outline-primary me-2" 
                  onclick="editarCliente(${c.idCliente})">
            <i class="fas fa-pencil-alt"></i>
          </button>
          ${botaoStatus}
        </td>
      `;

      tabela.appendChild(tr);
    });
  }

  // ==========================================================
  // PAGINAÇÃO
  // ==========================================================
  function renderPaginacao() {
    const ul = document.getElementById("paginacao");
    if (!ul) return;

    ul.innerHTML = "";
    const totalPages = Math.max(1, Math.ceil(filtrados.length / pageSize));

    const addBtn = (label, disabled, callback) => {
      const li = document.createElement("li");
      li.className = `page-item ${disabled ? "disabled" : ""}`;
      li.innerHTML = `<a class="page-link" href="#">${label}</a>`;
      li.onclick = (e) => {
        e.preventDefault();
        if (!disabled) callback();
      };
      ul.appendChild(li);
    };

    addBtn("«", currentPage === 1, () => {
      currentPage--;
      renderTabelaPaginada();
      renderPaginacao();
    });

    for (let p = 1; p <= totalPages; p++) {
      const li = document.createElement("li");
      li.className = `page-item ${p === currentPage ? "active" : ""}`;
      li.innerHTML = `<a class="page-link" href="#">${p}</a>`;
      li.onclick = (e) => {
        e.preventDefault();
        currentPage = p;
        renderTabelaPaginada();
        renderPaginacao();
      };
      ul.appendChild(li);
    }

    addBtn("»", currentPage === totalPages, () => {
      currentPage++;
      renderTabelaPaginada();
      renderPaginacao();
    });
  }

  // ==========================================================
  // EDITAR CLIENTE
  // ==========================================================
  window.editarCliente = async function (id) {
    try {
      const resp = await fetch(`http://projetovendamais-production.up.railway.app/api/clientes/${id}`);
      const c = await resp.json();

      clienteEditando = id;

      Object.entries({
        clienteNome: c.nome,
        clienteCpf: c.cpf,
        clienteNascimento: (c.dataNascimento || "").split("T")[0],
        clienteGenero: c.genero,
        clienteCep: c.cep,
        clienteEndereco: c.endereco,
        clienteNumero: c.numero,
        clienteBairro: c.bairro,
        clienteCidade: c.cidade,
        clienteEstado: c.estado,
        clienteTelefone1: c.telefone1,
        clienteTelefone2: c.telefone2,
        clienteEmail: c.email,
        clienteObservacao: c.observacao,
      }).forEach(([id, val]) => {
        document.getElementById(id).value = val || "";
      });

      submitBtn.textContent = "Salvar Alterações";
      submitBtn.classList.replace("btn-primary", "btn-warning");
      cancelarBtn.classList.remove("d-none");

      limparValidacoes();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      flash("Erro ao carregar cliente.", "danger");
    }
  };

  // ==========================================================
  // CANCELAR
  // ==========================================================
  cancelarBtn?.addEventListener("click", () => {
    clienteEditando = null;
    form.reset();
    submitBtn.textContent = "Cadastrar Cliente";
    submitBtn.classList.replace("btn-warning", "btn-primary");
    cancelarBtn.classList.add("d-none");
    limparValidacoes();
  });

  // ==========================================================
  // SALVAR
  // ==========================================================
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!validarCampos())
      return flash("Corrija os campos em vermelho.", "danger");

    const dados = Object.fromEntries(new FormData(form).entries());

    const url = clienteEditando
      ? `http://projetovendamais-production.up.railway.app/api/clientes/${clienteEditando}`
      : "http://projetovendamais-production.up.railway.app/api/clientes";

    const method = clienteEditando ? "PUT" : "POST";

    try {
      const resp = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
      });

      const result = await resp.json();

      if (resp.ok) {
        flash(result.message || "Cliente salvo!");
        form.reset();
        clienteEditando = null;
        limparValidacoes();

        submitBtn.textContent = "Cadastrar Cliente";
        submitBtn.classList.replace("btn-warning", "btn-primary");
        cancelarBtn.classList.add("d-none");

        await fetchClientes();
      } else {
        flash(result.message || "Erro ao salvar.", "danger");
      }
    } catch {
      flash("Erro ao conectar com o servidor.", "danger");
    }
  });

  // ==========================================================
  // ALTERAR STATUS
  // ==========================================================
  document.addEventListener("click", async (e) => {
    const btn = e.target.closest(".btn-toggle-status");
    if (!btn) return;

    const id = btn.dataset.id;
    const atual = btn.dataset.status;
    const novoStatus = atual === "ATIVO" ? "INATIVO" : "ATIVO";

    if (!confirm(`Deseja marcar este cliente como ${novoStatus}?`))
      return;

    try {
      const resp = await fetch(`http://projetovendamais-production.up.railway.app/api/clientes/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: novoStatus }),
      });

      const result = await resp.json();
      flash(result.message);

      fetchClientes();
    } catch {
      flash("Erro ao atualizar status.", "danger");
    }
  });

  // ==========================================================
  // BUSCA DINÂMICA
  // ==========================================================
  document
    .getElementById("pesquisarInput")
    ?.addEventListener("input", () => {
      currentPage = 1;
      aplicarFiltroEPaginar();
    });

  document
    .getElementById("pesquisarBtn")
    ?.addEventListener("click", () => {
      currentPage = 1;
      aplicarFiltroEPaginar();
    });

  // ==========================================================
  // INICIALIZAR
  // ==========================================================
  fetchClientes();
}
// ==========================================================
// 4️ - PRODUTOS (CRUD + Validação + Paginação + Máscara de preço)
// ==========================================================
function inicializarCadastroProdutos() {
  const form = document.getElementById("formProduto");
  const feedback = document.getElementById("feedbackMessage");
  const tabela = document.getElementById("tabelaProdutos");
  const paginacao = document.getElementById("paginacaoProdutos");
  const btnSalvar = document.getElementById("btnSalvarProduto");
  const btnCancelar = document.getElementById("btnCancelarEdicao");

  if (!form) return;

  let todosProdutos = [];
  let filtrados = [];
  let produtoEditando = null;
  let currentPage = 1;
  const pageSize = 10;

  // ========== Máscara de Preço ==========
  function aplicarMascaraPreco(input) {
    input.addEventListener("input", () => {
      let valor = input.value.replace(/\D/g, "");
      if (valor === "") {
        input.value = "";
        return;
      }
      valor = (parseFloat(valor) / 100).toFixed(2);
      input.value = `R$ ${valor.replace(".", ",")}`;
    });

    input.addEventListener("focus", () => {
      if (input.value.startsWith("R$")) {
        input.value = input.value.replace("R$ ", "").replace(",", ".");
      }
    });

    input.addEventListener("blur", () => {
      let valor = input.value.replace(/\D/g, "");
      if (valor === "") {
        input.value = "";
        return;
      }
      valor = (parseFloat(valor) / 100).toFixed(2);
      input.value = `R$ ${valor.replace(".", ",")}`;
    });
  }

  const precoInput = document.getElementById("precoVenda");
  if (precoInput) aplicarMascaraPreco(precoInput);

  // ========== Mensagens ==========
  function flash(msg, type = "success", ms = 4000) {
    if (!feedback) return;
    feedback.innerHTML = `<div class="alert alert-${type}">${msg}</div>`;
    setTimeout(() => (feedback.innerHTML = ""), ms);
  }

  // ======================================================================
  // 🔍 VALIDAÇÃO NO MESMO PADRÃO DO CADASTRO DE CLIENTES
  // ======================================================================
  const camposRegrasProduto = {
    nome: (v) => v.trim() !== "",
    categoria: (v) => v.trim() !== "",
    precoVenda: (v) => /^\D*[\d.,]+$/.test(v),
  };


  // Salva texto original dos labels
  document.querySelectorAll("label").forEach((lbl) => {
    if (!lbl.dataset.original) lbl.dataset.original = lbl.innerHTML;
  });

  function atualizarLabelProduto(id, valido) {
    const label = document.querySelector(`label[for="${id}"]`);
    if (!label) return;

    label.classList.remove("label-valid");

    if (valido) {
      label.classList.add("label-valid");
      label.innerHTML = label.dataset.original + " ✓";
    } else {
      label.innerHTML = label.dataset.original;
    }
  }

  function validarCamposProduto() {
    let ok = true;

    Object.entries(camposRegrasProduto).forEach(([id, regra]) => {
      const el = document.getElementById(id);
      const valor = (el.value || "").trim();
      const valido = regra(valor);

      // CAMPO VAZIO QUANDO CLICA EM SALVAR → vermelho
      if (valor === "") {
        el.classList.remove("is-valid");
        el.classList.add("is-invalid");
        atualizarLabelProduto(id, false);
        ok = false;
        return;
      }

      // CAMPO PREENCHIDO CORRETAMENTE
      if (valido) {
        el.classList.add("is-valid");
        el.classList.remove("is-invalid");
        atualizarLabelProduto(id, true);
      }

      // CAMPO PREENCHIDO ERRADO
      else {
        el.classList.add("is-invalid");
        el.classList.remove("is-valid");
        atualizarLabelProduto(id, false);
        ok = false;
      }
    });

    return ok;
  }

  // Validação em tempo real
  Object.keys(camposRegrasProduto).forEach((id) => {
    const el = document.getElementById(id);

    // Enquanto digita
    el?.addEventListener("input", () => {
      const val = el.value.trim();
      const valido = camposRegrasProduto[id](val);

      // Se apagou → reseta
      if (val === "") {
        el.classList.remove("is-valid", "is-invalid");
        atualizarLabelProduto(id, false);
        return;
      }

      // Se válido → verde
      if (valido) {
        el.classList.add("is-valid");
        el.classList.remove("is-invalid");
        atualizarLabelProduto(id, true);
      }

      // Se inválido → não marca vermelho ainda
      else {
        el.classList.remove("is-valid");
        atualizarLabelProduto(id, false);
      }
    });

    // Quando sai do campo (blur)
    el?.addEventListener("blur", () => {
      const val = el.value.trim();
      const valido = camposRegrasProduto[id](val);

      // Se vazio → vermelho
      if (val === "") {
        el.classList.add("is-invalid");
        atualizarLabelProduto(id, false);
        return;
      }

      // Se válido → verde
      if (valido) {
        el.classList.add("is-valid");
        el.classList.remove("is-invalid");
        atualizarLabelProduto(id, true);
      }

      // Se inválido → vermelho
      else {
        el.classList.add("is-invalid");
        el.classList.remove("is-valid");
        atualizarLabelProduto(id, false);
      }
    });
  });


  function resetarValidacoesProduto() {
    document
      .querySelectorAll(".is-valid, .is-invalid")
      .forEach((el) => el.classList.remove("is-valid", "is-invalid"));

    document.querySelectorAll("label").forEach((lbl) => {
      lbl.classList.remove("label-valid");
      lbl.innerHTML = lbl.dataset.original;
    });
  }

  // ========== Buscar Produtos ==========
  async function fetchProdutos() {
    tabela.innerHTML = `<tr><td colspan="5" class="text-center">Carregando...</td></tr>`;
    try {
      const resp = await fetch("http://projetovendamais-production.up.railway.app/api/produtos");
      const data = await resp.json();
      todosProdutos = Array.isArray(data) ? data : [];
      aplicarFiltroEPaginar();
    } catch {
      tabela.innerHTML = `<tr><td colspan="5" class="text-center text-danger">Erro ao carregar produtos.</td></tr>`;
    }
  }

  // ========== Filtro + Paginação ==========
  function aplicarFiltroEPaginar() {
    const termo =
      (document.getElementById("pesquisarProduto")?.value || "")
        .toLowerCase()
        .trim();

    filtrados = !termo
      ? [...todosProdutos]
      : todosProdutos.filter(
        (p) =>
          String(p.idProduto).includes(termo) ||
          (p.nome || "").toLowerCase().includes(termo) ||
          (p.categoria || "").toLowerCase().includes(termo)
      );

    filtrados.sort((a, b) => Number(b.idProduto) - Number(a.idProduto));

    const maxPage = Math.max(1, Math.ceil(filtrados.length / pageSize));
    if (currentPage > maxPage) currentPage = maxPage;

    renderTabelaPaginada();
    renderPaginacao();
  }

  function getPaginaAtual() {
    const start = (currentPage - 1) * pageSize;
    return filtrados.slice(start, start + pageSize);
  }

  function renderTabelaPaginada() {
    const page = getPaginaAtual();

    if (!page.length) {
      tabela.innerHTML = `<tr><td colspan="5" class="text-center text-muted">Nenhum produto encontrado.</td></tr>`;
      return;
    }

    tabela.innerHTML = "";
    page.forEach((p) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${p.idProduto}</td>
        <td>${p.nome}</td>
        <td>${p.categoria || "-"}</td>
        <td>R$ ${parseFloat(p.precoVenda)
          .toFixed(2)
          .replace(".", ",")}</td>
        <td class="text-center">
          <button class="btn btn-sm btn-outline-primary me-2" onclick="editarProduto(${p.idProduto})"><i class="fas fa-pencil-alt"></i></button>
          <button class="btn btn-sm btn-outline-danger" onclick="excluirProduto(${p.idProduto})"><i class="fas fa-trash-alt"></i></button>
        </td>`;
      tabela.appendChild(tr);
    });
  }

  function renderPaginacao() {
    if (!paginacao) return;
    paginacao.innerHTML = "";
    const totalPages = Math.max(1, Math.ceil(filtrados.length / pageSize));

    const prev = document.createElement("li");
    prev.className = `page-item ${currentPage === 1 ? "disabled" : ""}`;
    prev.innerHTML = `<a class="page-link" href="#">&laquo;</a>`;
    prev.onclick = (e) => {
      e.preventDefault();
      if (currentPage > 1) {
        currentPage--;
        renderTabelaPaginada();
        renderPaginacao();
      }
    };
    paginacao.appendChild(prev);

    for (let p = 1; p <= totalPages; p++) {
      const li = document.createElement("li");
      li.className = `page-item ${p === currentPage ? "active" : ""}`;
      li.innerHTML = `<a class="page-link" href="#">${p}</a>`;
      li.onclick = (e) => {
        e.preventDefault();
        currentPage = p;
        renderTabelaPaginada();
        renderPaginacao();
      };
      paginacao.appendChild(li);
    }

    const next = document.createElement("li");
    next.className = `page-item ${currentPage === totalPages ? "disabled" : ""}`;
    next.innerHTML = `<a class="page-link" href="#">&raquo;</a>`;
    next.onclick = (e) => {
      e.preventDefault();
      if (currentPage < totalPages) {
        currentPage++;
        renderTabelaPaginada();
        renderPaginacao();
      }
    };
    paginacao.appendChild(next);
  }

  // ========== CRUD ==========
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!validarCamposProduto())
      return flash("⚠️ Corrija os campos em vermelho.", "danger");

    const dados = Object.fromEntries(new FormData(form).entries());

    if (dados.precoVenda) {
      dados.precoVenda = dados.precoVenda
        .replace("R$", "")
        .replace(/\s/g, "")
        .replace(",", ".");
    }

    const url = produtoEditando
      ? `http://projetovendamais-production.up.railway.app/api/produtos/${produtoEditando}`
      : "http://projetovendamais-production.up.railway.app/api/produtos";
    const method = produtoEditando ? "PUT" : "POST";

    try {
      const resp = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
      });
      const result = await resp.json();

      if (resp.ok) {
        flash(result.message || "Produto salvo com sucesso!");
        form.reset();
        produtoEditando = null;
        btnSalvar.textContent = "Salvar Produto";
        btnSalvar.classList.replace("btn-warning", "btn-primary");
        btnCancelar.classList.add("d-none");
        resetarValidacoesProduto();
        fetchProdutos();
      } else flash(result.message || "Erro ao salvar.", "danger");
    } catch {
      flash("Erro ao conectar com o servidor.", "danger");
    }
  });

  // Editar
  window.editarProduto = async function (id) {
    try {
      const resp = await fetch(`http://projetovendamais-production.up.railway.app/api/produtos/${id}`);
      if (!resp.ok) return flash("Produto não encontrado.", "danger");

      const p = await resp.json();

      form.nome.value = p.nome || "";
      form.categoria.value = p.categoria || "";
      form.precoVenda.value = `R$ ${parseFloat(p.precoVenda)
        .toFixed(2)
        .replace(".", ",")}`;

      produtoEditando = id;
      btnSalvar.textContent = "Salvar Alterações";
      btnSalvar.classList.replace("btn-primary", "btn-warning");
      btnCancelar.classList.remove("d-none");
      resetarValidacoesProduto();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      flash("Erro ao carregar produto.", "danger");
    }
  };

  // Cancelar
  btnCancelar.addEventListener("click", () => {
    form.reset();
    produtoEditando = null;
    btnSalvar.textContent = "Salvar Produto";
    btnSalvar.classList.replace("btn-warning", "btn-primary");
    btnCancelar.classList.add("d-none");
    resetarValidacoesProduto();
  });

  // Excluir
  window.excluirProduto = async function (id) {
    if (!confirm("Deseja realmente excluir este produto?")) return;
    try {
      const resp = await fetch(`http://projetovendamais-production.up.railway.app/api/produtos/${id}`, {
        method: "DELETE",
      });
      const data = await resp.json();
      if (resp.ok) {
        flash("🗑️ Produto excluído com sucesso!");
        fetchProdutos();
      } else flash(data.message || "Erro ao excluir produto.", "danger");
    } catch {
      flash("Erro ao excluir produto.", "danger");
    }
  };

  // Pesquisa
  document
    .getElementById("pesquisarProduto")
    ?.addEventListener("input", () => {
      currentPage = 1;
      aplicarFiltroEPaginar();
    });

  // Inicialização
  fetchProdutos();
}
// ==========================================================
//  5 - REGISTRO DE VENDAS 
// ==========================================================
function inicializarRegistroVendas() {
  console.log("✅ Página: registro-vendas.html detectada");

  // ==========================================================
  //  VARIÁVEIS GERAIS E ELEMENTOS
  // ==========================================================
  const API_BASE = "http://projetovendamais-production.up.railway.app";

  const feedback = document.getElementById("feedbackMessage");
  const tabelaVendas = document.getElementById("tabelaVendas");
  const tabelaItensVenda = document.getElementById("tabelaItensVenda");
  const totalVendaEl = document.getElementById("totalVenda");
  const subtotalEl = document.getElementById("subtotalVenda");
  const valorDescontoEl = document.getElementById("valorDesconto");

  const campoAddProduto = document.getElementById("addProduct");
  const campoClienteSelecionado = document.getElementById("clienteSelecionado");
  const campoQuantidade = document.getElementById("quantity");

  const btnAdicionarProduto = document.getElementById("btnAdicionarProduto");
  const btnRegistrar = document.getElementById("btnRegistrarVenda");
  const btnLimpar = document.getElementById("btnLimparVenda");

  let itensVenda = [];
  let descontoAtual = 0;

  // ==========================================================
  //  Função: Exibir mensagens de feedback
  // ==========================================================
  function flash(msg, type = "success", ms = 4000) {
    if (!feedback) return;
    feedback.innerHTML = `<div class="alert alert-${type}">${msg}</div>`;
    setTimeout(() => (feedback.innerHTML = ""), ms);
  }

  // ==========================================================
  //  MODAL: BUSCA DE PRODUTOS
  // ==========================================================
  const productModal = document.getElementById("productSearchModal");
  const buscarProdutoId = document.getElementById("buscarProdutoId");
  const buscarProdutoNome = document.getElementById("buscarProdutoNome");
  const tabelaModalProdutos = document.querySelector("#tabelaModalProdutos tbody");
  const btnBuscarProdutoModal = document.getElementById("btnBuscarProdutoModal");

  //  Limpar campos e tabela ao fechar o modal de produtos
  productModal?.addEventListener("hidden.bs.modal", () => {
    buscarProdutoId.value = "";
    buscarProdutoNome.value = "";
    tabelaModalProdutos.innerHTML = `
    <tr><td colspan="4" class="text-center text-muted py-3">
      Nenhum resultado ainda.
    </td></tr>`;
  });

  async function buscarProdutosModal(id = "", nome = "") {
    tabelaModalProdutos.innerHTML = `
    <tr><td colspan="4" class="text-center text-muted py-3">🔎 Buscando produtos...</td></tr>
  `;

    if (!id && !nome) {
      tabelaModalProdutos.innerHTML = `
      <tr><td colspan="4" class="text-center text-muted py-3">Digite ID ou Nome para buscar.</td></tr>
    `;
      return;
    }

    try {
      let url = `${API_BASE}/api/produtos`;
      if (id) url += `?id=${encodeURIComponent(id)}`;
      else if (nome) url += `?nome=${encodeURIComponent(nome)}`;

      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`Erro ${resp.status}`);
      const produtos = await resp.json();

      //  Verificação robusta
      if (!Array.isArray(produtos)) {
        console.warn("⚠️ Resposta inesperada da API de produtos:", produtos);
        tabelaModalProdutos.innerHTML = `
        <tr><td colspan="4" class="text-center text-danger py-3">Erro inesperado ao carregar produtos.</td></tr>
      `;
        return;
      }

      if (produtos.length === 0) {
        tabelaModalProdutos.innerHTML = `
        <tr><td colspan="4" class="text-center text-muted py-3">Nenhum produto encontrado.</td></tr>
      `;
        return;
      }

      tabelaModalProdutos.innerHTML = "";
      produtos.forEach((p) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
        <td>${p.idProduto}</td>
        <td>${p.nome}</td>
        <td>${p.categoria || "-"}</td>
        <td class="text-center">
          <button class="btn btn-sm btn-success btn-selecionar-produto"
            data-id="${p.idProduto}"
            data-nome="${p.nome}"
            data-preco="${p.precoVenda}">
            Selecionar
          </button>
        </td>`;
        tabelaModalProdutos.appendChild(tr);
      });
    } catch (err) {
      console.error("❌ Erro ao buscar produtos:", err);
      tabelaModalProdutos.innerHTML = `
      <tr><td colspan="4" class="text-center text-danger py-3">Erro ao carregar produtos.</td></tr>
    `;
    }
  }

  btnBuscarProdutoModal?.addEventListener("click", () => {
    buscarProdutosModal(buscarProdutoId.value.trim(), buscarProdutoNome.value.trim());
  });

  tabelaModalProdutos?.addEventListener("click", (e) => {
    const btn = e.target.closest(".btn-selecionar-produto");
    if (!btn) return;

    const { id, nome, preco } = btn.dataset;
    campoAddProduto.value = `${nome} - R$ ${parseFloat(preco).toFixed(2).replace(".", ",")}`;
    campoAddProduto.dataset.idProduto = id;
    campoAddProduto.dataset.preco = preco;

    bootstrap.Modal.getInstance(productModal)?.hide();
    flash("✅ Produto selecionado!");
  });

  // ==========================================================
  //  MODAL: BUSCA DE CLIENTES
  // ==========================================================
  const clientModal = document.getElementById("clientSearchModal");
  const buscarClienteId = document.getElementById("buscarClienteId");
  const buscarClienteCpf = document.getElementById("buscarClienteCpf");
  const buscarClienteNome = document.getElementById("buscarClienteNome");
  const tabelaModalClientes = document.querySelector("#tabelaModalClientes tbody");
  const btnBuscarClienteModal = document.getElementById("btnBuscarClienteModal");

  //  Limpar campos e tabela ao fechar o modal de clientes
  clientModal?.addEventListener("hidden.bs.modal", () => {
    buscarClienteId.value = "";
    buscarClienteCpf.value = "";
    buscarClienteNome.value = "";
    tabelaModalClientes.innerHTML = `
    <tr><td colspan="4" class="text-center text-muted py-3">
      Nenhum resultado ainda.
    </td></tr>`;
  });

  async function buscarClientesModal(id = "", cpf = "", nome = "") {
    tabelaModalClientes.innerHTML =
      `<tr><td colspan="4" class="text-center text-muted py-3">Buscando...</td></tr>`;

    try {
      let url = `${API_BASE}/api/clientes`;
      const params = [];
      if (id) params.push(`id=${encodeURIComponent(id)}`);
      if (cpf) params.push(`cpf=${encodeURIComponent(cpf)}`);
      if (nome) params.push(`nome=${encodeURIComponent(nome)}`);
      if (params.length > 0) url += `?${params.join("&")}`;

      const resp = await fetch(url);
      const clientes = await resp.json();

      if (!Array.isArray(clientes)) {
        console.warn("⚠️ Resposta inesperada da API de clientes:", clientes);
        tabelaModalClientes.innerHTML = `
        <tr><td colspan="4" class="text-center text-warning py-3">
          Resposta inesperada da API. Verifique o backend.
        </td></tr>`;
        return;
      }

      if (!clientes || clientes.length === 0) {
        tabelaModalClientes.innerHTML =
          `<tr><td colspan="4" class="text-center text-muted py-3">Nenhum cliente encontrado.</td></tr>`;
        return;
      }

      tabelaModalClientes.innerHTML = "";
      clientes.forEach((c) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${c.idCliente}</td>
          <td>${c.nome}</td>
          <td>${c.cpf || "-"}</td>
          <td class="text-center">
            <button class="btn btn-sm btn-success btn-selecionar-cliente"
              data-id="${c.idCliente}" data-nome="${c.nome}">
              Selecionar
            </button>
          </td>`;
        tabelaModalClientes.appendChild(tr);
      });
    } catch (err) {
      console.error("Erro ao buscar clientes:", err);
      tabelaModalClientes.innerHTML =
        `<tr><td colspan="4" class="text-danger text-center py-3">Erro ao carregar clientes.</td></tr>`;
    }
  }

  btnBuscarClienteModal?.addEventListener("click", () => {
    buscarClientesModal(
      buscarClienteId.value.trim(),
      buscarClienteCpf.value.trim(),
      buscarClienteNome.value.trim()
    );
  });

  tabelaModalClientes?.addEventListener("click", (e) => {
    const btn = e.target.closest(".btn-selecionar-cliente");
    if (!btn) return;

    const { id, nome } = btn.dataset;
    campoClienteSelecionado.value = nome;
    campoClienteSelecionado.dataset.idCliente = id;

    bootstrap.Modal.getInstance(clientModal)?.hide();
    flash("✅ Cliente selecionado!");
  });

  // ==========================================================
  //  CONTROLE DE QUANTIDADE
  // ==========================================================
  const [btnMenos, btnMais] = campoQuantidade?.parentElement.querySelectorAll(".btn-outline-secondary") || [];

  btnMenos?.addEventListener("click", () => {
    let qtd = parseInt(campoQuantidade.value) || 1;
    if (qtd > 1) campoQuantidade.value = qtd - 1;
  });

  btnMais?.addEventListener("click", () => {
    let qtd = parseInt(campoQuantidade.value) || 1;
    campoQuantidade.value = qtd + 1;
  });

  // ==========================================================
  //  ADICIONAR PRODUTO À VENDA
  // ==========================================================
  btnAdicionarProduto?.addEventListener("click", () => {
    const id = campoAddProduto.dataset.idProduto;
    const nome = campoAddProduto.value.split(" - ")[0];
    const preco = parseFloat(campoAddProduto.dataset.preco || 0);
    const qtd = parseInt(campoQuantidade.value) || 1;

    if (!id || !nome) {
      flash("Selecione um produto antes de adicionar!", "warning");
      return;
    }

    const subtotal = preco * qtd;
    itensVenda.push({ id, nome, preco, qtd, subtotal });
    renderItensVenda();
    atualizarTotal();

    campoAddProduto.value = "";
    campoAddProduto.dataset.idProduto = "";
    campoAddProduto.dataset.preco = "";
  });

  // ==========================================================
  //  RENDERIZAR ITENS NA TABELA
  // ==========================================================
  function renderItensVenda() {
    tabelaItensVenda.innerHTML = "";
    if (itensVenda.length === 0) {
      tabelaItensVenda.innerHTML = `<tr><td colspan="6" class="text-center text-muted">Nenhum item adicionado.</td></tr>`;
      return;
    }

    itensVenda.forEach((item, i) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${i + 1}</td>
        <td>${item.nome}</td>
        <td>${item.qtd}</td>
        <td>R$ ${item.preco.toFixed(2).replace(".", ",")}</td>
        <td>R$ ${item.subtotal.toFixed(2).replace(".", ",")}</td>
        <td class="text-center">
          <button class="btn btn-sm btn-outline-danger btn-remover-item" data-index="${i}">
            <i class="fas fa-times"></i>
          </button>
        </td>`;
      tabelaItensVenda.appendChild(tr);
    });
  }
  // ==========================================================
  //  Modal de Desconto
  // ==========================================================
  const discountModal = document.getElementById("discountModal");
  const discountValueInput = document.getElementById("discountValue");
  const btnAplicarDesconto = discountModal?.querySelector(".btn-aplicar-desconto");
  const btnRemoverDesconto = document.getElementById("btnRemoverDesconto");
  const btnAbrirDesconto = document.getElementById("btnAbrirDesconto");

  //  Limpar campo de desconto ao fechar o modal
  discountModal?.addEventListener("hidden.bs.modal", () => {
    discountValueInput.value = "";
  });

  // Máscara automática de valor (R$)
  discountValueInput?.addEventListener("input", (e) => {
    let valor = e.target.value.replace(/\D/g, "");
    valor = (parseInt(valor || "0", 10) / 100).toFixed(2);
    e.target.value = valor.replace(".", ",");
  });

  //  Mostrar/ocultar botão de desconto dinamicamente
  function verificarVisibilidadeDesconto() {
    if (itensVenda.length > 0) {
      btnAbrirDesconto?.classList.remove("d-none");
    } else {
      btnAbrirDesconto?.classList.add("d-none");
      btnRemoverDesconto?.classList.add("d-none");
      descontoAtual = 0;
    }
  }
  //  Abrir modal de desconto
  btnAbrirDesconto?.addEventListener("click", () => {
    discountValueInput.value = descontoAtual.toFixed(2).replace(".", ",");
    const modal = new bootstrap.Modal(discountModal);
    modal.show();
  });
  //  Aplicar desconto com validação
  btnAplicarDesconto?.addEventListener("click", () => {
    const valorDigitado = discountValueInput.value.replace(",", ".").trim();
    const valor = parseFloat(valorDigitado);
    const totalBruto = itensVenda.reduce((acc, item) => acc + item.subtotal, 0);

    if (isNaN(valor) || valor < 0) {
      flash("Digite um valor de desconto válido.", "warning");
      return;
    }

    if (valor >= totalBruto) {
      flash("O desconto não pode ser igual ou maior que o total da venda!", "danger");
      return;
    }

    descontoAtual = valor;
    atualizarTotal();

    const modal = bootstrap.Modal.getInstance(discountModal);
    modal?.hide();
    btnRemoverDesconto?.classList.remove("d-none");
    flash(`💸 Desconto de R$ ${valor.toFixed(2).replace(".", ",")} aplicado com sucesso!`);
  });

  //  Remover desconto
  btnRemoverDesconto?.addEventListener("click", () => {
    descontoAtual = 0;
    atualizarTotal();
    btnRemoverDesconto?.classList.add("d-none");
    flash("❌ Desconto removido com sucesso!", "info");
  });

  //  Atualizar subtotal e total (inclui desconto)
  function atualizarTotal() {
    const totalBruto = itensVenda.reduce((acc, item) => acc + item.subtotal, 0);
    const totalComDesconto = Math.max(totalBruto - descontoAtual, 0);

    subtotalEl.textContent = `R$ ${totalBruto.toFixed(2).replace(".", ",")}`;
    valorDescontoEl.textContent = `- R$ ${descontoAtual.toFixed(2).replace(".", ",")}`;
    totalVendaEl.textContent = `R$ ${totalComDesconto.toFixed(2).replace(".", ",")}`;

    verificarVisibilidadeDesconto();
  }

  // ==========================================================
  // LIMPAR VENDA E REMOVER ITENS
  // ==========================================================
  btnLimpar?.addEventListener("click", () => {
    itensVenda = [];
    descontoAtual = 0;
    renderItensVenda();
    atualizarTotal();
    btnRemoverDesconto?.classList.add("d-none");
  });

  tabelaItensVenda?.addEventListener("click", (e) => {
    const btn = e.target.closest(".btn-remover-item");
    if (!btn) return;
    const index = btn.dataset.index;
    itensVenda.splice(index, 1);
    renderItensVenda();
    atualizarTotal();

    if (itensVenda.length === 0) {
      descontoAtual = 0;
      btnRemoverDesconto?.classList.add("d-none");
      flash("🧾 Todos os itens foram removidos. Desconto zerado automaticamente.", "info");
    }
  });

  // ==========================================================
  // REGISTRAR VENDA
  // ==========================================================
  btnRegistrar?.addEventListener("click", async () => {
    if (itensVenda.length === 0) {
      flash("Adicione produtos antes de registrar!", "warning");
      return;
    }

    const totalBruto = itensVenda.reduce((acc, i) => acc + i.subtotal, 0);
    const valorTotal = Math.max(totalBruto - descontoAtual, 0);
    const idCliente = campoClienteSelecionado.dataset.idCliente || null;

    const itensFormatados = itensVenda.map((i) => ({
      idProduto: i.id,
      quantidade: i.qtd,
      precoUnitario: i.preco,
    }));

    const editandoId = btnRegistrar.dataset.editando;
    const metodo = editandoId ? "PUT" : "POST";
    const url = editandoId
      ? `${API_BASE}/api/vendas/${editandoId}`
      : `${API_BASE}/api/vendas`;

    try {
      const resp = await fetch(url, {
        method: metodo,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idCliente, valorTotal, desconto: descontoAtual, itens: itensFormatados }),
      });

      const data = await resp.json();
      if (!resp.ok) throw new Error(data.message || "Erro no servidor");

      flash(
        editandoId
          ? "✏️ Venda atualizada com sucesso!"
          : "💰 Venda registrada com sucesso!",
        "success"
      );

      //  Resetar tudo
      itensVenda = [];
      descontoAtual = 0;
      renderItensVenda();
      atualizarTotal();
      campoClienteSelecionado.value = "";
      campoClienteSelecionado.dataset.idCliente = "";
      btnRegistrar.textContent = "Registrar Venda";
      btnRegistrar.classList.replace("btn-warning", "btn-primary");
      delete btnRegistrar.dataset.editando;
      document.getElementById("btnCancelarEdicaoVenda")?.remove();

      await carregarVendas();
    } catch (err) {
      console.error("❌ Erro ao salvar venda:", err);
      flash("Erro ao salvar venda.", "danger");
    }
  });
  // ==========================================================
  //  CARREGAR VENDAS REALIZADAS
  // ==========================================================
  async function carregarVendas() {
    const tabela = document.getElementById("tabelaVendas");
    const paginacao = document.getElementById("paginacaoVendas");
    const inputBusca = document.getElementById("pesquisarVenda");
    if (!tabela) return;

    let todasVendas = [];
    let filtradas = [];
    let paginaAtual = 1;
    const pageSize = 8;

    // 🔍 Filtrar vendas dinamicamente
    function aplicarFiltro() {
      const termo = (inputBusca?.value || "").toLowerCase().trim();
      filtradas = !termo
        ? [...todasVendas]
        : todasVendas.filter(
          (v) =>
            String(v.idVenda).includes(termo) ||
            (v.cliente || "").toLowerCase().includes(termo) ||
            (v.dataVenda || "").toLowerCase().includes(termo)
        );

      filtradas.sort((a, b) => Number(b.idVenda) - Number(a.idVenda));
      paginaAtual = 1;
      renderTabela();
      renderPaginacao();
    }

    //  Renderizar tabela (com botões padronizados)
    function renderTabela() {
      tabela.innerHTML = "";

      const inicio = (paginaAtual - 1) * pageSize;
      const fim = inicio + pageSize;
      const vendasPagina = filtradas.slice(inicio, fim);

      if (vendasPagina.length === 0) {
        tabela.innerHTML = `
      <tr>
        <td colspan="5" class="text-center text-muted py-3">
          Nenhuma venda encontrada.
        </td>
      </tr>`;
        return;
      }

      vendasPagina.forEach((v) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
      <td>${v.idVenda}</td>
      <td>${v.cliente || "—"}</td>
      <td>R$ ${parseFloat(v.valorTotal).toFixed(2).replace(".", ",")}</td>
      <td>${v.dataVenda}</td>
      <td class="text-center">
        <button class="btn btn-sm btn-outline-primary me-2 btn-editar-venda" 
                data-id="${v.idVenda}" title="Editar venda">
          <i class="fas fa-pencil-alt"></i>
        </button>
        <button class="btn btn-sm btn-outline-info me-2 btn-ver-detalhes" 
                data-id="${v.idVenda}" title="Ver detalhes">
          <i class="fas fa-eye"></i>
        </button>
        <button class="btn btn-sm btn-outline-danger btn-excluir-venda" 
                data-id="${v.idVenda}" title="Excluir venda">
          <i class="fas fa-trash-alt"></i>
        </button>
      </td>`;
        tabela.appendChild(tr);
      });
    }

    // Renderizar paginação (mesmo padrão clientes/produtos)
    function renderPaginacao() {
      if (!paginacao) return;
      paginacao.innerHTML = "";

      const totalPaginas = Math.ceil(filtradas.length / pageSize) || 1;

      const addBtn = (label, disabled, callback) => {
        const li = document.createElement("li");
        li.className = `page-item ${disabled ? "disabled" : ""}`;
        li.innerHTML = `<a class="page-link" href="#">${label}</a>`;
        li.onclick = (e) => {
          e.preventDefault();
          if (!disabled) callback();
        };
        paginacao.appendChild(li);
      };

      addBtn("«", paginaAtual === 1, () => {
        paginaAtual--;
        renderTabela();
        renderPaginacao();
      });

      for (let p = 1; p <= totalPaginas; p++) {
        const li = document.createElement("li");
        li.className = `page-item ${p === paginaAtual ? "active" : ""}`;
        li.innerHTML = `<a class="page-link" href="#">${p}</a>`;
        li.onclick = (e) => {
          e.preventDefault();
          paginaAtual = p;
          renderTabela();
          renderPaginacao();
        };
        paginacao.appendChild(li);
      }

      addBtn("»", paginaAtual === totalPaginas, () => {
        paginaAtual++;
        renderTabela();
        renderPaginacao();
      });
    }

    //  Buscar vendas na API
    try {
      tabela.innerHTML = `
    <tr>
      <td colspan="5" class="text-center text-muted py-3">
        <i class="fas fa-spinner fa-spin me-2"></i>Carregando vendas...
      </td>
    </tr>`;
      const resp = await fetch(`${API_BASE}/api/vendas`);
      const vendas = await resp.json();

      todasVendas = Array.isArray(vendas) ? vendas : [];
      aplicarFiltro();
    } catch (err) {
      console.error("❌ Erro ao carregar vendas:", err);
      tabela.innerHTML = `
    <tr>
      <td colspan="5" class="text-center text-danger py-3">
        Erro ao carregar vendas.
      </td>
    </tr>`;
    }

    //  Eventos de pesquisa e botão
    inputBusca?.addEventListener("input", aplicarFiltro);
    document.getElementById("btnPesquisarVenda")?.addEventListener("click", aplicarFiltro);
  }

  // ==========================================================
  //  VER DETALHES DA VENDA
  // ==========================================================
  tabelaVendas?.addEventListener("click", async (e) => {
    const btn = e.target.closest(".btn-ver-detalhes");
    if (!btn) return;

    const idVenda = btn.dataset.id;

    try {
      const resp = await fetch(`${API_BASE}/api/vendas/${idVenda}`);
      if (!resp.ok) throw new Error("Erro ao buscar detalhes da venda");

      const venda = await resp.json();
      console.log("🧾 Detalhes da venda recebidos:", venda);

      //  Preenche informações principais
      document.getElementById("detalheIdVenda").textContent = venda.idVenda;
      document.getElementById("detalheCliente").textContent = venda.cliente || "—";
      document.getElementById("detalheDataVenda").textContent = venda.dataVenda || "—";
      document.getElementById("detalheStatus").textContent = venda.status || "Ativa";

      //  Itens
      const tabela = document.querySelector("#tabelaItensDetalhesVenda tbody");
      tabela.innerHTML = "";

      if (!venda.itens || venda.itens.length === 0) {
        tabela.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-3">Nenhum item encontrado.</td></tr>`;
      } else {
        venda.itens.forEach((i) => {
          const tr = document.createElement("tr");
          tr.innerHTML = `
          <td>${i.produto}</td>
          <td>${i.quantidade}</td>
          <td>R$ ${parseFloat(i.precoUnitario).toFixed(2).replace(".", ",")}</td>
          <td>R$ ${parseFloat(i.subtotal).toFixed(2).replace(".", ",")}</td>
        `;
          tabela.appendChild(tr);
        });
      }

      // Totais (conversão segura para número)
      let subtotal = 0;
      if (Array.isArray(venda.itens)) {
        subtotal = venda.itens.reduce((acc, i) => acc + parseFloat(i.subtotal || 0), 0);
      }

      document.getElementById("detalheSubtotal").textContent = `R$ ${subtotal.toFixed(2).replace(".", ",")}`;
      document.getElementById("detalheDesconto").textContent = `R$ ${(parseFloat(venda.desconto) || 0).toFixed(2).replace(".", ",")}`;
      document.getElementById("detalheTotal").textContent = `R$ ${parseFloat(venda.valorTotal || subtotal).toFixed(2).replace(".", ",")}`;


      //  Exibir modal de forma segura
      const modalEl = document.getElementById("saleDetailsModal");
      if (!modalEl) {
        console.error("❌ Modal de detalhes não encontrado no DOM!");
        return;
      }

      const modal = new bootstrap.Modal(modalEl);
      modal.show();

    } catch (err) {
      console.error("❌ Erro ao carregar detalhes da venda:", err);
      flash("Erro ao carregar detalhes da venda.", "danger");
    }
  });
  // ==========================================================
  //  EXCLUIR VENDA 
  // ==========================================================
  tabelaVendas?.addEventListener("click", async (e) => {
    const btnExcluir = e.target.closest(".btn-excluir-venda");
    if (!btnExcluir) return;

    const idVenda = btnExcluir.dataset.id;
    if (!confirm(`Tem certeza que deseja excluir a venda #${idVenda}?`)) return;

    try {
      const resp = await fetch(`${API_BASE}/api/vendas/${idVenda}`, {
        method: "DELETE",
      });
      const data = await resp.json();

      if (!resp.ok) {
        console.error("❌ Erro ao excluir venda:", data);
        flash(data.message || "Erro ao excluir venda!", "danger");
        return;
      }

      flash("🗑️ Venda excluída com sucesso!", "success");
      await carregarVendas(); // Atualiza a lista após excluir
    } catch (err) {
      console.error("❌ Erro no frontend ao excluir venda:", err);
      flash("Erro ao excluir venda.", "danger");
    }
  });
  // ==========================================================
  //  EDITAR VENDA
  // ==========================================================
  tabelaVendas?.addEventListener("click", async (e) => {
    const btnEditar = e.target.closest(".btn-editar-venda");
    if (!btnEditar) return;

    const idVenda = btnEditar.dataset.id;

    try {
      const resp = await fetch(`${API_BASE}/api/vendas/${idVenda}`);
      if (!resp.ok) throw new Error("Erro ao buscar dados da venda");
      const venda = await resp.json();

      console.log("📝 Venda para edição:", venda);

      //  Preenche cliente
      campoClienteSelecionado.value = venda.cliente || "—";
      campoClienteSelecionado.dataset.idCliente = venda.idCliente || "";

      //  Carrega os itens no carrinho novamente
      itensVenda = (venda.itens || []).map((i) => ({
        id: i.idProduto,
        nome: i.produto,
        preco: parseFloat(i.precoUnitario),
        qtd: parseInt(i.quantidade),
        subtotal: parseFloat(i.subtotal),
      }));

      //  Recarrega valores de desconto e totais
      descontoAtual = parseFloat(venda.desconto || 0);
      renderItensVenda();
      atualizarTotal();

      //  Altera botões e estado visual
      btnRegistrar.textContent = "Salvar Alterações";
      btnRegistrar.classList.replace("btn-primary", "btn-warning");
      btnRegistrar.dataset.editando = idVenda;

      if (!document.getElementById("btnCancelarEdicaoVenda")) {
        const btnCancelar = document.createElement("button");
        btnCancelar.id = "btnCancelarEdicaoVenda";
        btnCancelar.className = "btn btn-secondary ms-2";
        btnCancelar.innerHTML = '<i class="fas fa-times me-1"></i>Cancelar Edição';
        btnRegistrar.parentNode.appendChild(btnCancelar);

        btnCancelar.addEventListener("click", () => {
          itensVenda = [];
          descontoAtual = 0;
          renderItensVenda();
          atualizarTotal();
          campoClienteSelecionado.value = "";
          campoClienteSelecionado.dataset.idCliente = "";
          btnRegistrar.textContent = "Registrar Venda";
          btnRegistrar.classList.replace("btn-warning", "btn-primary");
          delete btnRegistrar.dataset.editando;
          btnCancelar.remove();
          flash("🧾 Edição cancelada.", "info");
        });
      }

      flash("✏️ Modo de edição ativado para a venda #" + idVenda, "info");
    } catch (err) {
      console.error("❌ Erro ao editar venda:", err);
      flash("Erro ao carregar dados da venda.", "danger");
    }
  });

  // 🚀 Inicialização automática
  carregarVendas();
}
// ==========================================================
//  6 - CONSULTA DE CLIENTES 
// ==========================================================
if (window.location.pathname.includes("consulta.html")) {
  initConsultaClientes();
}

async function initConsultaClientes() {
  const API_BASE = "http://projetovendamais-production.up.railway.app";

  // Elementos principais
  const tabelaResultados = document.getElementById("tabelaResultadosClientes");
  const tabelaVendasCliente = document.getElementById("tabelaVendasCliente");
  const paginacaoVendasCliente = document.getElementById("paginacaoVendasCliente");
  const detailsView = document.getElementById("detailsView");

  // Campos de busca
  const searchId = document.getElementById("searchId");
  const searchName = document.getElementById("searchName");
  const searchCpf = document.getElementById("searchCpf");
  const searchStatus = document.getElementById("searchStatus");
  const btnLimparFiltros = document.getElementById("btnLimparFiltros");
  const btnBuscarClientes = document.getElementById("btnBuscarClientes");

  // Campos de detalhes do cliente
  const spanNome = document.getElementById("detalheNomeCliente");
  const spanStatusBadge = document.getElementById("detalheStatusBadge");
  const spanCpf = document.getElementById("detalheCpfCliente");
  const spanTelefone = document.getElementById("detalheTelefoneCliente");
  const spanEmail = document.getElementById("detalheEmailCliente");
  const spanEndereco = document.getElementById("detalheEnderecoCliente");
  const spanCidade = document.getElementById("detalheCidadeCliente");
  const spanObservacao = document.getElementById("detalheObservacaoCliente");

  let clienteSelecionado = null;
  let vendasCliente = [];
  let paginaAtualVendas = 1;
  const pageSizeVendas = 5;

  // 🧹 Limpar filtros
  btnLimparFiltros?.addEventListener("click", () => {
    searchId.value = "";
    searchName.value = "";
    searchCpf.value = "";
    searchStatus.value = "todos";
    tabelaResultados.innerHTML = `
      <tr><td colspan="5" class="text-center text-muted py-3">Nenhum resultado.</td></tr>`;
  });

  // 🔍 Buscar clientes
  btnBuscarClientes?.addEventListener("click", async () => {
    const id = searchId.value.trim();
    const nome = searchName.value.trim();
    const cpf = searchCpf.value.replace(/\D/g, "");
    const status = searchStatus.value;

    let url = `${API_BASE}/api/consultas/clientes`;
    const params = [];
    if (id) params.push(`id=${encodeURIComponent(id)}`);
    if (nome) params.push(`nome=${encodeURIComponent(nome)}`);
    if (cpf) params.push(`cpf=${encodeURIComponent(cpf)}`);
    if (status && status !== "todos")
      params.push(`status=${encodeURIComponent(status)}`); // ⬅️ AQUI O AJUSTE

    if (params.length) url += `?${params.join("&")}`;

    tabelaResultados.innerHTML = `
      <tr><td colspan="5" class="text-center text-muted py-3">Buscando...</td></tr>`;

    try {
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`Erro ${resp.status}`);
      const clientes = await resp.json();

      if (!Array.isArray(clientes) || clientes.length === 0) {
        tabelaResultados.innerHTML = `
          <tr><td colspan="5" class="text-center text-muted py-3">Nenhum cliente encontrado.</td></tr>`;
        return;
      }

      tabelaResultados.innerHTML = "";
      clientes.forEach((c) => {
        // Formatar data de nascimento (se vier)
        let nasc = "—";
        if (c.dataNascimento) {
          try {
            nasc = c.dataNascimento.split("T")[0].split("-").reverse().join("/");
          } catch {
            nasc = "—";
          }
        }

        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${c.idCliente}</td>
          <td>${c.nome}</td>
          <td>${c.cpf || "—"}</td>
          <td>${nasc}</td>
          <td>
            <span class="badge ${c.statusCliente === "ATIVO" ? "bg-success" : "bg-danger"}">
              ${c.statusCliente}
            </span>
          </td>
          <td class="text-center">
            <button class="btn btn-sm btn-success btn-select-cliente" data-id="${c.idCliente}">
              <i class="fas fa-check me-1"></i>Selecionar
            </button>
          </td>`;
        tabelaResultados.appendChild(tr);
      });

    } catch (err) {
      console.error("❌ Erro ao buscar clientes:", err);
      tabelaResultados.innerHTML = `
        <tr><td colspan="5" class="text-center text-danger py-3">Erro ao buscar clientes.</td></tr>`;
    }
  });

  // ✅ Selecionar cliente e buscar vendas
  tabelaResultados?.addEventListener("click", async (e) => {
    const btn = e.target.closest(".btn-select-cliente");
    if (!btn) return;

    const idCliente = Number(btn.dataset.id);
    try {
      // Buscar detalhes do cliente
      const resp = await fetch(`${API_BASE}/api/consultas/clientes/${idCliente}`);
      if (!resp.ok) throw new Error(`Cliente não encontrado (${resp.status})`);
      const cliente = await resp.json();
      clienteSelecionado = cliente;

      // Preencher resumo
      spanNome.textContent = cliente.nome;
      spanCpf.textContent = cliente.cpf || "—";
      spanTelefone.textContent = cliente.telefone1 || "—";
      spanEmail.textContent = cliente.email || "—";
      spanEndereco.textContent = cliente.endereco || "—";
      spanCidade.textContent = cliente.cidade || "—";
      spanObservacao.textContent = cliente.observacao || "—";

      spanStatusBadge.textContent = cliente.statusCliente;
      spanStatusBadge.classList.remove("bg-success", "bg-danger");
      spanStatusBadge.classList.add(
        cliente.statusCliente === "ATIVO" ? "bg-success" : "bg-danger"
      );

      // Buscar apenas vendas do cliente
      const vendasResp = await fetch(`${API_BASE}/api/consultas/vendas/${idCliente}`);
      if (!vendasResp.ok) throw new Error(`Erro ao buscar vendas (${vendasResp.status})`);
      const vendas = await vendasResp.json();

      vendasCliente = Array.isArray(vendas) ? vendas : [];
      paginaAtualVendas = 1;
      renderVendasCliente();

      // Mostrar detalhes e fechar modal
      detailsView.classList.remove("d-none");
      const modalEl = document.getElementById("resultsModal");
      const modal = bootstrap.Modal.getInstance(modalEl);
      modal?.hide();

      // Limpar campos de busca
      searchId.value = "";
      searchName.value = "";
      searchCpf.value = "";
      searchStatus.value = "todos";
    } catch (err) {
      console.error("❌ Erro ao carregar cliente:", err);
      tabelaVendasCliente.innerHTML = `
        <tr><td colspan="4" class="text-center text-danger py-3">Erro ao carregar vendas do cliente.</td></tr>`;
    }
  });

  //  Renderizar vendas do cliente
  function renderVendasCliente() {
    tabelaVendasCliente.innerHTML = "";

    if (!vendasCliente || vendasCliente.length === 0) {
      tabelaVendasCliente.innerHTML = `
        <tr><td colspan="4" class="text-center text-muted py-3">Nenhuma venda encontrada para este cliente.</td></tr>`;
      paginacaoVendasCliente.innerHTML = "";
      return;
    }

    const ordenadas = [...vendasCliente].sort((a, b) => b.idVenda - a.idVenda);
    const totalPaginas = Math.ceil(ordenadas.length / pageSizeVendas);
    const inicio = (paginaAtualVendas - 1) * pageSizeVendas;
    const fim = inicio + pageSizeVendas;
    const pagina = ordenadas.slice(inicio, fim);

    pagina.forEach((v) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${v.idVenda}</td>
        <td>${v.dataVenda || "—"}</td>
        <td>R$ ${parseFloat(v.valorTotal).toFixed(2).replace(".", ",")}</td>
        <td class="text-center">
          <button class="btn btn-sm btn-outline-info btn-ver-detalhes-venda" data-id="${v.idVenda}">
            <i class="fas fa-eye"></i>
          </button>
        </td>`;
      tabelaVendasCliente.appendChild(tr);
    });

    //  Paginação padrão
    paginacaoVendasCliente.innerHTML = "";
    const addBtn = (label, disabled, cb) => {
      const li = document.createElement("li");
      li.className = `page-item ${disabled ? "disabled" : ""}`;
      li.innerHTML = `<a class="page-link" href="#">${label}</a>`;
      li.onclick = (e) => { e.preventDefault(); if (!disabled) cb(); };
      paginacaoVendasCliente.appendChild(li);
    };

    addBtn("«", paginaAtualVendas === 1, () => {
      paginaAtualVendas--;
      renderVendasCliente();
    });

    for (let p = 1; p <= totalPaginas; p++) {
      const li = document.createElement("li");
      li.className = `page-item ${p === paginaAtualVendas ? "active" : ""}`;
      li.innerHTML = `<a class="page-link" href="#">${p}</a>`;
      li.onclick = (e) => {
        e.preventDefault();
        paginaAtualVendas = p;
        renderVendasCliente();
      };
      paginacaoVendasCliente.appendChild(li);
    }

    addBtn("»", paginaAtualVendas === totalPaginas, () => {
      paginaAtualVendas++;
      renderVendasCliente();
    });
  }

  //  Ver detalhes da venda (MODAL COMPLETO)
  tabelaVendasCliente?.addEventListener("click", async (e) => {
    const btn = e.target.closest(".btn-ver-detalhes-venda");
    if (!btn) return;

    const idVenda = Number(btn.dataset.id);

    try {
      const resp = await fetch(`${API_BASE}/api/consultas/venda/${idVenda}`);
      if (!resp.ok) throw new Error(`Erro ${resp.status}`);
      const venda = await resp.json();

      // ===============================
      // Cabeçalho do modal
      // ===============================
      document.getElementById("purchaseDetailsModalLabel").textContent =
        `Detalhes da Venda #${venda.idVenda}`;

      document.getElementById("detalheIdVenda").textContent = venda.idVenda;
      document.getElementById("detalheVendaClienteNome").textContent =
        clienteSelecionado?.nome || "—";
      document.getElementById("detalheVendaData").textContent =
        venda.dataVenda || "—";

      const statusBadge = document.getElementById("detalheVendaStatus");
      const statusAtual = clienteSelecionado?.statusCliente || "ATIVO";

      statusBadge.textContent = statusAtual;
      statusBadge.className =
        statusAtual === "ATIVO"
          ? "badge bg-success"
          : "badge bg-danger";

      // ===============================
      //  Itens da venda
      // ===============================
      const tbodyItens = document.getElementById("tabelaItensVendaCliente");
      tbodyItens.innerHTML = "";

      if (!venda.itens || venda.itens.length === 0) {
        tbodyItens.innerHTML = `
          <tr><td colspan="4" class="text-center text-muted py-3">
            Nenhum item encontrado.
          </td></tr>`;
      } else {
        venda.itens.forEach((i) => {
          const preco = parseFloat(i.precoUnitario || 0);
          const qtd = parseInt(i.quantidade || 0);
          const subtotal = preco * qtd;

          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td>${i.produto}</td>
            <td>${qtd}</td>
            <td class="text-end">R$ ${preco.toFixed(2).replace('.', ',')}</td>
            <td class="text-end">R$ ${subtotal.toFixed(2).replace('.', ',')}</td>`;
          tbodyItens.appendChild(tr);
        });
      }

      // ===============================
      //  Totais
      // ===============================
      const subtotal = venda.itens?.reduce((acc, i) =>
        acc + ((parseFloat(i.precoUnitario) || 0) * (parseInt(i.quantidade) || 0))
        , 0) || 0;

      const desconto = parseFloat(venda.desconto) || 0;
      const total = parseFloat(venda.valorTotal) || subtotal;

      document.getElementById("detalheVendaSubtotal").textContent =
        `R$ ${subtotal.toFixed(2).replace(".", ",")}`;
      document.getElementById("detalheVendaDesconto").textContent =
        `R$ ${desconto.toFixed(2).replace(".", ",")}`;
      document.getElementById("detalheVendaTotal").textContent =
        `R$ ${total.toFixed(2).replace(".", ",")}`;

      // ===============================
      //  ABRIR MODAL SEM TRAVAR
      // ===============================
      document.querySelectorAll(".modal-backdrop")?.forEach(b => b.remove());
      document.body.classList.remove("modal-open");
      document.body.style.overflow = "";

      const modalEl = document.getElementById("purchaseDetailsModal");
      const prevModal = bootstrap.Modal.getInstance(modalEl);
      if (prevModal) prevModal.hide();

      const modal = new bootstrap.Modal(modalEl);
      modal.show();

    } catch (err) {
      console.error("❌ Erro ao carregar detalhes da venda:", err);
    }
  });
}

// ==========================================================
// 7 - PÁGINA: INATIVOS (Clientes Não Recorrentes)
// ==========================================================
if (window.location.pathname.includes("inativos.html")) {
  initInativos();
}

function initInativos() {
  const API_BASE = "http://projetovendamais-production.up.railway.app";

  const tabela = document.getElementById("tabelaInativos");
  const searchInput = document.getElementById("searchInativos");
  const filtroPeriodo = document.querySelectorAll(".filtro-periodo");
  const paginacao = document.getElementById("paginacaoInativos");

  let listaCompleta = [];
  let listaFiltrada = [];
  let paginaAtual = 1;
  const pageSize = 10;

  // ======================================================
  // 🚀 Carrega inicial (>= 5 dias)
  // ======================================================
  carregarInativos();

  // ======================================================
  // 🔎 Busca dinâmica
  // ======================================================
  searchInput?.addEventListener("input", () => {
    filtrarLista(searchInput.value.trim());
    renderTabela();
    renderPaginacao();
  });

  // ======================================================
  // 📆 Filtro por período
  // ======================================================
  filtroPeriodo.forEach(item => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      const dias = item.dataset.periodo;
      carregarPorPeriodo(dias);
    });
  });
  // ======================================================
  // 🔄 Carregar lista geral
  // ======================================================
  async function carregarInativos() {
    try {
      const resp = await fetch(`${API_BASE}/api/consultas/inativos`);
      const lista = await resp.json();

      listaCompleta = lista;
      listaFiltrada = lista;

      paginaAtual = 1;
      renderTabela();
      renderPaginacao();
    } catch (err) {
      console.error("❌ Erro ao carregar inativos:", err);
    }
  }

  // ======================================================
  // 🔄 Carregar lista por período
  // ======================================================
  async function carregarPorPeriodo(dias) {
    try {
      const resp = await fetch(`${API_BASE}/api/consultas/inativos/${dias}`);
      const lista = await resp.json();

      listaCompleta = lista;
      listaFiltrada = lista;

      paginaAtual = 1;
      renderTabela();
      renderPaginacao();

    } catch (err) {
      console.error("❌ Erro ao filtrar por período:", err);
    }
  }
  // ======================================================
  // 🔎 Filtro local da busca dinâmica
  // ======================================================
  function filtrarLista(texto) {
    if (!texto) {
      listaFiltrada = listaCompleta;
      return;
    }

    const valor = texto.toLowerCase().trim();
    const valorNum = texto.replace(/\D/g, ""); // só dígitos para CPF/ID

    listaFiltrada = listaCompleta.filter(c => {
      const nome = (c.nome || "").toLowerCase();
      const cpfLimpo = (c.cpf || "").replace(/\D/g, "");
      const idStr = c.idCliente != null ? String(c.idCliente) : "";

      const nomeMatch = nome.includes(valor);

      // Só tenta bater CPF/ID se tiver número digitado
      const cpfMatch = valorNum ? cpfLimpo.includes(valorNum) : false;
      const idMatch = valorNum ? idStr.includes(valorNum) : false;

      return nomeMatch || cpfMatch || idMatch;
    });
  }

  // ======================================================
  // 🔖 Badge automática
  // ======================================================
  function gerarBadgeDias(dias) {
    if (dias >= 90) return `<span class="badge bg-danger">${dias} dias</span>`;
    if (dias >= 60) return `<span class="badge bg-warning text-dark">${dias} dias</span>`;
    if (dias >= 30) return `<span class="badge bg-primary">${dias} dias</span>`;
    return `<span class="badge bg-info text-dark">${dias} dias</span>`;
  }

  // ======================================================
  // 🖥️ Renderizar tabela com paginação
  // ======================================================
  function renderTabela() {
    tabela.innerHTML = "";

    if (listaFiltrada.length === 0) {
      tabela.innerHTML = `
          <tr>
              <td colspan="7" class="text-center py-3 text-muted">
                  Nenhum cliente encontrado.
              </td>
          </tr>`;
      return;
    }

    const inicio = (paginaAtual - 1) * pageSize;
    const fim = inicio + pageSize;
    const pagina = listaFiltrada.slice(inicio, fim);

    pagina.forEach(cli => {
      const tr = document.createElement("tr");

      // badge de status
      const badgeStatus = cli.statusCliente === "INATIVO"
        ? `<span class="badge bg-danger">INATIVO</span>`
        : `<span class="badge bg-success">ATIVO</span>`;

      tr.innerHTML = `
      <td>${cli.idCliente}</td>
      <td>${cli.nome}</td>
      <td>${badgeStatus}</td>
      <td>${cli.ultimaCompra || "—"}</td>
      <td>${gerarBadgeDias(cli.diasInativo)}</td>
      <td>${cli.telefone1 || "—"}</td>

      <td class="text-center">

          <a href="https://wa.me/55${cli.telefone1?.replace(/\D/g, "")}"
             target="_blank"
             class="btn btn-sm btn-success"
             title="Enviar WhatsApp">
              <i class="fab fa-whatsapp"></i>
          </a>

          <button class="btn btn-sm btn-outline-info btn-ver-ultima-venda"
                  data-id="${cli.idCliente}"
                  title="Ver última venda">
              <i class="fas fa-eye"></i>
          </button>

      </td>
  `;

      tabela.appendChild(tr);
    });

  }

  // ======================================================
  // 📄 Paginação padrão do sistema (idêntico às outras páginas)
  // ======================================================
  function renderPaginacao() {
    paginacao.innerHTML = "";

    const totalPaginas = Math.ceil(listaFiltrada.length / pageSize);
    if (totalPaginas <= 1) return;

    const addBtn = (label, disabled, onClick) => {
      const li = document.createElement("li");
      li.className = `page-item ${disabled ? "disabled" : ""}`;
      li.innerHTML = `<a class="page-link" href="#">${label}</a>`;
      li.onclick = e => {
        e.preventDefault();
        if (!disabled) onClick();
      };
      paginacao.appendChild(li);
    };

    addBtn("«", paginaAtual === 1, () => {
      paginaAtual--;
      renderTabela();
      renderPaginacao();
    });

    for (let p = 1; p <= totalPaginas; p++) {
      const li = document.createElement("li");
      li.className = `page-item ${p === paginaAtual ? "active" : ""}`;
      li.innerHTML = `<a class="page-link" href="#">${p}</a>`;
      li.onclick = e => {
        e.preventDefault();
        paginaAtual = p;
        renderTabela();
        renderPaginacao();
      };
      paginacao.appendChild(li);
    }

    addBtn("»", paginaAtual === totalPaginas, () => {
      paginaAtual++;
      renderTabela();
      renderPaginacao();
    });
  }

  // ======================================================
  // 🔍 Ação: Abrir modal da última venda
  // ======================================================
  tabela?.addEventListener("click", (e) => {
    const btn = e.target.closest(".btn-ver-ultima-venda");
    if (!btn) return;

    const idCliente = Number(btn.dataset.id);
    abrirModalUltimaVenda(idCliente);
  });

  async function abrirModalUltimaVenda(idCliente) {
    try {
      const resp = await fetch(`${API_BASE}/api/consultas/inativos/ultima-venda/${idCliente}`);
      const venda = await resp.json();

      document.getElementById("lastSaleCliente").textContent = venda.cliente;
      document.getElementById("lastSaleData").textContent = venda.dataVenda;
      document.getElementById("lastSaleId").textContent = venda.idVenda;

      document.getElementById("lastSaleTotal").textContent =
        `R$ ${parseFloat(venda.valorTotal).toFixed(2).replace(".", ",")}`;

      const tbody = document.getElementById("lastSaleItens");
      tbody.innerHTML = "";

      venda.itens.forEach(item => {
        tbody.innerHTML += `
                    <tr>
                        <td>${item.produto}</td>
                        <td>${item.quantidade}</td>
                        <td class="text-end">R$ ${parseFloat(item.precoUnitario).toFixed(2).replace(".", ",")}</td>
                        <td class="text-end">R$ ${parseFloat(item.subtotal).toFixed(2).replace(".", ",")}</td>
                    </tr>`;
      });

      const modalEl = document.getElementById("lastSaleDetailsModal");
      const modal = new bootstrap.Modal(modalEl);
      modal.show();

    } catch (err) {
      console.error("❌ Erro ao abrir modal:", err);
      alert("Erro ao carregar detalhes da última venda.");
    }
  }
}
// ==========================================================
// 8 - DASHBOARD
// ==========================================================
if (window.location.pathname.includes("dashboard.html")) {
  initDashboard();
}
async function initDashboard() {
  const API_BASE = "http://projetovendamais-production.up.railway.app";

  // ELEMENTOS DO DASHBOARD — IDs CORRETOS
  const totalVendasEl = document.getElementById("cardTotalVendas");
  const produtosVendidosEl = document.getElementById("cardProdutosVendidos");
  const ticketMedioEl = document.getElementById("cardTicketMedio");
  const clientesAtendidosEl = document.getElementById("cardClientesAtendidos");
  const rankingBody = document.getElementById("rankingClientes");

  const filtroBtns = document.querySelectorAll(".dashboard-filter");

  // ============================
  // 🔄 Função principal de carga
  // ============================
  async function carregarDashboard(filtro = "mes") {
    try {
      const resp = await fetch(`${API_BASE}/api/dashboard?filtro=${filtro}`);
      const dados = await resp.json();

      // RENDERIZAÇÃO DOS CARTÕES
      totalVendasEl.textContent = `R$ ${dados.totalVendas.toFixed(2).replace(".", ",")}`;
      produtosVendidosEl.textContent = dados.produtosVendidos;
      ticketMedioEl.textContent = `R$ ${dados.ticketMedio.toFixed(2).replace(".", ",")}`;
      clientesAtendidosEl.textContent = dados.clientesAtendidos;

      // RANKING TOP CLIENTES
      rankingBody.innerHTML = "";

      if (!dados.rankingClientes || dados.rankingClientes.length === 0) {
        rankingBody.innerHTML = `
        <tr>
            <td colspan="4" class="text-center text-muted py-3">
                Nenhum dado encontrado para este período.
            </td>
        </tr>`;
      } else {
        dados.rankingClientes.forEach((cli, index) => {

          // 🔥 Correção DEFINITIVA:
          // totalGasto pode vir como string → convertemos para Number SEM ERRO
          const total = Number(cli.totalGasto || 0);

          rankingBody.innerHTML += `
            <tr>
                <td><strong>${index + 1}º</strong></td>
                <td>${cli.nome}</td>
                <td>${cli.cpf || "—"}</td>
                <td class="text-end">R$ ${total.toFixed(2).replace(".", ",")}</td>
            </tr>
        `;
        });
      }

    } catch (err) {
      console.error("❌ Erro ao carregar dashboard:", err);
    }
  }

  // ============================
  // 🎚️ Filtros: Mês, Semestre, Ano
  // ============================
  filtroBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const filtro = btn.dataset.filtro;

      filtroBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      document.getElementById("textoFiltro").textContent = btn.textContent;

      carregarDashboard(filtro);
    });
  });

  // Carregar inicialmente
  carregarDashboard("mes");
}
// ==========================================================
//  EXECUÇÃO AUTOMÁTICA POR PÁGINA
// ==========================================================
document.addEventListener("DOMContentLoaded", () => {
  const hasLogin = !!document.getElementById("formLogin");
  const hasCliente =
    !!document.getElementById("clienteForm") &&
    !!document.getElementById("listaClientesBody");
  const hasProduto =
    !!document.getElementById("formProduto") &&
    !!document.getElementById("tabelaProdutos");
  const hasVenda = !!document.getElementById("tabelaVendas");

  if (hasLogin) inicializarLogin();
  if (hasCliente) inicializarCadastroClientes();
  if (hasProduto) inicializarCadastroProdutos();
  if (hasVenda) inicializarRegistroVendas();


  console.log(
    "[INIT] login:",
    hasLogin,
    "| clientes:",
    hasCliente,
    "| produtos:",
    hasProduto,
    "| vendas:",
    hasVenda
  );
});

window.addEventListener("error", (e) => {
  console.error(
    "[JS Error]",
    e.message,
    e.filename + ":" + e.lineno + ":" + e.colno
  );
});
