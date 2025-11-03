import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';


import './style.css';
import { Sidebar } from '../../components/Sidebar/Sidebar';
import { OrcamentoDetail } from '../../components/ShowOrcamento/OrcamentoDetail';
import Api from '../../services/api';

function VisualizarOrcamento() {
  const { numorca } = useParams(); // pega o parâmetro da URL
  const navigate = useNavigate();
  const [orcamento, setOrcamento] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchOrcamento() {
      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Token não encontrado, faça login.');

        // Buscar orçamento
        const response = await Api.get(`/Orcamento/${numorca}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const data = response.data;
        if (!data.cabecalho) throw new Error('Orçamento não encontrado.');
        
        // Itens do orcamento
        const Itens = data.itens;

        // Buscar todos os produtos que temos no sistema
        const resProd= await Api.get(`/produto`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        // armazena na variavel o retorno do backend
        const produtosJson = resProd.data;

        // verifica se nesse retorno os detalhes que seriam os produtos vieram no retorno
        if (!produtosJson.produtos) throw new Error('Lista de produtos não encontrada.');
        
        // define a variavel produtos recebendo um array
        const produtos = produtosJson.produtos;

        // faz a leitura de item por item do orcamento e adicionando na variavel a descricao que vem dos produtos
        const itensAtualizados = Itens?.map(item => {
          const produto = produtos.find(p => p.codprod === item.codprod);
          return { ...item, descricao: produto ? produto.descricao : '' };
        }) || [];

        setOrcamento({ ...data, itens: itensAtualizados });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchOrcamento();
  }, [numorca]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">      
        <button type="button" className="bg-sky-500 text-white font-bold py-2 px-4 rounded flex items-center" disabled >
          <svg className="animate-spin h-5 w-5 mr-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          Carregando...
        </button>
      </div>
    );
  }


  if (error) {
    return (
      <div className="p-4 text-red-600">
        <p>Erro: {error}</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          Voltar
        </button>
      </div>
    );
  }

  if (!orcamento) {
    return (
      <div className="p-4">
        <p>Orçamento não encontrado.</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          Voltar
        </button>
      </div>
    );
  }

  // Exemplo de exibição simples
  return (
    <main className="grid grid-cols-[220px_1fr] gap-4 p-4">
      <Sidebar />
      <OrcamentoDetail orcamento={orcamento} />
    </main>
  );
}

export default VisualizarOrcamento;
