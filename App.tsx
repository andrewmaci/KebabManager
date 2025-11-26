import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route } from 'react-router-dom';
import { OrderForm } from './components/OrderForm';
import { OrderList } from './components/OrderList';
import type { KebabOrder, KebabOrderData } from './types';
import { DateSelector } from './components/DateSelector';
import { NavigationBar } from './components/NavigationBar';
import Statistics from './components/Statistics';
import { useTheme } from './hooks/useTheme';

const ADMIN_PASSWORD = 'kebabadmin';

// ❄️ Snowflake Component
const Snowflake: React.FC<{ style: React.CSSProperties }> = ({ style }) => (
  <div 
    className="fixed pointer-events-none text-white/80 dark:text-slate-300/60 z-50 animate-snowfall"
    style={style}
  >
    ❄
  </div>
);

// 🎄 Falling Snowflakes Container
const Snowfall: React.FC = () => {
  const snowflakes = useMemo(() => {
    return Array.from({ length: 35 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * 10}s`,
      animationDuration: `${8 + Math.random() * 12}s`,
      fontSize: `${0.6 + Math.random() * 1.2}rem`,
      opacity: 0.4 + Math.random() * 0.6,
    }));
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-50">
      {snowflakes.map((flake) => (
        <Snowflake
          key={flake.id}
          style={{
            left: flake.left,
            animationDelay: flake.animationDelay,
            animationDuration: flake.animationDuration,
            fontSize: flake.fontSize,
            opacity: flake.opacity,
          }}
        />
      ))}
    </div>
  );
};

// 🎄 Christmas String Lights
const ChristmasLights: React.FC = () => {
  const lights = useMemo(() => {
    const colors = ['#ff6b6b', '#4ecdc4', '#ffe66d', '#95e1d3', '#f38181', '#aa96da', '#fcbad3'];
    return Array.from({ length: 20 }, (_, i) => ({
      id: i,
      color: colors[i % colors.length],
      delay: i * 0.15,
    }));
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-40 flex justify-center pointer-events-none">
      <div className="flex gap-4 py-1">
        {lights.map((light) => (
          <div
            key={light.id}
            className="w-3 h-4 rounded-full animate-twinkle shadow-lg"
            style={{
              backgroundColor: light.color,
              animationDelay: `${light.delay}s`,
              boxShadow: `0 0 10px ${light.color}, 0 0 20px ${light.color}`,
            }}
          />
        ))}
      </div>
    </div>
  );
};

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
        const response = await fetch('/api/orders');
        const orders: KebabOrder[] = await response.json();
        const ordersByDate = orders.reduce((acc, order) => {
          const date = order.date;
          if (!acc[date]) {
            acc[date] = [];
          }
          acc[date].push(order);
          return acc;
        }, {} as { [key: string]: KebabOrder[] });

        for (const date in ordersByDate) {
          ordersByDate[date].sort((a, b) => a.customerName.localeCompare(b.customerName));
        }

        setAllOrders(ordersByDate);
      } catch (error) {
        console.error("Failed to fetch orders:", error);
      }
    };
    fetchOrders();
  }, []);

  useEffect(() => {
    const eventSource = new EventSource('/api/orders/stream');
    eventSource.addEventListener('new_order', (event) => {
      const newOrder = JSON.parse(event.data);
      const date = newOrder.date;
      setAllOrders(prev => {
        const updatedOrders = [...(prev[date] || []), newOrder].sort((a, b) => a.customerName.localeCompare(b.customerName));
        return { ...prev, [date]: updatedOrders };
      });
    });

    eventSource.addEventListener('update_order', (event) => {
      const updatedOrder = JSON.parse(event.data);
      const date = updatedOrder.date;
      setAllOrders(prev => {
        const updatedOrders = (prev[date] || []).map(o => o.id === updatedOrder.id ? updatedOrder : o).sort((a, b) => a.customerName.localeCompare(b.customerName));
        return { ...prev, [date]: updatedOrders };
      });
    });

    eventSource.addEventListener('delete_order', (event) => {
      const { id, date } = JSON.parse(event.data);
      const orderDate = date;
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
      {/* ❄️ Winter Magic */}
      <Snowfall />
      <ChristmasLights />
      

      
      <NavigationBar isAdmin={isAdmin} onToggleAdmin={handleAdminToggle} theme={theme} toggleTheme={toggleTheme} />
      <main className="p-4 md:p-8 relative z-10">
        <header className="text-center mb-10 pt-8 md:pt-0">
          {/* Festive wreath around logo */}
          <div className="relative inline-block">
            <img 
              src="/logo.png" 
              alt="Aureos Kebab" 
              className="h-16 md:h-24 mx-auto drop-shadow-lg"
            />
          </div>
          <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">
            Twój bedas na zawołanie 
            <span className="ml-2 inline-block animate-bounce">🎄</span>
          </p>
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
                        onImportOrders={async (importedOrders) => {
                          for (const order of importedOrders) {
                            try {
                              await fetch('/api/orders', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(order),
                              });
                            } catch (error) {
                              console.error('Failed to import order:', error);
                            }
                          }
                        }}
                    />
                  </div>
                </div>
              </>
            } />
            <Route path="/statistics" element={<Statistics allOrders={allOrders} />} />
          </Routes>
        </div>
      </main>
      <footer className="text-center p-4 mt-8 text-sm text-slate-500 dark:text-slate-400 relative z-10">
        <p className="flex items-center justify-center gap-2">
          <span>🎄</span>
          <span>Stworzone z miłości do bedasa</span>
          <span>❄️</span>
        </p>
      </footer>
    </div>
  );
};

export default App;
