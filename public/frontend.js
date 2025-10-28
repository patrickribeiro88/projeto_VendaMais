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
// 1️⃣ HELPERS COMUNS
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
// 2️⃣ LOGIN
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
      const resp = await fetch("http://localhost:3000/api/vendedor/login", {
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
// 3️⃣ CLIENTES (CRUD + Validações + Paginação)
// ==========================================================
function inicializarCadastroClientes() {
  console.log("✅ Página: cadastro-cliente.html detectada");

  const form = document.getElementById("clienteForm");
  const feedback = document.getElementById("feedbackMessage");
  const tabela = document.getElementById("listaClientesBody");
  const cancelarBtn = document.getElementById("cancelarBtn");
  const submitBtn = document.getElementById("submitBtn");

  if (!form) return;

  let todosClientes = [];
  let filtrados = [];
  let clienteEditando = null;
  let currentPage = 1;
  const pageSize = 10;

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
    clienteTelefone2: (v) => v.trim() === "" || /^\d{10,11}$/.test(v),
    clienteEmail: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
  };

  function validarCampos() {
    let ok = true;
    Object.entries(camposRegras).forEach(([id, fn]) => {
      const el = document.getElementById(id);
      const val = el.value || "";
      const pass = fn(val);
      el.classList.toggle("is-invalid", !pass);
      el.classList.toggle("is-valid", pass);
      if (!pass && el.hasAttribute("required")) ok = false;
    });
    const tel2 = document.getElementById("clienteTelefone2");
    if (tel2.value.trim() === "")
      tel2.classList.remove("is-valid", "is-invalid");
    return ok;
  }

  aplicarMascaraNumerica([
    "clienteCpf",
    "clienteCep",
    "clienteTelefone1",
    "clienteTelefone2",
    "clienteNumero",
  ]);

  Object.keys(camposRegras).forEach((id) => {
    const el = document.getElementById(id);
    el?.addEventListener("blur", validarCampos);
  });

  async function fetchClientes() {
    if (!tabela) return;
    tabela.innerHTML = '<tr><td colspan="6">Carregando...</td></tr>';
    try {
      const resp = await fetch("http://localhost:3000/api/clientes");
      const data = await resp.json();
      todosClientes = Array.isArray(data) ? data : [];
      aplicarFiltroEPaginar();
    } catch {
      tabela.innerHTML =
        '<tr><td colspan="6" class="text-danger text-center">Erro ao carregar clientes.</td></tr>';
    }
  }

  function aplicarFiltroEPaginar() {
    const termo =
      (document.getElementById("pesquisarInput")?.value || "").toLowerCase().trim();

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

  function renderTabelaPaginada() {
    if (!tabela) return;
    const page = getPaginaAtual();

    if (!page.length) {
      tabela.innerHTML =
        '<tr><td colspan="6" class="text-center">Nenhum cliente encontrado.</td></tr>';
      return;
    }

    tabela.innerHTML = "";
    page.forEach((c) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${c.idCliente}</td>
        <td>${c.nome}</td>
        <td>${c.dataNascimento || ""}</td>
        <td>${c.telefone1 || ""}</td>
        <td>${c.email || ""}</td>
        <td class="text-center">
          <button class="btn btn-sm btn-outline-primary me-2" title="Editar" onclick="editarCliente(${c.idCliente})">
            <i class="fas fa-pencil-alt"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger" title="Inativar" onclick="inativarCliente(${c.idCliente})">
            <i class="fas fa-user-slash"></i>
          </button>
        </td>`;
      tabela.appendChild(tr);
    });
  }

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

  window.editarCliente = async function (id) {
    try {
      const resp = await fetch(`http://localhost:3000/api/clientes/${id}`);
      if (!resp.ok) return flash("Cliente não encontrado.", "danger");
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
        const el = document.getElementById(id);
        if (el) el.value = val || "";
      });

      submitBtn.textContent = "Salvar Alterações";
      submitBtn.classList.replace("btn-primary", "btn-warning");
      cancelarBtn.classList.remove("d-none");
      window.scrollTo({ top: 0, behavior: "smooth" });
      limparValidacoes();
    } catch {
      flash("Erro ao carregar cliente.", "danger");
    }
  };

  cancelarBtn?.addEventListener("click", () => {
    clienteEditando = null;
    form.reset();
    submitBtn.textContent = "Cadastrar Cliente";
    submitBtn.classList.replace("btn-warning", "btn-primary");
    cancelarBtn.classList.add("d-none");
    limparValidacoes();
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!validarCampos())
      return flash("Por favor, corrija os campos em vermelho.", "danger");

    const dados = Object.fromEntries(new FormData(form).entries());
    const url = clienteEditando
      ? `http://localhost:3000/api/clientes/${clienteEditando}`
      : "http://localhost:3000/api/clientes";
    const method = clienteEditando ? "PUT" : "POST";

    try {
      const resp = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
      });
      const result = await resp.json();

      if (resp.ok) {
        flash(result.message || "✅ Cliente salvo com sucesso!");
        form.reset();
        clienteEditando = null;
        submitBtn.textContent = "Cadastrar Cliente";
        submitBtn.classList.replace("btn-warning", "btn-primary");
        cancelarBtn.classList.add("d-none");
        limparValidacoes();
        await fetchClientes();
      } else {
        flash(result.message || "Erro ao salvar.", "danger");
      }
    } catch {
      flash("Erro ao conectar com o servidor.", "danger");
    }
  });

  window.inativarCliente = async function (id) {
    if (!confirm("Deseja realmente inativar este cliente?")) return;
    try {
      const resp = await fetch(
        `http://localhost:3000/api/clientes/${id}/inativar`,
        { method: "PATCH" }
      );
      const result = await resp.json();
      if (resp.ok) {
        flash(result.message || "Cliente inativado!");
        await fetchClientes();
      } else {
        flash(result.message || "Erro ao inativar.", "danger");
      }
    } catch {
      flash("Erro ao inativar cliente.", "danger");
    }
  };

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

  fetchClientes();
}

