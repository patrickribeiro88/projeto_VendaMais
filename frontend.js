// ==========================================================
// =============== FRONTEND.JS - VENDA+ =====================
// ==========================================================
// Conecta FRONT-END (HTML) com BACK-END (Express + MySQL)
// ==========================================================

// ==========================================================
// ===================== LOGIN ===============================
// ==========================================================
document.addEventListener('DOMContentLoaded', () => {
  const formLogin = document.getElementById('formLogin');

  if (formLogin) {
    formLogin.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = document.getElementById('email').value.trim();
      const senha = document.getElementById('senha').value.trim();

      if (!email || !senha) {
        alert('⚠️ Por favor, preencha todos os campos.');
        return;
      }

      try {
        const response = await fetch('http://localhost:3000/api/vendedor/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, senha }),
        });

        const data = await response.json();

        if (response.ok) {
          alert('✅ Login realizado com sucesso!');
          window.location.href = 'dashboard.html';
        } else {
          alert('❌ ' + data.message);
        }
      } catch (error) {
        console.error('Erro de conexão com o servidor:', error);
        alert('Erro de conexão com o servidor. Tente novamente.');
      }
    });
  }
});

// ==========================================================
// ===================== CLIENTES ============================
// ==========================================================
document.addEventListener('DOMContentLoaded', () => {
  const formCliente = document.getElementById('formCliente');

  if (formCliente) {
    formCliente.addEventListener('submit', async (e) => {
      e.preventDefault();

      const formData = new FormData(formCliente);
      const cliente = Object.fromEntries(formData.entries());

      if (!cliente.nome || !cliente.email || !cliente.telefone1) {
        alert('⚠️ Campos obrigatórios: nome, telefone e e-mail.');
        return;
      }

      try {
        const response = await fetch('http://localhost:3000/api/clientes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cliente),
        });

        const data = await response.json();

        if (response.ok) {
          alert('✅ Cliente cadastrado com sucesso!');
          formCliente.reset();
          listarClientes();
        } else {
          alert('❌ ' + data.message);
        }
      } catch (error) {
        console.error('Erro ao cadastrar cliente:', error);
        alert('Erro ao cadastrar cliente. Verifique o servidor.');
      }
    });
  }
});

async function listarClientes() {
  const tabelaClientes = document.getElementById('tabelaClientes');
  if (!tabelaClientes) return;

  try {
    const response = await fetch('http://localhost:3000/api/clientes');
    if (!response.ok) throw new Error('Falha ao buscar clientes');

    const clientes = await response.json();

    if (!Array.isArray(clientes) || clientes.length === 0) {
      tabelaClientes.innerHTML = `
        <tr>
          <td colspan="6" class="text-center text-muted">Nenhum cliente cadastrado ainda.</td>
        </tr>`;
      return;
    }

    tabelaClientes.innerHTML = clientes.map(c => `
      <tr>
        <td>${c.idCliente}</td>
        <td>${c.nome}</td>
        <td>${c.dataNascimento || '-'}</td>
        <td>${c.telefone1 || '-'}</td>
        <td>${c.email || '-'}</td>
        <td class="text-center">
          <button class="btn btn-sm btn-outline-primary" title="Editar">
            <i class="fas fa-pencil-alt"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger" title="Inativar Cliente">
            <i class="fas fa-user-slash"></i>
          </button>
        </td>
      </tr>
    `).join('');

  } catch (error) {
    console.error('Erro ao listar clientes:', error);
    tabelaClientes.innerHTML = `
      <tr>
        <td colspan="6" class="text-center text-danger">Erro ao carregar lista de clientes.</td>
      </tr>`;
  }
}

document.addEventListener('DOMContentLoaded', listarClientes);

// ==========================================================
// ===================== PRODUTOS ============================
// ==========================================================

let produtoEditando = null; // Guarda o ID do produto em edição

