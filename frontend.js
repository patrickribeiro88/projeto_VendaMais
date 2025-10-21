// ==========================================================
// =============== FRONTEND.JS - VENDA+ =====================
// ==========================================================
// Responsável por conectar o FRONT-END (HTML) com o BACK-END (Express + MySQL)
// ==========================================================

// ===================== LOGIN =====================
document.addEventListener('DOMContentLoaded', () => {
  const formLogin = document.getElementById('formLogin');

  if (formLogin) {
    formLogin.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = document.getElementById('email').value.trim();
      const senha = document.getElementById('senha').value.trim();

      if (!email || !senha) {
        alert('Por favor, preencha todos os campos.');
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

// ===================== CADASTRO DE CLIENTE =====================
document.addEventListener('DOMContentLoaded', () => {
  const formCliente = document.getElementById('formCliente');

  if (formCliente) {
    formCliente.addEventListener('submit', async (e) => {
      e.preventDefault();

      const formData = new FormData(formCliente);
      const cliente = Object.fromEntries(formData.entries());

      // Validação simples antes de enviar
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
          listarClientes(); // Atualiza a lista logo após o cadastro
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

// ===================== LISTAR CLIENTES =====================
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

// Executa a função automaticamente ao carregar a página que tiver a tabela
document.addEventListener('DOMContentLoaded', listarClientes);