// ==========================================================
// 4️⃣ PRODUTOS (CRUD + Validação + Paginação + Máscara de preço)
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

  // Aplica a máscara no campo de preço
  const precoInput = document.getElementById("precoVenda");
  if (precoInput) aplicarMascaraPreco(precoInput);

  // ========== Função de mensagem ==========
  function flash(msg, type = "success", ms = 4000) {
    if (!feedback) return;
    feedback.innerHTML = `<div class="alert alert-${type}">${msg}</div>`;
    setTimeout(() => (feedback.innerHTML = ""), ms);
  }

  // ========== Validação ==========
  function validarCampos() {
    const nome = form.nome.value.trim();
    const preco = form.precoVenda.value.trim();

    const okNome = nome !== "";
    const okPreco = /^\D*[\d.,]+$/.test(preco);

    form.nome.classList.toggle("is-invalid", !okNome);
    form.nome.classList.toggle("is-valid", okNome);
    form.precoVenda.classList.toggle("is-invalid", !okPreco);
    form.precoVenda.classList.toggle("is-valid", okPreco);

    return okNome && okPreco;
  }

  // ========== Buscar Produtos ==========
  async function fetchProdutos() {
    tabela.innerHTML = `<tr><td colspan="5" class="text-center">Carregando...</td></tr>`;
    try {
      const resp = await fetch("http://localhost:3000/api/produtos");
      const data = await resp.json();
      todosProdutos = Array.isArray(data) ? data : [];
      aplicarFiltroEPaginar();
    } catch {
      tabela.innerHTML = `<tr><td colspan="5" class="text-center text-danger">Erro ao carregar produtos.</td></tr>`;
    }
  }

  // ========== Filtro e Paginação ==========
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
        <td>R$ ${parseFloat(p.precoVenda).toFixed(2).replace(".", ",")}</td>
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
    if (!validarCampos())
      return flash("⚠️ Corrija os campos em vermelho.", "danger");

    const dados = Object.fromEntries(new FormData(form).entries());

    // Remove formatação de preço antes de enviar
    if (dados.precoVenda) {
      dados.precoVenda = dados.precoVenda
        .replace("R$", "")
        .replace(/\s/g, "")
        .replace(",", ".");
    }

    const url = produtoEditando
      ? `http://localhost:3000/api/produtos/${produtoEditando}`
      : "http://localhost:3000/api/produtos";
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
        document
          .querySelectorAll(".is-valid, .is-invalid")
          .forEach((el) => el.classList.remove("is-valid", "is-invalid"));
        fetchProdutos();
      } else flash(result.message || "Erro ao salvar.", "danger");
    } catch {
      flash("Erro ao conectar com o servidor.", "danger");
    }
  });

  // Editar
  window.editarProduto = async function (id) {
    try {
      const resp = await fetch(`http://localhost:3000/api/produtos/${id}`);
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
    document
      .querySelectorAll(".is-valid, .is-invalid")
      .forEach((el) => el.classList.remove("is-valid", "is-invalid"));
  });

  // Excluir
  window.excluirProduto = async function (id) {
    if (!confirm("Deseja realmente excluir este produto?")) return;
    try {
      const resp = await fetch(`http://localhost:3000/api/produtos/${id}`, {
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
// 5️⃣ EXECUÇÃO AUTOMÁTICA POR PÁGINA
// ==========================================================
document.addEventListener("DOMContentLoaded", () => {
  const hasLogin = !!document.getElementById("formLogin");
  const hasCliente =
    !!document.getElementById("clienteForm") &&
    !!document.getElementById("listaClientesBody");
  const hasProduto =
    !!document.getElementById("formProduto") &&
    !!document.getElementById("tabelaProdutos");

  if (hasLogin) inicializarLogin();
  if (hasCliente) inicializarCadastroClientes();
  if (hasProduto) inicializarCadastroProdutos();

  console.log(
    "[INIT] login:",
    hasLogin,
    "| clientes:",
    hasCliente,
    "| produtos:",
    hasProduto
  );
});

window.addEventListener("error", (e) => {
  console.error(
    "[JS Error]",
    e.message,
    e.filename + ":" + e.lineno + ":" + e.colno
  );
});