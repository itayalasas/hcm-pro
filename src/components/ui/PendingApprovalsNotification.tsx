import { useEffect, useState } from 'react';
import { Bell, Calendar, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useCompany } from '../../contexts/CompanyContext';
import { useNavigation } from '../../contexts/NavigationContext';

export default function PendingApprovalsNotification() {
  const { employee } = useAuth();
  const { selectedCompanyId } = useCompany();
  const { setCurrentPath } = useNavigation();
  const [pendingCount, setPendingCount] = useState(0);
  const [showNotification, setShowNotification] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (employee?.id && selectedCompanyId) {
      loadPendingCount();
      const interval = setInterval(loadPendingCount, 60000);
      return () => clearInterval(interval);
    }
  }, [employee?.id, selectedCompanyId]);

  const loadPendingCount = async () => {
    if (!employee?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .rpc('count_pending_subordinate_requests', {
          p_manager_employee_id: employee.id
        });

      if (error) {
        console.error('Error loading pending count:', error);
        return;
      }

      setPendingCount(data || 0);
      if (data > 0) {
        setShowNotification(true);
      }
    } catch (error) {
      console.error('Error loading pending count:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClick = () => {
    setCurrentPath('/time/requests');
    setShowNotification(false);
  };

  const handleClose = () => {
    setShowNotification(false);
  };

  if (loading || pendingCount === 0 || !showNotification) {
    return null;
  }

  return (
    <div className="fixed top-20 right-6 z-50 max-w-sm animate-slide-in">
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <Bell className="w-5 h-5" />
            <span className="font-semibold">Solicitudes Pendientes</span>
          </div>
          <button
            onClick={handleClose}
            className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4">
          <div className="flex items-start gap-3 mb-4">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-slate-900 font-medium mb-1">
                Tienes {pendingCount} {pendingCount === 1 ? 'solicitud' : 'solicitudes'} de ausencia pendiente{pendingCount !== 1 ? 's' : ''} de aprobación
              </p>
              <p className="text-sm text-slate-600">
                Tus subordinados directos están esperando tu revisión
              </p>
            </div>
          </div>

          <button
            onClick={handleClick}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Ver Solicitudes
          </button>
        </div>
      </div>
    </div>
  );
}
