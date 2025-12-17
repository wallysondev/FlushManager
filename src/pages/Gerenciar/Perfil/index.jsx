import React, { useState, useEffect } from 'react';

import './style.css';
import { Sidebar } from '../../../components/Sidebar/Sidebar';

import { SCREENS } from '../../../utils/Permissoes';
import Api from '../../../services/api';
import { jwtDecode } from 'jwt-decode';

function Perfil() {
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [pagina, setPagina] = useState(0);
  const [search, setSearch] = useState("");

  const [roleSelecionada, setRoleSelecionada] = useState(null);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState(null);
  const [perfilpadrao, setPerfilpadrao] = useState(null);

  const [nomeConfirmacao, setNomeConfirmacao] = useState("");

  // Estados dos modais
  const [modalEditar, setModalEditar] = useState(false);
  const [modalDeletar, setModalDeletar] = useState(false);

  const PER_PAGE = 9;

  const usuariosFiltrados = usuarios.filter(
    (u) =>
      u.nome.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const totalPaginas = Math.ceil(usuariosFiltrados.length / PER_PAGE);
  const inicio = pagina * PER_PAGE;
  const fim = inicio + PER_PAGE;
  const permissoesPagina = usuariosFiltrados.slice(inicio, fim);

  // Cadastro e importacao
  const [modalCadastrar, setModalCadastrar] = useState(false);
  const [modalImportar, setModalImportar] = useState(false);

  // Estados dos formulários
  const [novoUsuario, setNovoUsuario] = useState({
    nome: "",
    email: "",
    senha: "",
    rolecodigo: "",
    status: true,
  });

  const [matriculaImportar, setMatriculaImportar] = useState("");

  useEffect(() => {
    const GetUsuarios = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Token não encontrado, faça login.');

        const response = await Api.get('/Usuario', {
          headers: { Authorization: `Bearer ${token}` }
        });

        var datausers = response.data.users;
        if (!datausers) throw new Error('Nenhum usuario foi encontrado!');

        const roleresponse = await Api.get('/Roles', {
          headers: { Authorization: `Bearer ${token}` }
        });

        var dataroles = roleresponse.data.perfis;
        if (!dataroles) throw new Error('Nenhum perfil foi encontrado!');

        if (dataroles.length > 0) setRoles(dataroles);

        const usuariosComRole = datausers.map(user => {
          const item = dataroles.find(r => r.codigo === user.rolecodigo);
          return {
            ...user,
            roleName: item ? item.role : "Sem perfil"
          };
        });

        if (usuariosComRole.length > 0) setUsuarios(usuariosComRole);
      } catch (error) {
        console.error('Erro ao carregar perfis:', error);
      }
    };

    GetUsuarios();
  }, []);

  // Variavel utilizada para gerenciar as permissoes do usuario
  const [rolePermissao, setRolePermissao] = useState([]);

  // Carregar todos os perfis
  useEffect(() => {
    const carregarRoles = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Token não encontrado, faça login.');

        // Rota de perfis da API
        const resRoles = await Api.get('/Roles', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Filtrando somente os perfis que estão ativos na rota.
        const perfisAtivos = resRoles.data.perfis.filter(p => p.status === 'A');
        
        // Pega qual a role do usuario que esta no token
        const decodedToken = jwtDecode(token);

        // Atualiza os estados com os dados do token
        const perfildefault = perfisAtivos.find(p => p.role === decodedToken.role);
        setPerfilpadrao(perfildefault);

        // consulta as permissoes disponiveis do usuario
        const resRolePerm = await Api.post(`/RolePermissao`, 
          { rolename: perfildefault.role }, // corpo da requisição
          { headers: { Authorization: `Bearer ${token}` } } // headers
        );

        // Retorna todas as permissões do perfil do usuario
        const dataRolePerm = resRolePerm.data.permissoes;

        // Seta todas as permissões da role do usuario.
        setRolePermissao(dataRolePerm);
      } catch (error) {
        console.error('Erro ao carregar perfis:', error);
      }
    };
    carregarRoles();
  }, []);

  const handleCadastrarUsuario = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Token não encontrado, faça login.");

      const dados = {
        nome: novoUsuario.nome,
        password: novoUsuario.senha, // no backend é "password", não "senha"
        email: novoUsuario.email,
        rolecodigo: novoUsuario.rolecodigo,
      };

      const response = await Api.post("/Usuario", dados, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.sucesso) {
        // Atualiza a lista de usuários em tela
        setUsuarios((prev) => [...prev, response.data.usuario]);

        // Fecha modal e limpa campos
        setModalCadastrar(false);
        setNovoUsuario({ nome: "", senha: "", email: "", rolecodigo: "" });
      } else {
        console.error("Erro ao cadastrar:", response.data.mensagem);
      }
    } catch (error) {
      console.error("Erro ao cadastrar usuário:", error);
    }
  };

  const handleDeletarUsuario = async () => {
    if (!usuarioSelecionado?.matricula) {
      console.error("Nenhum usuário selecionado para exclusão.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Token não encontrado, faça login.");

      // Chamada DELETE passando a matrícula na URL
      await Api.delete(`/Usuario/${usuarioSelecionado.matricula}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Atualiza o array de usuários (removendo o deletado)
      setUsuarios((prevUsuarios) =>
        prevUsuarios.filter((u) => u.matricula !== usuarioSelecionado.matricula)
      );

      // Fechar modal e limpar campos
      setModalDeletar(false);
      setNomeConfirmacao("");
      setUsuarioSelecionado(null);
    } catch (error) {
      console.error("Erro ao deletar usuário:", error);
    }
  };

  const handleUpdateUsuario = async () => {
    const dados = {
      matricula: usuarioSelecionado.matricula,
      email: usuarioSelecionado.email,
      rolecodigo: roleSelecionada?.codigo,
      status: usuarioSelecionado.status
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Token não encontrado, faça login.');

      const response = await Api.put(`/Usuario`, dados, { headers: {Authorization: `Bearer ${token}`} });
      setModalEditar(false);
    } catch (error) {
      console.error('Erro ao carregar perfis:', error);
    }

    // Atualiza o array de usuários para refletir imediatamente na tabela
    setUsuarios(prevUsuarios =>
      prevUsuarios.map(u =>
        u.matricula === dados.matricula
          ? { ...u, email: dados.email, rolecodigo: dados.rolecodigo, status: dados.status }
          : u
      )
    );

    // Fechar modal e limpar campo
    setModalDeletar(false);
    setNomeConfirmacao("");
    setUsuarioSelecionado(null);
  };

  const handleImportarUsuario = async () => {
    const dados = {
      matricula: matriculaImportar
    };

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Token não encontrado, faça login.');

      const response = await Api.post(`/Usuario/sincronizar`, dados, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = response.data.usuario;
      if (!data) throw new Error('Não foi encontrada nenhuma resposta da API');

      // Atualiza o array de usuários na tabela
      setUsuarios(prevUsuarios => {
        const usuarioExistente = prevUsuarios.find(u => u.matricula === data.matricula);
        if (usuarioExistente) {
          // Atualiza o usuário existente
          return prevUsuarios.map(u =>
            u.matricula === data.matricula
              ? { ...u, email: data.email, rolecodigo: data.rolecodigo, status: data.status }
              : u
          );
        } else {
          // Adiciona o novo usuário se ainda não estiver na lista
          return [...prevUsuarios, data];
        }
      });

      // Fechar modal e limpar campos
      setModalImportar(false);
      setMatriculaImportar("");
      setUsuarioSelecionado(null);

    } catch (error) {
      console.error('Erro ao importar usuário:', error);
    }
  };

  const togglePermissao = (usuario) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Token não encontrado, faça login.');

    // Alterna entre 'A' e 'I'
    const novostatus = usuario.status === 'A' ? 'I' : 'A';

    // Atualiza o estado do usuário selecionado
    setUsuarioSelecionado(prev => ({ ...prev, status: novostatus }));
  };

  return (
    <main className="grid grid-cols-[220px_1fr] gap-4 p-4 h-screen">
      <Sidebar />
      <div className="bg-stone-50 p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="inline-flex items-center px-1 py-1 uppercase font-bold md:flex">
            <span className="font-bold text-lg text-gray-700">Perfil de usuários</span>
          </div>
        </div>
        <div className="pb-4 grid gap-2 grid-cols-12">
          <div className="col-span-12 p-4 bg-white rounded shadow">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-2 md:mt-0 mb-5">
              <div className="flex gap-2">
                {rolePermissao.find(p => p.permissao === SCREENS.CADASTRARUSUARIO && p.status === 'A') && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setModalCadastrar(true)}
                    className="text-xs uppercase font-bold bg-sky-600 text-white px-4 py-2 hover:bg-sky-700"
                  >
                    Adicionar
                  </button>
                  <button
                    onClick={() => setModalImportar(true)}
                    className="text-xs uppercase font-bold bg-lime-600 text-white px-4 py-2 hover:bg-lime-700"
                  >
                    Importar
                  </button>
                </div>)}
              </div>
              <input
                type="text"
                placeholder="Pesquisar funcionario ou email..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPagina(0);
                }}
                className="w-full sm:w-64 px-3 py-2 shadow-sm text-sm border border-indigo-300 focus:outline-indigo-500"
              />
            </div>

            <table className="min-w-full divide-y divide-gray-200 overflow-x-auto">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Funcionário</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Situação</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Perfil</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email Coorporativo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {permissoesPagina.length > 0 ? (
                  permissoesPagina.map((item) => (
                    <UserDesign
                      key={item.matricula}
                      usuario = {item}
                      onEditar={() => { setUsuarioSelecionado(item); setModalEditar(true); }}
                      onDeletar={() => { setUsuarioSelecionado(item); setModalDeletar(true); }}
                    />
                  ))
                ) : (
                  <tr>
                    <td colSpan={14} className="p-4 text-center text-gray-500">
                      Nenhum item encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Paginação */}
            <div className="flex items-center justify-center space-x-2 mt-4">
              <button
                className="text-xs px-4 py-2 bg-gray-200 disabled:opacity-50"
                disabled={pagina === 0}
                onClick={() => setPagina(prev => Math.max(prev - 1, 0))}
              >
                Anterior
              </button>
              <span className="text-xs text-gray-600">
                {totalPaginas === 0 ? 0 : pagina + 1} de {totalPaginas}
              </span>
              <button
                className="text-xs px-4 py-2 bg-gray-200 disabled:opacity-50"
                disabled={pagina + 1 >= totalPaginas}
                onClick={() => setPagina(prev => Math.min(prev + 1, totalPaginas - 1))}
              >
                Próximo
              </button>
            </div>
          </div>
        </div>
      </div>

      {modalEditar && usuarioSelecionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setModalEditar(false)} // fecha ao clicar fora
          />

          {/* Modal */}
          <div className="relative bg-white rounded-lg p-6 w-96 shadow-lg z-10">
            <h2 className="text-lg font-bold mb-4">Editar Usuário</h2>
            <p className="text-sm mb-4">
              Você está editando <b>{usuarioSelecionado.nome}</b>
            </p>

            {/* Inputs de edição */}
            <div className="space-y-3 ">
              <input
                type="text"
                defaultValue={usuarioSelecionado.nome}
                disabled
                className="w-full rounded px-3 py-2 text-sm border border-indigo-300 focus:outline-indigo-500"
              />
              <input
                type="email"
                value={usuarioSelecionado.email}
                // Cria uma cópia do objeto e atualizar o estado diretamente nele
                onChange={e => setUsuarioSelecionado(prev => ({...prev,  email: e.target.value}))}
                className="w-full rounded px-3 py-2 text-sm border border-indigo-300 focus:outline-indigo-500"
              />
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-sm ">Situacao do usuario</span>
              <ItemPermissao p={usuarioSelecionado} toggle={togglePermissao} />
            </div>

            <select
              className="p-2 text-sm rounded border border-indigo-300 focus:outline-indigo-500"
              value={roleSelecionada?.codigo || ''}
              onChange={e => {
                const selecionada = roles.find(r => r.codigo === Number(e.target.value));
                setRoleSelecionada(selecionada);
              }}>
                
              {roles.filter(r => perfilpadrao.nivel >= r.nivel).map(r => (
                  <option key={r.codigo} value={r.codigo}>
                    {r.role}
                  </option>
              ))}
            </select>


            <div className="flex justify-end gap-2">
              <button
                onClick={() => setModalEditar(false)}
                className="px-4 py-2 bg-gray-200 rounded"
              >
                Cancelar
              </button>
              <button 
                onClick={() => handleUpdateUsuario()}
                className="px-4 py-2 bg-indigo-600 text-white rounded">
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {modalDeletar && usuarioSelecionado && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg p-6 w-96 shadow-lg">
            <h2 className="text-lg font-bold mb-4">Confirmar Exclusão</h2>
            <p className="text-sm mb-4">
              Para excluir o usuário <b>{usuarioSelecionado.nome}</b>, digite o
              nome abaixo para confirmar:
            </p>

            <input
              type="text"
              className="w-full border rounded px-3 py-2 mb-4"
              placeholder="Digite o nome do usuário"
              value={nomeConfirmacao}
              onChange={(e) => setNomeConfirmacao(e.target.value)}
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setModalDeletar(false);
                  setNomeConfirmacao("");
                }}
                className="px-4 py-2 bg-gray-200 rounded"
              >
                Cancelar
              </button>
              <button
                className={`px-4 py-2 rounded text-white ${
                  nomeConfirmacao === usuarioSelecionado.nome
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-red-300 cursor-not-allowed"
                }`}
                disabled={nomeConfirmacao !== usuarioSelecionado.nome}
                onClick={() => handleDeletarUsuario(usuarioSelecionado.matricula)}
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}

      {modalCadastrar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setModalCadastrar(false)}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-lg p-6 w-96 shadow-lg z-10">
            <h2 className="text-lg font-bold mb-4">Cadastrar Usuário</h2>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Nome"
                value={novoUsuario.nome}
                onChange={(e) => setNovoUsuario({ ...novoUsuario, nome: e.target.value })}
                className="w-full rounded px-3 py-2 text-sm border border-indigo-300 focus:outline-indigo-500"
              />
              <input
                type="email"
                placeholder="Email"
                value={novoUsuario.email}
                onChange={(e) => setNovoUsuario({ ...novoUsuario, email: e.target.value })}
                className="w-full rounded px-3 py-2 text-sm border border-indigo-300 focus:outline-indigo-500"
              />
              <input
                type="password"
                placeholder="Senha"
                value={novoUsuario.senha}
                onChange={(e) => setNovoUsuario({ ...novoUsuario, senha: e.target.value })}
                className="w-full rounded px-3 py-2 text-sm border border-indigo-300 focus:outline-indigo-500"
              />
              <select
                className="w-full p-2 text-sm rounded border border-indigo-300 focus:outline-indigo-500"
                value={novoUsuario.rolecodigo}
                onChange={(e) =>
                  setNovoUsuario({ ...novoUsuario, rolecodigo: Number(e.target.value) })
                }
              >
                <option value="">Selecione um perfil</option>
                {roles.filter((item) => item.status === "A").map((r) => (
                  <option key={r.codigo} value={r.codigo}>
                    {r.role}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setModalCadastrar(false)}
                className="px-4 py-2 bg-gray-200 rounded"
              >
                Cancelar
              </button>
              <button
                onClick={handleCadastrarUsuario}
                className="px-4 py-2 bg-indigo-600 text-white rounded"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {modalImportar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setModalImportar(false)}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-lg p-6 w-96 shadow-lg z-10">
            <h2 className="text-lg font-bold mb-4">Importar Usuário</h2>
            <p className="text-sm mb-4">O processo de importação de usuário realiza a integração com o Winthor, recuperando seus dados e disponibilizando-os nesta aplicação.</p>
            <input
              type="text"
              placeholder="Matrícula do funcionário"
              value={matriculaImportar}
              onChange={(e) => setMatriculaImportar(e.target.value)}
              className="w-full rounded px-3 py-2 text-sm border border-indigo-300 focus:outline-indigo-500 mb-4"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setModalImportar(false)}
                className="px-4 py-2 bg-gray-200 rounded"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleImportarUsuario()}
                className="px-4 py-2 bg-lime-600 text-white rounded"
              >
                Importar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default Perfil;

export const UserDesign = ({ usuario, onEditar, onDeletar }) => {
  // Variavel utilizada para gerenciar as permissoes do usuario
  const [rolePermissao, setRolePermissao] = useState([]);
  const [useravatar, setUseravatar] = useState('/logo-shopodonto.svg');

  // Carregar todos os perfis
  useEffect(() => {
    const carregarRoles = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Token não encontrado, faça login.');
        
        // recupera o avatar de cada usuario do perfil
        const res = await Api.get(`/Usuario/avatar/${usuario.matricula}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.sucesso && res.data.avatarBase64) {
            setUseravatar(`data:image/png;base64,${res.data.avatarBase64}`);
        }

        // Rota de perfis da API
        const resRoles = await Api.get('/Roles', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Filtrando somente os perfis que estão ativos na rota.
        const perfisAtivos = resRoles.data.perfis.filter(p => p.status === 'A');
        
        // Pega qual a role do usuario que esta no token
        const decodedToken = jwtDecode(token);

        // Atualiza os estados com os dados do token
        const perfildefault = perfisAtivos.find(p => p.role === decodedToken.role);

        // consulta as permissoes disponiveis do usuario
        const resRolePerm = await Api.post(`/RolePermissao`, 
          { rolename: perfildefault.role }, // corpo da requisição
          { headers: { Authorization: `Bearer ${token}` } } // headers
        );

        // Retorna todas as permissões do perfil do usuario
        const dataRolePerm = resRolePerm.data.permissoes;

        // Seta todas as permissões da role do usuario.
        setRolePermissao(dataRolePerm);
      } catch (error) {
        console.error('Erro ao carregar perfis:', error);
      }
    };
    carregarRoles();
  }, []);
  
  return (
    <tr>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            <img className="h-10 w-10 rounded-full" src={useravatar} alt="" />
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{usuario.nome}</div>
            <div className="text-sm text-gray-500">{usuario.email}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span
          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
            usuario.status === 'I' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
          }`}
        >
          {usuario.status === 'I' ? 'Inativo' : 'Ativo'}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{usuario.roleName}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{usuario.email}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        {rolePermissao.find(p => p.permissao === SCREENS.ALTERARUSUARIO && p.status === 'A') && (<button onClick={onEditar} className="text-indigo-600 hover:text-indigo-900">Editar</button>)}
        {rolePermissao.find(p => p.permissao === SCREENS.REMOVERUSUARIO && p.status === 'A') && (<button onClick={onDeletar} className="ml-2 text-red-600 hover:text-red-900">Remover</button>)}
      </td>
    </tr>
  );
};

const ItemPermissao = ({ p, toggle }) => (
      <button
        onClick={() => toggle(p)}
        className={`relative inline-flex h-6 w-11 items-center transition-colors ${p.status == 'A' ? "bg-sky-500" : "bg-gray-300"}`}
      >
        <span className={`inline-block h-4 w-4 transform bg-white transition-transform ${p.status == 'A' ? "translate-x-6" : "translate-x-1"}`} />
      </button>
);
