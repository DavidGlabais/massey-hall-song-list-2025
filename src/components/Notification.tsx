import React from 'react';
import { Info } from 'lucide-react';

interface NotificationProps {
  message: string;
  onConfirm: () => void;
  onClose: () => void;
}

export const Notification: React.FC<NotificationProps> = ({ message, onConfirm, onClose }) => {
  return (
    <div className="fixed top-5 right-5 bg-white border border-gray-200 text-gray-800 py-3 px-5 rounded-lg shadow-lg flex items-center gap-3 animate-fade-in-down z-50">
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
