import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  type?: 'danger' | 'warning' | 'info' | 'success';
  confirmText?: string;
  cancelText?: string;
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'warning',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar'
}: ConfirmDialogProps) {
  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <XCircle className="w-12 h-12 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-12 h-12 text-amber-600" />;
      case 'success':
        return <CheckCircle className="w-12 h-12 text-green-600" />;
      default:
        return <Info className="w-12 h-12 text-blue-600" />;
    }
  };

  const getButtonVariant = () => {
    switch (type) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700';
      case 'warning':
        return 'bg-amber-600 hover:bg-amber-700';
      case 'success':
        return 'bg-green-600 hover:bg-green-700';
      default:
        return 'bg-blue-600 hover:bg-blue-700';
    }
  };

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <div className="text-center py-4">
        <div className="flex justify-center mb-4">
          {getIcon()}
        </div>
        <h3 className="text-xl font-semibold text-slate-900 mb-2">
          {title}
        </h3>
        <p className="text-slate-600 mb-6">
          {message}
        </p>
        <div className="flex gap-3 justify-center">
          <Button
            variant="outline"
            onClick={onClose}
            className="px-6"
          >
            {cancelText}
          </Button>
          <Button
            onClick={handleConfirm}
            className={`px-6 text-white ${getButtonVariant()}`}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
