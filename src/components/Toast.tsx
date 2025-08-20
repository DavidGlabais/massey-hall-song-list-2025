import React, { useEffect } from 'react';
import { X, Info } from 'lucide-react';

interface ToastProps {
  message: string;
  onClose: () => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({ message, onClose, duration = 5000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div className="fixed bottom-5 right-5 bg-blue-600 text-white py-3 px-5 rounded-lg shadow-lg flex items-center gap-3 animate-fade-in-up">
      <Info className="w-5 h-5" />
      <span>{message}</span>
      <button onClick={onClose} className="ml-4" title="Close notification">
        <X className="w-5 h-5" />
      </button>
    </div>
  );
};

interface NotificationProps {
  message: string;
  onConfirm: () => void;
  onClose: () => void;
}

export const Notification: React.FC<NotificationProps> = ({ message, onConfirm, onClose }) => {
  return (
    <div className="fixed top-5 right-5 bg-white border border-gray-200 text-gray-800 py-3 px-5 rounded-lg shadow-lg flex items-center gap-3 animate-fade-in-down">
      <Info className="w-5 h-5 text-blue-500" />
      <span className="flex-1">{message}</span>
      <div className="flex gap-2">
        <button 
          onClick={onConfirm}
          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
        >
          Load
        </button>
        <button 
          onClick={onClose}
          className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
        >
          Ignore
        </button>
      </div>
    </div>
  );
};

export default Toast;
