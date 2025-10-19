const mysql = require('mysql2');

// Configuração da conexão com o banco de dados
const connection = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'Flamengo23!', 
  database: 'venda_mais'
}).promise(); // Usar .promise() para facilitar as queries

// Função para testar a conexão
async function testConnection() {
    try {
        await connection.query('SELECT 1');
        console.log('Conexão com o banco de dados MySQL estabelecida com sucesso!');
    } catch (error) {
        console.error('Erro ao conectar ao banco de dados:', error);
    }
}

testConnection();

// Exporta a conexão para ser usada em outros arquivos
module.exports = connection;