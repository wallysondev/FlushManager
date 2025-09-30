import { useState, useEffect } from 'react';
import Api from '../../services/api';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';

export const AccountToggle = () => {
    const navigate = useNavigate();
    
    const [username, setUsername] = useState(null);
    const [userrole, setUserrole] = useState(null);
    const [matricula, setMatricula] = useState<number | null>(null);

    // Para atualizar os dados do usuario 
    const [useravatar, setUseravatar] = useState('http://localhost:5173/src/assets/logo-shopodonto.svg');
    const [preview, setPreview] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Decodifica token e inicializa dados do usuário
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return navigate('/login');

        try {
            // Pega qual a role do usuario que esta no token
            const decodedToken = jwtDecode(token);

            setUsername(decodedToken.unique_name);
            setUserrole(decodedToken.role);
            setMatricula(decodedToken.matricula);

            // Buscar avatar do backend
            fetchAvatar(decodedToken.matricula, token);
        } catch (err) {
            console.error(err);
            navigate('/login');
        }
    }, [navigate]);

    const fetchAvatar = async (matricula: number, token: string) => {
        try {
            const res = await Api.get(`/Usuario/avatar/${matricula}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.sucesso && res.data.avatarBase64) {
                setUseravatar(`data:image/png;base64,${res.data.avatarBase64}`);
            }
        } catch (err) {
            console.error('Erro ao buscar avatar:', err);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result);
            setUseravatar(reader.result); // mostra preview imediato
        };
        reader.readAsDataURL(file);
    };

    const handleUpload = async () => {
        if (!preview || !matricula) return;

        const base64 = preview.split(',')[1]; // remove prefixo data:image/png;base64,

        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            if (!token) throw new Error('Token não encontrado');

            const dados = { matricula, avatarBase64: base64 };
            const response = await Api.put("/Usuario/avatar", dados, {
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
            });

            if (response.data.sucesso) {
                alert('Avatar atualizado com sucesso!');
                setPreview(null); // limpa preview
            }
        } catch (err) {
            console.error(err);
            alert('Erro ao enviar avatar');
        } finally {
            setLoading(false);
        }
    };

    if (!username) return <div>Carregando...</div>;

    return (
        <div className='border-b mb-4 mt-2 pb-4 border-stone-300'>
            <button className="flex p-0.5 hover:bg-stone-200 rounded transition-colors relative gap-2 w-full items-center" onClick={() => setIsModalOpen(true)}>
                <img src={useravatar} alt='avatar' className='w-10 h-10 rounded-full border-2 border-violet-400 shadow' />
                <div className='text-start'>
                    <span className='text-sm font-medium block'>{username}</span>
                    <span className='text-xs font-medium block text-stone-500'>{userrole}</span>
                </div>
            </button>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white rounded-xl shadow-xl p-6 w-96">
                        <h2 className="text-lg font-bold mb-4">Minha Conta</h2>

                        {/* Avatar */}
                        <div className="flex flex-col items-center mb-4">
                            <img src={useravatar} alt="avatar" className="w-20 h-20 rounded-full border-2 border-violet-400 shadow" />
                            <label className="mt-2 cursor-pointer text-sm text-violet-600 hover:underline">
                                Alterar foto
                                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                            </label>
                        </div>

                        {/* Nome e Role */}
                        <div className="mb-2">
                            <label className="block text-xs text-stone-500">Nome</label>
                            <input type="text" value={username} disabled className="w-full border rounded px-2 py-1 text-sm bg-stone-100" />
                        </div>
                        <div className="mb-4">
                            <label className="block text-xs text-stone-500">Role</label>
                            <input type="text" value={userrole ?? ""} disabled className="w-full border rounded px-2 py-1 text-sm bg-stone-100" />
                        </div>

                        {/* Botões */}
                        <div className="flex justify-end gap-2">
                            <button className="px-4 py-2 rounded bg-violet-500 hover:bg-violet-600 text-white text-sm" onClick={handleUpload} disabled={loading}>
                                {loading ? 'Enviando...' : 'Salvar'}
                            </button>
                            <button className="px-4 py-2 rounded bg-stone-200 hover:bg-stone-300 text-sm" onClick={() => setIsModalOpen(false)}>
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