document.addEventListener('DOMContentLoaded', () => {
  const formProduto = document.getElementById('formProduto');
  const btnSalvar = document.getElementById('btnSalvarProduto');
  const btnCancelar = document.getElementById('btnCancelarEdicao');

  if (formProduto) {
    formProduto.addEventListener('submit', async (e) => {
      e.preventDefault();

      const formData = new FormData(formProduto);
      const produto = Object.fromEntries(formData.entries());

      if (!produto.nome || !produto.precoVenda) {
        alert('⚠️ Preencha os campos obrigatórios: nome e preço.');
        return;
      }

      try {
        const url = produtoEditando
          ? `http://localhost:3000/api/produtos/${produtoEditando}`
          : 'http://localhost:3000/api/produtos';

        const method = produtoEditando ? 'PUT' : 'POST';

        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(produto),
        });

        const data = await response.json();

        if (response.ok) {
          alert(produtoEditando ? '✏️ Produto atualizado com sucesso!' : '✅ Produto cadastrado com sucesso!');
          formProduto.reset();
          produtoEditando = null;

          // Restaura os botões
          if (btnSalvar) {
            btnSalvar.textContent = 'Salvar Produto';
            btnSalvar.classList.replace('btn-warning', 'btn-primary');
          }
          if (btnCancelar) btnCancelar.classList.add('d-none');

          listarProdutos();
        } else {
          alert('❌ ' + data.message);
        }
      } catch (error) {
        console.error('Erro ao salvar produto:', error);
        alert('Erro ao salvar produto. Verifique o servidor.');
      }
    });
  }

  // Botão cancelar edição
  if (btnCancelar) {
    btnCancelar.addEventListener('click', () => {
      formProduto.reset();
      produtoEditando = null;
      btnSalvar.textContent = 'Salvar Produto';
      btnSalvar.classList.replace('btn-warning', 'btn-primary');
      btnCancelar.classList.add('d-none');
    });
  }
});

// ----------- LISTAR PRODUTOS ------------
async function listarProdutos() {
  const tabelaProdutos = document.getElementById('tabelaProdutos');
  if (!tabelaProdutos) return;

  try {
    const response = await fetch('http://localhost:3000/api/produtos');
    if (!response.ok) throw new Error('Falha ao buscar produtos');

    const produtos = await response.json();

    if (!Array.isArray(produtos) || produtos.length === 0) {
      tabelaProdutos.innerHTML = `
        <tr>
          <td colspan="5" class="text-center text-muted">Nenhum produto cadastrado ainda.</td>
        </tr>`;
      return;
    }

    tabelaProdutos.innerHTML = produtos.map(p => `
      <tr>
        <td>${p.idProduto}</td>
        <td>${p.nome}</td>
        <td>${p.categoria || '-'}</td>
        <td>R$ ${parseFloat(p.precoVenda).toFixed(2).replace('.', ',')}</td>
        <td class="text-center">
          <button class="btn btn-sm btn-outline-primary" title="Editar" onclick="editarProduto(${p.idProduto})">
            <i class="fas fa-pencil-alt"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger" title="Excluir Produto" onclick="excluirProduto(${p.idProduto})">
            <i class="fas fa-trash-alt"></i>
          </button>
        </td>
      </tr>
    `).join('');

  } catch (error) {
    console.error('Erro ao listar produtos:', error);
    tabelaProdutos.innerHTML = `
      <tr>
        <td colspan="5" class="text-center text-danger">Erro ao carregar lista de produtos.</td>
      </tr>`;
  }
}

document.addEventListener('DOMContentLoaded', listarProdutos);

// ----------- EDITAR PRODUTO ------------
async function editarProduto(id) {
  try {
    const response = await fetch(`http://localhost:3000/api/produtos/${id}`);
    if (!response.ok) throw new Error('Produto não encontrado');

    const p = await response.json();

    // Preenche os campos do formulário
    document.getElementById('nome').value = p.nome || '';
    document.getElementById('categoria').value = p.categoria || '';
    document.getElementById('precoVenda').value = p.precoVenda || '';

    produtoEditando = id;

    const btnSalvar = document.getElementById('btnSalvarProduto');
    const btnCancelar = document.getElementById('btnCancelarEdicao');

    if (btnSalvar) {
      btnSalvar.textContent = 'Salvar Alterações';
      btnSalvar.classList.replace('btn-primary', 'btn-warning');
    }
    if (btnCancelar) btnCancelar.classList.remove('d-none');

    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (error) {
    console.error('Erro ao editar produto:', error);
    alert('Erro ao carregar produto para edição.');
  }
}

// ----------- EXCLUIR PRODUTO ------------
async function excluirProduto(id) {
  if (!confirm('Deseja realmente excluir este produto?')) return;

  try {
    const response = await fetch(`http://localhost:3000/api/produtos/${id}`, { method: 'DELETE' });
    const data = await response.json();

    if (response.ok) {
      alert('🗑️ Produto excluído com sucesso!');
      listarProdutos();
    } else {
      alert('❌ ' + data.message);
    }
  } catch (error) {
    console.error('Erro ao excluir produto:', error);
    alert('Erro ao excluir produto. Verifique o servidor.');
  }
}
