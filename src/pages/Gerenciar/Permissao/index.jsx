import './style.css';
import React, { useState, useEffect } from 'react';
import { Sidebar } from '../../../components/Sidebar/Sidebar';
import Api from '../../../services/api';
import { jwtDecode } from 'jwt-decode';

import {SCREENS} from '../../../utils/Permissoes';

function Permissao() {
  const [permissoes, setPermissoes] = useState([]);
  const [perfilPermissao, setPerfilPermissao] = useState([]);

  const [roles, setRoles] = useState([]);
  const [isPermissao, setIsPermissao] = useState([]);

  const [roleSelecionada, setRoleSelecionada] = useState(null);
  const [logado, setLogado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pagina, setPagina] = useState(0);
  const PER_PAGE = 20;

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
        setRoles(perfisAtivos);

        // Pega qual a role do usuario que esta no token
        const decodedToken = jwtDecode(token);

        // Compara os perfis com o perfil do token
        const perfildefault = perfisAtivos.find(p => p.role === decodedToken.role);
        setLogado(perfildefault);

        // consulta as permissoes disponiveis do usuario
        const resRolePerm = await Api.post(`/RolePermissao`, 
          { rolename: perfildefault.role }, // corpo da requisição
          { headers: { Authorization: `Bearer ${token}` } } // headers
        );

        // tras só as permissoes do perfil do usuario
        const dataRolePerm = resRolePerm.data.permissoes;
        if (dataRolePerm.length > 0) setIsPermissao(dataRolePerm);
      
        // pode trocar de role → começa já no perfil do token
        if (perfisAtivos.length > 0) setRoleSelecionada(perfildefault); 
      } catch (error) {
        console.error('Erro ao carregar perfis:', error);
      }
    };
    carregarRoles();
  }, []);

  // Carregar permissões sempre que a roleSelecionada mudar
  useEffect(() => {
    if (!roleSelecionada) return;

    const carregarPermissoes = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Token não encontrado.');
        
        // rota que diz quais as permissões do perfil selecionado
        const resRolePerm = await Api.post(`/RolePermissao`, 
          { rolename: roleSelecionada.role }, // corpo da requisição
          { headers: { Authorization: `Bearer ${token}` } } // headers
        );

        const rolePermissoes = resRolePerm.data.permissoes;

        if (rolePermissoes.length > 0) setPerfilPermissao(rolePermissoes);

        // rota apenas com as informacoes das permissoes
        const resPerm = await Api.get('/Permissao', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const todasPermissoes = resPerm.data.permissoes;

        const permissoesComAtivo = todasPermissoes
          .map(p => ({
            ...p, 
            ativo: !!rolePermissoes.find(rp => rp.permissao === p.codigo && rp.status === 'A')
          }))
          .sort((a, b) => a.codigo - b.codigo);

        setPermissoes(permissoesComAtivo);
      } catch (error) {
        console.error('Erro ao carregar permissões:', error);
        setPermissoes([]);
      } finally {
        setLoading(false);
      }
    };

    carregarPermissoes();
  }, [roleSelecionada]);

  const togglePermissao = async (codigo) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    // Acha a permissão atual no estado
    const perm = permissoes.find(p => p.codigo === codigo);
    if (!perm) return;

    // Inverte o status
    const novoStatus = perm.ativo ? "I" : "A";

    try {
      // Faz o update no backend
      const res = await Api.put(
        `/RolePermissao`,
        {
          permissao: perm.codigo,         // código da permissão
          rolecodigo: roleSelecionada.codigo, // perfil selecionado
          status: novoStatus
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Atualiza no estado local (só depois que a API confirmar)
      setPermissoes(prev =>
        prev.map(p =>
          p.codigo === codigo ? { ...p, ativo: !p.ativo, status: novoStatus } : p
        )
      );
    } catch (error) {
      console.error("Erro ao atualizar permissão:", error);
    }
  };

  if (loading) return <div className="p-4">Carregando permissões...</div>;

  // Paginação
  const totalPaginas = Math.ceil(permissoes.length / PER_PAGE);
  const inicio = pagina * PER_PAGE;
  const fim = inicio + PER_PAGE;
  const permissoesPagina = permissoes.slice(inicio, fim);
  const metade = Math.ceil(permissoesPagina.length / 2);
  const coluna1 = permissoesPagina.slice(0, metade);
  const coluna2 = permissoesPagina.slice(metade);

  // Validação de permissões
  const isMesmoUsuario = roleSelecionada.role === logado.role;

  // Permissões quando for o próprio usuário
  const podeAlterarProprio = isMesmoUsuario && isPermissao.some(r => r.permissao === SCREENS.ALTERARPERMISSAOATUAL && r.status === 'A');

  // Permissões quando for outro perfil
  const podeAlterarOutro = !isMesmoUsuario && isPermissao.some(r => r.permissao === SCREENS.ALTERARPERMISSAOPERFIL && r.status === 'A');

  // Hierarquia de nivel de acesso por perfil, se for acesso do jogador e
  const IsHierarquia =  (podeAlterarProprio || podeAlterarOutro) && roleSelecionada.nivel <= logado.nivel;

  const podeAlterar = (podeAlterarProprio || podeAlterarOutro) && IsHierarquia;

  return (
    <main className="grid grid-cols-[220px_1fr] gap-4 p-4 h-screen">
      <Sidebar />
      <div className="bg-white shadow-lg rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-700">Permissões de perfil</h2>

        {/* Verifica se o usuario tem permissão para alterar outro perfil */}
        {isPermissao.find(p => p.permissao === SCREENS.ALTERARPERMISSAOPERFIL && p.status === 'A') && (
          <select
            className="p-2 border "
            value={roleSelecionada?.codigo || ''}
            onChange={e => {
              const selecionada = roles.find(r => r.codigo === Number(e.target.value));
              setRoleSelecionada(selecionada);
              setPagina(0);
            }}
          >
            {roles.map(r => (
              <option key={r.codigo} value={r.codigo}>
                {r.role}
              </option>
            ))}
          </select>
        )}

        {/* Grid de permissões */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            {coluna1.map(p => <ItemPermissao key={p.codigo} p={p} toggle={togglePermissao}  canEdit={podeAlterar}/>)}
          </div>
          <div className="flex flex-col gap-2">
            {coluna2.map(p => <ItemPermissao key={p.codigo} p={p} toggle={togglePermissao} canEdit={podeAlterar} />)}
          </div>
        </div>

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
            {pagina + 1} de {totalPaginas}
          </span>
          <button
            className=" text-xs px-4 py-2 bg-gray-200 disabled:opacity-50"
            disabled={pagina + 1 >= totalPaginas}
            onClick={() => setPagina(prev => Math.min(prev + 1, totalPaginas - 1))}
          >
            Próximo
          </button>
        </div>
      </div>
    </main>
  );
}

export default Permissao;

const ItemPermissao = ({ p, toggle, canEdit }) => {
  console.log(p);
  return (
    <div className="flex flex-col p-3 bg-gray-50 ">
      <div className="flex items-center justify-between mb-1">
        <span className="text-gray-700 text-sm">{p.descricao}</span>
        <button
          onClick={() => canEdit && toggle(p.codigo)}
          className={`relative inline-flex h-6 w-11 items-center transition-colors ${p.ativo ? "bg-sky-500" : p.valor !== 'A' ? "bg-red-400" : "bg-gray-300"}`}>
          <span className={`inline-block h-4 w-4 transform bg-white transition-transform ${p.ativo ? "translate-x-6" : "translate-x-1"}`} />
        </button>
      </div>
      {p.ajuda && <p className="text-gray-500 text-xs mt-1">{p.ajuda}</p>}
    </div>
  );
};