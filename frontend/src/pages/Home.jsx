import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, X, MapPin, Truck, Package, Map, UserPlus, ArrowRight } from 'lucide-react';
import RegisterModal from '../components/RegisterModal';

const ROLES = [
  {
    role: 'provider',
    icon: Package,
    label: 'Sou Fornecedor',
    description: 'Produzo ou forneço itens para doação',
  },
  {
    role: 'shelter',
    icon: MapPin,
    label: 'Sou ponto de Recolhimento',
    description: 'Recebo e distribuo doações para quem precisa',
  },
];

export default function Home() {
  const navigate = useNavigate();
  const [showRoleSelect, setShowRoleSelect] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);

  const handleRoleClick = (role) => {
    setSelectedRole(role);
    setShowRoleSelect(false);
  };

  const handleCloseAll = () => {
    setSelectedRole(null);
    setShowRoleSelect(false);
  };

  return (
    <>
      <style>{`
        .home-root {
          font-family: 'Plus Jakarta Sans', sans-serif;
          min-height: 100vh;
          background: #f5f5f5;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          gap: 32px;
        }

        /* — Logo — */
        .logo-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }
        .logo-icon {
          width: 68px;
          height: 68px;
          background: #ef4444;
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .logo-title {
          font-size: 36px;
          font-weight: 800;
          color: #111;
          letter-spacing: -1px;
          margin: 0;
        }
        .logo-subtitle {
          font-size: 15px;
          color: #6b7280;
          text-align: center;
          max-width: 260px;
          line-height: 1.5;
          margin: 0;
        }

        /* — Card — */
        .main-card {
          width: 100%;
          max-width: 340px;
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 20px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.06);
        }

        /* — Botões de ação — */
        .action-btn {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px 18px;
          border-radius: 14px;
          border: 1px solid #e5e7eb;
          background: #fff;
          cursor: pointer;
          font-family: 'Plus Jakarta Sans', sans-serif;
          transition: background 0.15s, border-color 0.15s;
          text-align: left;
        }
        .action-btn:hover {
          background: #f9fafb;
          border-color: #d1d5db;
        }
        .action-btn:active { background: #f3f4f6; }

        .action-btn-icon {
          width: 42px;
          height: 42px;
          border-radius: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .action-btn-label {
          font-size: 16px;
          font-weight: 700;
          color: #111;
          margin: 0;
        }
        .action-btn-desc {
          font-size: 14px;
          color: #6b7280;
          margin: 2px 0 0;
        }
        .action-btn-arrow {
          margin-left: auto;
          color: #9ca3af;
          flex-shrink: 0;
        }
        .action-btn:hover .action-btn-arrow { color: #6b7280; }

        .divider {
          height: 1px;
          background: #f3f4f6;
        }

        /* — Footer — */
        .home-footer {
          font-size: 12px;
          color: #d1d5db;
          text-align: center;
        }

        /* — Modal overlay — */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          padding: 20px;
        }
        .modal-sheet {
          background: #fff;
          border-radius: 20px;
          padding: 28px;
          width: 100%;
          max-width: 380px;
          position: relative;
          box-shadow: 0 20px 40px rgba(0,0,0,0.15);
        }
        .modal-close {
          position: absolute;
          top: 18px;
          right: 18px;
          background: #f3f4f6;
          border: none;
          border-radius: 50%;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #6b7280;
        }
        .modal-close:hover { background: #e5e7eb; }

        .modal-title {
          font-size: 22px;
          font-weight: 800;
          color: #111;
          margin: 0 0 4px;
        }
        .modal-subtitle {
          font-size: 15px;
          color: #6b7280;
          margin: 0 0 20px;
        }

        /* — Role cards — */
        .role-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .role-card {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 16px;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          background: #fff;
          cursor: pointer;
          font-family: 'Plus Jakarta Sans', sans-serif;
          text-align: left;
          width: 100%;
          transition: background 0.15s, border-color 0.15s;
        }
        .role-card:hover { background: #f9fafb; border-color: #d1d5db; }

        .role-icon {
          width: 42px;
          height: 42px;
          background: #f3f4f6;
          border-radius: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: #374151;
        }
        .role-label {
          font-size: 16px;
          font-weight: 700;
          color: #111;
          margin: 0;
        }
        .role-desc {
          font-size: 14px;
          color: #6b7280;
          margin: 2px 0 0;
        }
        .role-arrow {
          margin-left: auto;
          color: #9ca3af;
          flex-shrink: 0;
        }
        .role-card:hover .role-arrow { color: #6b7280; }
      `}</style>

      <div className="home-root">

        {/* Logo */}
        <div className="logo-section">
          <div className="logo-icon">
            <Heart size={32} color="white" strokeWidth={2.5} />
          </div>
          <h1 className="logo-title">EuAjudo</h1>
          <p className="logo-subtitle">Plataforma para ajudar na logística de entregas de doações</p>
        </div>

        {/* Card principal */}
        <div className="main-card">

          <button className="action-btn" onClick={() => navigate('/mapa')}>
            <div className="action-btn-icon" style={{ background: '#f0fdf4' }}>
              <Map size={20} color="#16a34a" />
            </div>
            <div>
              <p className="action-btn-label">Ver mapa</p>
              <p className="action-btn-desc">Pontos que precisam de ajuda</p>
            </div>
            <ArrowRight size={16} className="action-btn-arrow" />
          </button>

          <div className="divider" />

          <button className="action-btn" onClick={() => setShowRoleSelect(true)}>
            <div className="action-btn-icon" style={{ background: '#eff6ff' }}>
              <UserPlus size={20} color="#2563eb" />
            </div>
            <div>
              <p className="action-btn-label">Cadastrar</p>
              <p className="action-btn-desc">Voluntário, transporte ou ponto de coleta</p>
            </div>
            <ArrowRight size={16} className="action-btn-arrow" />
          </button>

        </div>

      </div>

      {/* Modal — seleção de papel */}
      {showRoleSelect && (
        <div
          className="modal-overlay"
          onClick={(e) => e.target === e.currentTarget && setShowRoleSelect(false)}
        >
          <div className="modal-sheet">
            <button className="modal-close" onClick={() => setShowRoleSelect(false)}>
              <X size={14} />
            </button>

            <h2 className="modal-title">Como você quer ajudar?</h2>
            <p className="modal-subtitle">Escolha seu perfil para continuar</p>

            <div className="role-list">
              {ROLES.map(({ role, icon: Icon, label, description }) => (
                <button
                  key={role}
                  className="role-card"
                  onClick={() => handleRoleClick(role)}
                >
                  <div className="role-icon">
                    <Icon size={20} />
                  </div>
                  <div>
                    <p className="role-label">{label}</p>
                    <p className="role-desc">{description}</p>
                  </div>
                  <ArrowRight size={15} className="role-arrow" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <RegisterModal
        isOpen={!!selectedRole}
        onClose={handleCloseAll}
        preselectedRole={selectedRole}
      />
    </>
  );
}
