import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMoreHorizontal } from 'react-icons/fi';

export function DropdownOpcoes({ numorca }) {
  const [open, setOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [link, setLink] = useState('');
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

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
    const novoLink = `${window.location.origin}/Visualizar/${numorca}`;
    setLink(novoLink);
    setModalOpen(true);
    setOpen(false);
  }

  function copiarLink() {
    navigator.clipboard.writeText(link);
    alert('Link copiado para a área de transferência!');
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
        <div className="absolute right-0 w-20 rounded-md shadow-lg bg-white z-20">
            <button onClick={handleVisualizar} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" >Ver</button>
            <button onClick={handleLink} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Link</button>
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