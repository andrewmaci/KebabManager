import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { OrderForm } from './components/OrderForm';
import { OrderList } from './components/OrderList';
import type { KebabOrder, KebabOrderData } from './types';
import { DateSelector } from './components/DateSelector';
import { NavigationBar } from './components/NavigationBar';
import Statistics from './components/Statistics';
import { useTheme } from './hooks/useTheme';

const ADMIN_PASSWORD = 'kebabadmin';

const getTodayString = () => new Date().toISOString().split('T')[0];

const App: React.FC = () => {
  const [allOrders, setAllOrders] = useState<{ [key: string]: KebabOrder[] }>({});
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    try {
      return JSON.parse(localStorage.getItem('kebabAdminMode') || 'false');
    } catch {
      return false;
    }
  });
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch(`/api/orders?date=${selectedDate}`);
        const orders: KebabOrder[] = await response.json();
        setAllOrders(prev => ({ ...prev, [selectedDate]: orders }));
      } catch (error) {
        console.error("Failed to fetch orders:", error);
      }
    };
    fetchOrders();
  }, [selectedDate]);

  useEffect(() => {
    const eventSource = new EventSource('/api/orders/stream');
    eventSource.addEventListener('new_order', (event) => {
      const newOrder = JSON.parse(event.data);
      const date = newOrder.date || getTodayString();
      setAllOrders(prev => {
        const updatedOrders = [...(prev[date] || []), newOrder].sort((a, b) => a.customerName.localeCompare(b.customerName));
        return { ...prev, [date]: updatedOrders };
      });
    });

    eventSource.addEventListener('update_order', (event) => {
      const updatedOrder = JSON.parse(event.data);
      const date = updatedOrder.date || getTodayString();
      setAllOrders(prev => {
        const updatedOrders = (prev[date] || []).map(o => o.id === updatedOrder.id ? updatedOrder : o).sort((a, b) => a.customerName.localeCompare(b.customerName));
        return { ...prev, [date]: updatedOrders };
      });
    });

    eventSource.addEventListener('delete_order', (event) => {
      const { id, date } = JSON.parse(event.data);
      const orderDate = date || getTodayString();
      setAllOrders(prev => {
        const updatedOrders = (prev[orderDate] || []).filter(o => o.id !== id);
        return { ...prev, [orderDate]: updatedOrders };
      });
    });

    return () => {
      eventSource.close();
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('kebabAdminMode', JSON.stringify(isAdmin));
  }, [isAdmin]);

  const handleAdminToggle = () => {
    if (isAdmin) {
      setIsAdmin(false);
    } else {
      const enteredPassword = window.prompt('Podaj hasło administratora:');
      if (enteredPassword === ADMIN_PASSWORD) {
        setIsAdmin(true);
      } else if (enteredPassword !== null) {
        window.alert('Nieprawidłowe hasło!');
      }
    }
  };

  const handleAddOrder = async (order: KebabOrderData) => {
    setIsAdding(true);
    try {
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...order, date: selectedDate }),
      });
    } catch (error) {
      console.error("Failed to add order:", error);
    } finally {
      setIsAdding(false);
    }
  };
  
  const handleEditOrder = async (id: string, data: KebabOrderData) => {
    try {
      await fetch(`/api/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error("Failed to edit order:", error);
    }
  };

  const handleDeleteOrder = async (id: string) => {
    try {
      await fetch(`/api/orders/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error("Failed to delete order:", error);
    }
  };

  const ordersForSelectedDate = allOrders[selectedDate] || [];

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 transition-colors duration-300">
      <NavigationBar isAdmin={isAdmin} onToggleAdmin={handleAdminToggle} theme={theme} toggleTheme={toggleTheme} />
      <main className="p-4 md:p-8">
        <header className="text-center mb-10 pt-8 md:pt-0">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-amber-500 to-red-600 bg-clip-text text-transparent">
            Aureos Kebab
          </h1>
          <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">Twój bedas na zawołanie</p>
        </header>

        <div className="mt-8">
          <Routes>
            <Route path="/" element={
              <>
                <DateSelector selectedDate={selectedDate} onDateChange={setSelectedDate} />
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mt-8">
                  <div className="lg:col-span-2">
                    <OrderForm onAddOrder={handleAddOrder} isAdding={isAdding} />
                  </div>
                  <div className="lg:col-span-3">
                    <OrderList 
                        orders={ordersForSelectedDate} 
                        onDeleteOrder={handleDeleteOrder}
                        onEditOrder={handleEditOrder}
                        isAdmin={isAdmin}
                        selectedDate={selectedDate}
                    />
                  </div>
                </div>
              </>
            } />
            <Route path="/statistics" element={<Statistics allOrders={allOrders} />} />
          </Routes>
        </div>
      </main>
      <footer className="text-center p-4 mt-8 text-sm text-slate-500 dark:text-slate-400">
        <p>Stworzone z miłości do bedasa.</p>
      </footer>
    </div>
  );
};

export default App;
