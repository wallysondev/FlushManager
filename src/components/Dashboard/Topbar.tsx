import React, {useState, useEffect} from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

export const Topbar = () =>{
    const navigate = useNavigate();
    
    // Inicialize os estados com valores nulos para evitar erros na primeira renderização
    const [username, setUsername] = useState(null);
    const [userrole, setUserrole] = useState(null);

    // Use o useEffect para executar a lógica de decodificação do token
    useEffect(() => {
        const token = localStorage.getItem('token');

        // verifica se o token nao existe mais
        if (!token) {
            navigate('/login');
            return;
        }

        try {
            // Decodifica o token
            const decodedToken = jwtDecode(token);

            // Atualiza os estados com os dados do token
            setUsername(decodedToken.unique_name);
            setUserrole(decodedToken.role);

        } catch (error) {
            console.error("Falha ao decodificar o token:", error);
            // Se o token for inválido, redirecione para o login
            navigate('/login');
        }

    }, [navigate]); // O array de dependências garante que o efeito só rode quando o 'navigate' mudar

    // Se username ainda for null, você pode renderizar um estado de carregamento
    if (!username) {
        return <div>Carregando...</div>;
    }

    return (
        <div className='border-b px-4 mb-4 mt-3 pb-2 border-stone-200'>
            <div className='flex items-center justify-between p-0.5'>
                <div>
                    <span className='text-sm font-bold block'>Seja bem vindo, {username}</span>
                    <span className='text-sm font-bold block text-stone-500'>{new Date().toLocaleDateString('pt-BR', {weekday: 'long', day: 'numeric', month: 'long',year: 'numeric'})}</span>
                </div>
                <div className='flex items-center px-2 py-1.5 text-sm'>
                    <button className='w-full bg-transparent focus:outline-none'>Ultima Sincronização: 13/06/2025 as 17:13:05</button>
                </div>
            </div>
        </div>
    );
}