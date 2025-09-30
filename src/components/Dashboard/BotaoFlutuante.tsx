import React, { useState, useEffect  } from 'react';
import { FaCheck, FaClock, FaTimes, FaChevronUp, FaChevronDown } from "react-icons/fa";
import { SCREENS } from "../../utils/Permissoes";
import Api from '../../services/api';
import { jwtDecode } from 'jwt-decode';

export default function BotaoFlutuante({onAction, status}) {
  const [open, setOpen] = useState(false);

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

  function handleAction(action) {
    setOpen(false);
    if (onAction) {
      onAction(action); // chama a função passada pelo pai
    }
  }

  return (
    <div className="fixed bottom-8 right-8 flex flex-col items-end gap-2">
      {/* Botões das opções */}
      {open && (
        <div className="flex flex-col gap-2 ">
          {rolePermissao.find(p => p.permissao === SCREENS.APROVARORCAMENTO && p.status === 'A') && status === 'P' && (<button 
            onClick={() => handleAction("A")}
            className="bg-emerald-500 hover:bg-emerald-700 text-white px-4 py-2 shadow-lg flex items-center gap-2"
          >
            <FaCheck /> Aprovar
          </button>)}

          {rolePermissao.find(p => p.permissao === SCREENS.REJEITARORCAMENTO && p.status === 'A') && status === 'P' &&  (<button 
            onClick={() => handleAction("R")}
            className="bg-red-400 hover:bg-red-500 text-white px-4 py-2 shadow-lg flex items-center gap-2"
          >
            <FaTimes /> Rejeitar
          </button>)}

          {rolePermissao.find(p => p.permissao === SCREENS.DESAPROVARORCAMENTO && p.status === 'A') && status != 'P'  && (<button 
            onClick={() => handleAction("P")}
            className="bg-purple-400 hover:bg-purple-500 text-white px-4 py-2 shadow-lg flex items-center gap-2"
          >
            <FaTimes /> Desaprovar
          </button>)}
        </div>
      )}

      {/* Botão principal que abre/fecha as opções */}
      <button
        onClick={() => setOpen(!open)}
        className="bg-sky-600 hover:bg-sky-700 text-white px-6 py-2 shadow-lg flex items-center gap-2"
      >
        {open ? <FaChevronDown /> : <FaChevronUp />}
        Ações
      </button>
    </div>
  );
}