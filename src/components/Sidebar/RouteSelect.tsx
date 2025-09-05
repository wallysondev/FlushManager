import React, { useEffect, useState } from 'react';
import { IconType } from 'react-icons';
import { AiOutlineImport, AiOutlineLogout, AiOutlineAntDesign, AiOutlineSolution, AiOutlineSnippets   } from "react-icons/ai";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import { FiHome } from 'react-icons/fi';
import { jwtDecode } from 'jwt-decode';
import Api from '../../services/api';

export const RouteSelect = () => {
    const navigate = useNavigate();
    const location = useLocation(); // pega a rota atual

    const [role, setRole] = useState<string | null>(null);
    const [datarole, setDataRole] = useState([]);
    const [showModal, setShowModal] = useState(false);

    // Pegar role do token
    useEffect(() => {
        const token = localStorage.getItem('token');

        if (!token) {
            return <Navigate to="/Login" replace />;
        }

        if (token) {
            try {
                GetPermissoes(token);
                const decoded = jwtDecode(token);
                setRole(decoded.role);
            } catch (err) {
                console.error('Token inválido');
            }
        }
    }, []);

    async function GetPermissoes(token) {
        try {
            const response = await Api.get(`/RolePermissao`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = response.data.permissoes;
            setDataRole(data);

            console.log(data);

            // Verifica se não há nenhuma permissão ativa
            const hasActive = data.some((p: any) => p.status === "A");

            // exibe o modal informando que nao tem permissao no usuario
            if (!hasActive) setShowModal(true);

        } catch (err) {
            setShowModal(true);
        }
    }

    function canAccess(codigoPermissao: number) {
        if (!datarole || datarole.length === 0) return false;

        const perm = datarole.find(p => p.permissao === codigoPermissao);
        // Retorna true apenas se existir e estiver ativa
        return perm ? perm.status === 'A' : false;
    }
    
    function SingOut(){
        localStorage.removeItem("token");
        navigate("/Login");
    }

    function PedidoImporte(){
        navigate("/Importe");
    }

    function GoToHome(){
        navigate("/Home");
    }

    return (
        <>
            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/50">
                    <div className="bg-white p-6 rounded shadow-lg max-w-sm w-full text-center">
                        <h2 className="text-lg font-bold mb-4">Atenção</h2>
                        <p className="mb-6">Você não possui permissões ativas. Entre em contato com o suporte.</p>
                        <button onClick={SingOut} className="bg-sky-700 text-white px-4 py-2 rounded hover:bg-sky-600 transition">OK</button>
                    </div>
                </div>
            )}
            
            <div className='space-y-1'>
                <Route 
                    Icon={FiHome} 
                    selected={location.pathname === "/Home"} 
                    title="Resumo" 
                    onClick={GoToHome} 
                    isPermitted={canAccess(1)}
                />
                <Route 
                    Icon={AiOutlineImport} 
                    selected={location.pathname === "/Importe"} 
                    title="Importar Pedido" 
                    onClick={PedidoImporte} 
                    isPermitted={canAccess(2)}
                />
                <Route
                    Icon={AiOutlineAntDesign} 
                    selected={false} // você não precisa mais disso, será calculado dentro do Route
                    title="Gerenciar"
                    onClick={() => {}}
                    isPermitted={canAccess(3)} // permissão para ver o menu principal
                    subRoutes={[
                        { title: "Perfil", path: "/Gerenciar/Perfil", onClick: () => navigate("/Gerenciar/Perfil"), Icon: AiOutlineSolution, isPermitted: canAccess(4) },
                        { title: "Permissoes", path: "/Gerenciar/Permissao", onClick: () => navigate("/Gerenciar/Permissao"), Icon: AiOutlineSnippets , isPermitted: canAccess(5)},
                    ]}
                    location={location} // passe location
                />
                <Route 
                    Icon={AiOutlineLogout} 
                    selected={false} 
                    title="Sair" 
                    onClick={SingOut} 
                    // nao tem role, por isso sempre visivel
                />
            </div>
        </>
    );
}

interface RouteProps {
    selected: boolean;
    Icon: IconType;
    title: string;
    path?: string;
    onClick?: () => void;
    isPermitted?: boolean;
    subRoutes?: RouteProps[];
    location?: any; // Adicione location aqui
}

export const Route = ({
    selected,
    Icon,
    title,
    onClick,
    isPermitted = true,
    subRoutes,
    location,
}: RouteProps) => {
    const [open, setOpen] = useState(false);

    const hasSubRoutes = subRoutes && subRoutes.length > 0;

    const isSubSelected =
        hasSubRoutes && subRoutes?.some((sr) => sr.path === location?.pathname);

    const isSelected = selected || isSubSelected;

    // Abre automaticamente se alguma subrota estiver selecionada
    useEffect(() => {
        if (isSubSelected) setOpen(true);
    }, [isSubSelected]);

    // Verifica se o menu principal ou qualquer subrota tem permissão
    const mainPermitted =
        isPermitted || (subRoutes?.some((sr) => sr.isPermitted) ?? false);

    // Esconde via display se não tiver permissão
    const hiddenStyle = !mainPermitted ? { display: 'none' } : {};

    // Função de clique no menu principal
    const handleClick = () => {
        if (hasSubRoutes) {
            setOpen((prev) => !prev);

            // Seleciona a primeira subrota que o usuário tem permissão
            if (!isSubSelected && subRoutes && subRoutes.length > 0) {
                const firstAllowed = subRoutes.find((sr) => sr.isPermitted);
                firstAllowed?.onClick?.();
            }
        } else {
            onClick?.();
        }
    };

    return (
        <div style={hiddenStyle}>
            <button
                onClick={handleClick}
                className={`flex items-center justify-between gap-2 w-full rounded px-2 py-1.5 text-sm transition-[box-shadow,_background-color,_color] ${
                    isSelected
                        ? 'bg-white font-medium text-stone-950 shadow'
                        : 'hover:bg-stone-200 bg-transparent text-stone-500 shadow-none'
                }`}
            >
                <div className="flex items-center gap-2">
                    <Icon className={isSelected ? 'text-violet-500' : ''} />
                    <span>{title}</span>
                </div>
            </button>

            {hasSubRoutes && (
                <div
                    className="overflow-hidden transition-all duration-300 ease-in-out"
                    style={{ maxHeight: open ? `${subRoutes!.length * 40}px` : '0' }}
                >
                    <div className="pl-6 mt-1 space-y-1">
                        {subRoutes!.map((sub, i) => (
                            <Route
                                key={i}
                                {...sub}
                                selected={sub.path ? location?.pathname === sub.path : false}
                                location={location}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};