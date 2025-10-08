import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMoreHorizontal } from 'react-icons/fi';
import { SCREENS } from '../../utils/Permissoes';
import Api from '../../services/api';
import { jwtDecode } from 'jwt-decode';

export function DropdownOpcoes({ numorca }) {
  const [open, setOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [link, setLink] = useState('');
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

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

  // Fecha dropdown se clicar fora
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleVisualizar() {
    navigate(`/Visualizar/${numorca}`);
    setOpen(false);
  }

  function handleLink() {
    const novoLink = `${import.meta.env.VITE_SITE_URL}/Detalhes/${numorca}`;
    setLink(novoLink);
    setModalOpen(true);
    setOpen(false);
  }

  function copiarLink() {
    navigator.clipboard.writeText(link);
    setModalOpen(false);
    setOpen(false);
  }

  function handleEnviar() {

  }

  function handleImprimir() {

  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="hover:bg-stone-200 transition-colors grid place-content-center rounded text-sm w-8 h-8"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <FiMoreHorizontal />
      </button>

      {open && (
        <div className="absolute  w-20 rounded-md shadow-lg bg-white z-20">
            {rolePermissao.find(p => p.permissao === SCREENS.VISUALIZARDETALHESORCA && p.status === 'A') && (<button onClick={handleVisualizar} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Detalhes</button>)}
            {rolePermissao.find(p => p.permissao === SCREENS.IMPRIMIRORCAMENTO && p.status === 'A') && (<button onClick={handleImprimir} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Imprimir</button>)}
            {rolePermissao.find(p => p.permissao === SCREENS.ENVIARORCPOREMAIL && p.status === 'A') && (<button onClick={handleEnviar} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Enviar</button>)}
            {rolePermissao.find(p => p.permissao === SCREENS.GERARLINKDEORCAMENTO && p.status === 'A') && (<button onClick={handleLink} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Link</button>)}
        </div>
      )}

      {modalOpen && (
        <>
          <div className="fixed inset-0 bg-black opacity-75 z-30" onClick={() => setModalOpen(false)} />
          <div className="fixed inset-0 flex items-center justify-center z-40">
            <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative">
              <h2 className="text-lg font-semibold mb-4">Link do Orçamento</h2>
              <div className="mb-4 break-words bg-gray-100 p-3 rounded text-sm select-all">
                {link}
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={copiarLink}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                >
                  Copiar
                </button>
                <button
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}