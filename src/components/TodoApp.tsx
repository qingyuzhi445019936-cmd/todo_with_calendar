import React, { useState } from 'react';
import WalletConnector from './WalletConnector';
import TodoList from './TodoList';
import TodoCalendar from './TodoCalendar';

export interface Todo {
  id: number;
  content: string;
  completed: boolean;
  dueDate: number;
  owner: string;
  createdAt: number;
}

const TodoApp: React.FC = () => {
  const [currentView, setCurrentView] = useState<'list' | 'calendar'>('list');
  const [isConnected, setIsConnected] = useState(false);

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <h1 className="text-3xl font-bold text-center mb-6">Blockchain Todo App</h1>
          <p className="text-gray-600 text-center mb-6">
            Connect your wallet to manage your todos on the blockchain
          </p>
          <WalletConnector onConnect={() => setIsConnected(true)} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">
              Blockchain Todo
            </h1>
            <div className="flex items-center space-x-4">
              <div className="bg-gray-200 rounded-lg p-1 flex">
                <button
                  onClick={() => setCurrentView('list')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentView === 'list'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  List View
                </button>
                <button
                  onClick={() => setCurrentView('calendar')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentView === 'calendar'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Calendar View
                </button>
              </div>
              <WalletConnector onConnect={() => setIsConnected(true)} onDisconnect={() => setIsConnected(false)} isConnected={isConnected} />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'list' ? <TodoList /> : <TodoCalendar />}
      </main>
    </div>
  );
};

export default TodoApp;