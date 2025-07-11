import React, { useState } from 'react';
import type { KebabOrder, KebabOrderData } from '../types';
import { TrashIcon } from './icons/TrashIcon';
import { EditIcon } from './icons/EditIcon';

interface OrderItemProps {
  order: KebabOrder;
  onDeleteOrder: (id: string) => void;
  onEditOrder: (id: string, data: KebabOrderData) => Promise<void>;
  isAdmin: boolean;
  index: number;
}

const Detail: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
    <p className="font-medium text-slate-800 dark:text-slate-200">{value}</p>
  </div>
);

const EditInput: React.FC<{
    label: string;
    name: keyof KebabOrderData;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder: string;
}> = ({ label, name, value, onChange, placeholder }) => (
    <div>
        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">{label}</label>
        <input
            type="text"
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className="w-full p-2 text-sm bg-slate-100 dark:bg-slate-600 border border-slate-300 dark:border-slate-500 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition"
        />
    </div>
);


export const OrderItem: React.FC<OrderItemProps> = ({ order, onDeleteOrder, onEditOrder, isAdmin, index }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedOrder, setEditedOrder] = useState<KebabOrderData>({
    customerName: order.customerName,
    kebabType: order.kebabType,
    size: order.size,
    sauce: order.sauce,
    meatType: order.meatType,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditedOrder(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (Object.values(editedOrder).some(val => val.trim() === '')) {
      alert("Wszystkie pola muszą być wypełnione.");
      return;
    }
    try {
      await onEditOrder(order.id, editedOrder);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save order", error);
      // Error is displayed globally in App.tsx
    }
  };

  if (isEditing) {
    return (
        <div className="bg-slate-100 dark:bg-slate-700 p-4 rounded-lg border-2 border-amber-500 shadow-lg">
            <h3 className="font-bold text-lg text-amber-700 dark:text-amber-500 mb-4">Edytowanie zamówienia dla: {order.customerName}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <EditInput label="Twoje imię" name="customerName" value={editedOrder.customerName} onChange={handleInputChange} placeholder="np. Jan" />
                <EditInput label="Typ kebaba" name="kebabType" value={editedOrder.kebabType} onChange={handleInputChange} placeholder="np. Pita, Bułka" />
                <EditInput label="Wielkość" name="size" value={editedOrder.size} onChange={handleInputChange} placeholder="np. Standard, XL" />
                <EditInput label="Sos" name="sauce" value={editedOrder.sauce} onChange={handleInputChange} placeholder="np. Mieszany, Ostry" />
                <EditInput label="Mięso" name="meatType" value={editedOrder.meatType} onChange={handleInputChange} placeholder="np. Wołowina, Kurczak" />
            </div>
            <div className="flex justify-end gap-3 mt-4">
                <button 
                    onClick={() => setIsEditing(false)}
                    className="py-2 px-4 rounded-md text-sm font-semibold text-slate-700 dark:text-slate-200 bg-transparent hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                    Anuluj
                </button>
                <button 
                    onClick={handleSave}
                    className="py-2 px-4 rounded-md text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 transition-colors"
                >
                    Zapisz zmiany
                </button>
            </div>
        </div>
    );
  }

  return (
    <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700 animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
        <div className="flex justify-between items-start">
            <h3 className="font-bold text-lg text-amber-700 dark:text-amber-500">{order.customerName}</h3>
            {isAdmin && (
                <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                    <button
                        onClick={() => setIsEditing(true)}
                        className="p-1.5 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-500 transition-colors"
                        aria-label="Edytuj zamówienie"
                    >
                        <EditIcon className="h-5 w-5" />
                    </button>
                    <button
                        onClick={() => onDeleteOrder(order.id)}
                        className="p-1.5 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-500 transition-colors"
                        aria-label="Usuń zamówienie"
                    >
                        <TrashIcon className="h-5 w-5" />
                    </button>
                </div>
            )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 pt-3 border-t border-slate-200 dark:border-slate-600">
            <Detail label="Typ" value={order.kebabType} />
            <Detail label="Rozmiar" value={order.size} />
            <Detail label="Sos" value={order.sauce} />
            <Detail label="Mięso" value={order.meatType} />
        </div>
    </div>
  );
};

// Add keyframes for animation in a style tag, since we don't use a css file.
const style = document.createElement('style');
style.innerHTML = `
  @keyframes fade-in {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fade-in {
    animation: fade-in 0.3s ease-out forwards;
  }
`;
document.head.appendChild(style);
