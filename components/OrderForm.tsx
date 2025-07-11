import React, { useState } from 'react';
import type { KebabOrder } from '../types';

interface OrderFormProps {
  onAddOrder: (order: Omit<KebabOrder, 'id'>) => Promise<void>;
  isAdding: boolean;
}

const InputField: React.FC<{
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  id: string;
}> = ({ label, value, onChange, placeholder, id }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
      {label}
    </label>
    <input
      type="text"
      id={id}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full p-3 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition"
    />
  </div>
);

export const OrderForm: React.FC<OrderFormProps> = ({ onAddOrder, isAdding }) => {
  const [customerName, setCustomerName] = useState('');
  const [kebabType, setKebabType] = useState('');
  const [size, setSize] = useState('');
  const [sauce, setSauce] = useState('');
  const [meatType, setMeatType] = useState('');

  const isFormValid = customerName.trim() && kebabType.trim() && size.trim() && sauce.trim() && meatType.trim();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isFormValid || isAdding) return;
    
    try {
      await onAddOrder({ customerName, kebabType, size, sauce, meatType });
      // Reset form fields only on success
      setCustomerName('');
      setKebabType('');
      setSize('');
      setSauce('');
      setMeatType('');
    } catch (error) {
      // Error is handled in App.tsx, which shows a notification.
      // We catch it here to prevent the form from being cleared on failure.
      console.error("Submission failed, not clearing form fields.");
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg sticky top-8">
      <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-slate-100">Dodaj nowe zamówienie</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <InputField id="customerName" label="Twoje imię" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="np. Jan" />
        <InputField id="kebabType" label="Typ kebaba" value={kebabType} onChange={(e) => setKebabType(e.target.value)} placeholder="np. Pita, Bułka, Tortilla" />
        <InputField id="size" label="Wielkość kebaba" value={size} onChange={(e) => setSize(e.target.value)} placeholder="np. Standard, XL, XXL" />
        <InputField id="sauce" label="Sos" value={sauce} onChange={(e) => setSauce(e.target.value)} placeholder="np. Mieszany, Ostry, Łagodny" />
        <InputField id="meatType" label="Typ mięsa" value={meatType} onChange={(e) => setMeatType(e.target.value)} placeholder="np. Wołowina, Kurczak, Mieszane" />
        
        <button
          type="submit"
          disabled={!isFormValid || isAdding}
          className="w-full mt-2 bg-amber-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:bg-slate-400 disabled:cursor-not-allowed dark:disabled:bg-slate-600 transition-all duration-300 ease-in-out transform hover:scale-105 disabled:transform-none flex items-center justify-center"
        >
          {isAdding && <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
          {isAdding ? 'Dodawanie...' : 'Dodaj do listy'}
        </button>
      </form>
    </div>
  );
};