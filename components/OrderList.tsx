import React, { useState } from 'react';
import type { KebabOrder, KebabOrderData } from '../types';
import { OrderItem } from './OrderItem';
import { EmptyStateIcon } from './icons/EmptyStateIcon';
import { PdfIcon } from './icons/PdfIcon';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface OrderListProps {
  orders: KebabOrder[];
  onDeleteOrder: (id: string) => void;
  onEditOrder: (id: string, data: KebabOrderData) => Promise<void>;
  isAdmin: boolean;
  selectedDate: string; // YYYY-MM-DD
  onImportOrders?: (orders: KebabOrderData[]) => void;
}

export const OrderList: React.FC<OrderListProps> = ({ orders, onDeleteOrder, onEditOrder, isAdmin, selectedDate, onImportOrders }) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      // Accept either array or object with 'orders' property
      const importedOrders: KebabOrderData[] = Array.isArray(json)
        ? json
        : Array.isArray(json.orders)
          ? json.orders
          : [];
      if (!Array.isArray(importedOrders) || importedOrders.length === 0) {
        alert('Nieprawidłowy plik lub brak zamówień w pliku.');
        return;
      }
  // Use date from each order if present, otherwise use selectedDate
  const ordersWithDate = importedOrders.map(order => ({ ...order, date: order.date || selectedDate }));
  onImportOrders?.(ordersWithDate);
    } catch (err) {
      alert('Błąd podczas importu pliku. Upewnij się, że to poprawny plik JSON.');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleGeneratePdf = () => {
    if (isGeneratingPdf || orders.length === 0) return;
    setIsGeneratingPdf(true);

    try {
      const doc = new jsPDF();
      
      doc.setFontSize(20);
      doc.text("Kebab Order Report", 14, 22);
      
      doc.setFontSize(10);
      doc.text(`Orders for: ${selectedDate}`, 14, 30);
      
      autoTable(doc, {
        startY: 35,
        head: [['Imie', 'Typ', 'Rozmiar', 'Sos', 'Mieso']],
        body: orders.map(order => [
          order.customerName,
          order.kebabType,
          order.size,
          order.sauce,
          order.meatType
        ]),
        theme: 'grid',
        headStyles: { fillColor: '#d97706' }, // amber-600
      });

      doc.save(`kebab-order-report-${selectedDate}.pdf`);
    } catch (error) {
        console.error("Failed to generate PDF:", error);
        alert("An error occurred while generating the PDF. Please try again.");
    } finally {
        setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg min-h-[300px]">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Aktualna lista zamówień</h2>
        <div className="flex gap-2">
          {orders.length > 0 && (
            <button
              onClick={handleGeneratePdf}
              disabled={isGeneratingPdf}
              className="flex items-center gap-2 py-2 px-4 rounded-lg bg-teal-600 text-white font-semibold hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:bg-slate-400 disabled:cursor-not-allowed dark:disabled:bg-slate-600 transition-all duration-300"
              aria-label="Generuj raport PDF"
            >
              <PdfIcon className="h-5 w-5" />
              {isGeneratingPdf ? 'Generowanie...' : 'Generuj PDF'}
            </button>
          )}
          {isAdmin && (
            <>
              <button
                onClick={handleImportClick}
                disabled={isImporting}
                className="flex items-center gap-2 py-2 px-4 rounded-lg bg-amber-600 text-white font-semibold hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:bg-slate-400 disabled:cursor-not-allowed dark:disabled:bg-slate-600 transition-all duration-300"
                aria-label="Importuj zamówienia z JSON"
              >
                {isImporting ? 'Importowanie...' : 'Importuj JSON'}
              </button>
              <input
                type="file"
                accept="application/json"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                aria-label="Wybierz plik JSON z zamówieniami"
              />
            </>
          )}
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-10 px-4">
          <EmptyStateIcon className="mx-auto h-20 w-20 text-slate-400 dark:text-slate-500" />
          <p className="mt-4 text-slate-500 dark:text-slate-400 font-medium">Brak zamówień na ten dzień.</p>
          <p className="text-slate-400 dark:text-slate-500 text-sm">Dodaj zamówienie, aby je tutaj zobaczyć!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order, index) => (
            <OrderItem 
                key={order.id} 
                order={order} 
                onDeleteOrder={onDeleteOrder}
                onEditOrder={onEditOrder}
                isAdmin={isAdmin}
                index={index}
            />
          ))}
        </div>
      )}
    </div>
  );
};