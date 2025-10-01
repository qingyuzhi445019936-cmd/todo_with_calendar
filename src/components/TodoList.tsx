import React, { useState, useEffect, useRef } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { ethers } from 'ethers';
import { Todo } from './TodoApp';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../contracts/config';
import * as XLSX from 'xlsx';

const TodoList: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [newDueDate, setNewDueDate] = useState<Date | null>(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingTodos, setIsLoadingTodos] = useState(false);
  const [deletingTodoId, setDeletingTodoId] = useState<number | null>(null);
  const [userAddress, setUserAddress] = useState<string>('');
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedTodos, setSelectedTodos] = useState<Set<number>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Get contract instance
  const getContract = async () => {
    if (typeof (window as any).ethereum === 'undefined') {
      throw new Error('MetaMask is not installed');
    }

    const provider = new ethers.BrowserProvider((window as any).ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

    console.log(signer);
    console.log(contract);
    
    return { contract, signer };
  };

  // Get user address
  const getUserAddress = async () => {
    if (typeof (window as any).ethereum !== 'undefined') {
      try {
        const accounts = await (window as any).ethereum.request({
          method: 'eth_accounts',
        });
        if (accounts.length > 0) {
          setUserAddress(accounts[0]);
          return accounts[0];
        }
      } catch (error) {
        console.error('Error getting user address:', error);
      }
    }
    return null;
  };

  // Load todos from smart contract
  const loadTodos = async () => {
    setIsLoadingTodos(true);
    try {
      const address = await getUserAddress();
      console.log('🔍 === BLOCKCHAIN DEBUGGING ===');
      console.log('📍 User address:', address);
      console.log('📍 Contract address:', CONTRACT_ADDRESS);

      if (!address) {
        console.log('❌ No wallet connected');
        setTodos([]);
        return;
      }

      const { contract } = await getContract();
      console.log('📍 Contract instance created successfully');

      // Check network
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const network = await provider.getNetwork();
      console.log('🌐 Current network:', {
        name: network.name,
        chainId: Number(network.chainId),
        expectedChainId: 11155111 // Sepolia
      });

      if (Number(network.chainId) !== 11155111) {
        console.log('❌ Wrong network! Please switch to Sepolia testnet');
        alert('Please switch to Sepolia testnet in MetaMask');
        setTodos([]);
        return;
      }

      // Check if contract exists at address
      const code = await provider.getCode(CONTRACT_ADDRESS);
      console.log('📄 Contract code length:', code.length);
      if (code === '0x') {
        console.log('❌ No contract found at this address!');
        alert(`No contract deployed at ${CONTRACT_ADDRESS} on Sepolia testnet`);
        setTodos([]);
        return;
      }

      // Check total todo count on the contract
      try {
        const totalTodos = await contract.todoCount();
        console.log('📊 Total todos on contract:', Number(totalTodos));
      } catch (error) {
        console.log('❌ Error getting total todo count:', error);
      }

      // First check if user has any todos
      let userTodoIds;
      try {
        userTodoIds = await contract.getUserTodos(address);
        console.log('📋 User todo IDs from blockchain:', userTodoIds);
        console.log('📋 User todo IDs length:', userTodoIds.length);
        console.log('📋 User todo IDs array:', Array.from(userTodoIds));

        // Convert BigInt IDs to numbers for logging
        const idNumbers = userTodoIds.map((id: any) => Number(id));
        console.log('📋 User todo IDs as numbers:', idNumbers);
      } catch (idsError) {
        console.log('🔍 No todos found for user (contract returned empty data)');
        console.log('🔍 This is normal for new users or empty todo lists');
        setTodos([]);
        return;
      }

      if (!userTodoIds || userTodoIds.length === 0) {
        console.log('📋 User has no todos (empty array)');
        setTodos([]);
        return;
      }

      // If user has todos, get their details
      console.log('🔄 Getting detailed todo information...');
      const userTodos = await contract.getUserTodoDetails(address);
      console.log('📦 Raw user todos from blockchain:', userTodos);
      console.log('📦 Number of todos returned:', userTodos.length);

      // Log each todo in detail
      userTodos.forEach((todo: any, index: number) => {
        console.log(`📝 Todo ${index + 1}:`, {
          id: Number(todo.id),
          content: todo.content,
          completed: todo.completed,
          dueDate: Number(todo.dueDate),
          owner: todo.owner,
          createdAt: Number(todo.createdAt),
          dueDateFormatted: new Date(Number(todo.dueDate) * 1000).toLocaleString(),
          createdAtFormatted: new Date(Number(todo.createdAt) * 1000).toLocaleString()
        });
      });

      if (!userTodos || userTodos.length === 0) {
        console.log('❌ No todos found for user');
        setTodos([]);
        return;
      }

      const formattedTodos: Todo[] = userTodos
        .filter((todo: any) => {
          const hasId = todo.id && Number(todo.id) > 0;
          console.log(`🔍 Filtering todo ${Number(todo.id)}: hasId=${hasId}`);
          return hasId;
        })
        .map((todo: any) => {
          const formatted = {
            id: Number(todo.id),
            content: todo.content || '',
            completed: Boolean(todo.completed),
            dueDate: Number(todo.dueDate),
            owner: todo.owner,
            createdAt: Number(todo.createdAt),
          };
          console.log('✅ Formatted todo:', formatted);
          return formatted;
        });

      console.log('🎯 Final formatted todos for UI:', formattedTodos);
      console.log('🎯 Setting', formattedTodos.length, 'todos in state');
      setTodos(formattedTodos);
      console.log('🔍 === END BLOCKCHAIN DEBUGGING ===');

    } catch (error) {
      console.error('💥 ERROR in loadTodos:', error);
      console.log('💥 Error details:', {
        message: (error as any).message,
        code: (error as any).code,
        data: (error as any).data
      });

      // Don't show alert for expected errors (like no todos)
      if ((error as any).message?.includes('could not decode result data')) {
        console.log('🔍 No todos found for user (empty result)');
        setTodos([]);
      } else {
        alert('Error loading todos: ' + (error as any).message);
      }
    } finally {
      setIsLoadingTodos(false);
    }
  };

  // Load todos when component mounts
  useEffect(() => {
    loadTodos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debug function to investigate blockchain state
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const debugBlockchain = async () => {
    try {
      const address = await getUserAddress();
      const { contract } = await getContract();

      console.log('🔍 === DETAILED BLOCKCHAIN INVESTIGATION ===');

      // Check total todo count
      const totalCount = await contract.todoCount();
      console.log('🔢 Total todos on entire contract:', Number(totalCount));

      // Check each todo ID from 1 to totalCount
      for (let i = 1; i <= Number(totalCount); i++) {
        try {
          const todo = await contract.getTodo(i);
          console.log(`🔍 Todo ID ${i} details:`, {
            id: Number(todo.id),
            content: todo.content,
            completed: todo.completed,
            dueDate: Number(todo.dueDate),
            owner: todo.owner,
            createdAt: Number(todo.createdAt),
            isYours: todo.owner.toLowerCase() === address?.toLowerCase(),
            dueDateFormatted: new Date(Number(todo.dueDate) * 1000).toLocaleString(),
            createdAtFormatted: new Date(Number(todo.createdAt) * 1000).toLocaleString()
          });
        } catch (error) {
          console.log(`❌ Error getting todo ${i}:`, error);
        }
      }

      // Check user's specific todo mapping
      try {
        const userTodos = await contract.userTodos(address, 0);
        console.log('🔍 First todo in user mapping:', Number(userTodos));
      } catch (error) {
        console.log('❌ Error checking user todo mapping:', error);
      }

      console.log('🔍 === END INVESTIGATION ===');
    } catch (error) {
      console.error('💥 Debug error:', error);
    }
  };

  const handleAddTodo = async () => {
    if (!newTodo.trim() || !newDueDate) return;

    setIsLoading(true);
    try {
      const { contract, signer } = await getContract();
      const dueTimestamp = Math.floor(newDueDate.getTime() / 1000);

      console.log('Creating todo with:', { content: newTodo, dueTimestamp });
      console.log('Contract address:', CONTRACT_ADDRESS);
      console.log('Signer address:', await signer.getAddress());

      // Call smart contract function
      console.log('Calling createTodo...');
      const tx = await contract.createTodo(newTodo, dueTimestamp);
      console.log('Transaction submitted:', tx.hash);

      // Wait for transaction to be mined
      console.log('Waiting for transaction confirmation...');
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);

      // Reload todos from contract
      await loadTodos();

      setNewTodo('');
      setNewDueDate(new Date());

      alert('Todo added successfully! Transaction: ' + tx.hash);
    } catch (error) {
      console.error('Error adding todo:', error);

      // Handle specific error types
      if ((error as any).code === 'ACTION_REJECTED') {
        alert('Transaction was rejected by user');
      } else if ((error as any).message?.includes('insufficient funds')) {
        alert('Insufficient funds for gas fees');
      } else if ((error as any).message?.includes('user rejected')) {
        alert('Transaction rejected by user');
      } else {
        alert('Error adding todo: ' + (error as any).message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleTodo = async (id: number) => {
    try {
      const { contract } = await getContract();

      // Call smart contract function
      const tx = await contract.toggleTodo(id);

      // Wait for transaction to be mined
      await tx.wait();

      // Reload todos from contract
      await loadTodos();

      alert('Todo updated successfully!');
    } catch (error) {
      console.error('Error toggling todo:', error);
      alert('Error updating todo: ' + (error as any).message);
    }
  };

  const handleDeleteTodo = async (id: number) => {
    setDeletingTodoId(id);
    try {
      const { contract } = await getContract();

      console.log('Deleting todo with ID:', id);
      // Call smart contract function
      const tx = await contract.deleteTodo(id);
      console.log('Delete transaction submitted:', tx.hash);

      // Wait for transaction to be mined
      console.log('Waiting for transaction confirmation...');
      await tx.wait();
      console.log('Transaction confirmed');

      // Reload todos from contract
      await loadTodos();

      alert('Todo deleted successfully!');
    } catch (error) {
      console.error('Error deleting todo:', error);
      if ((error as any).code === 'ACTION_REJECTED') {
        alert('Transaction was rejected by user');
      } else if ((error as any).message?.includes('user rejected')) {
        alert('Transaction rejected by user');
      } else {
        alert('Error deleting todo: ' + (error as any).message);
      }
    } finally {
      setDeletingTodoId(null);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const isOverdue = (timestamp: number) => {
    return timestamp * 1000 < Date.now();
  };

  const handleImportExcel = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      // Read the Excel file
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      // Parse the data (expecting columns: Content, Due Date)
      const todoData: { content: string; dueDate: Date }[] = [];

      for (let i = 1; i < jsonData.length; i++) { // Skip header row
        const row = jsonData[i] as any[];
        if (row[0] && row[0].toString().trim()) {
          let dueDate = new Date();

          // Try to parse the due date from the second column
          if (row[1]) {
            const parsedDate = new Date(row[1]);
            if (!isNaN(parsedDate.getTime())) {
              dueDate = parsedDate;
            }
          }

          todoData.push({
            content: row[0].toString().trim(),
            dueDate: dueDate
          });
        }
      }

      if (todoData.length === 0) {
        alert('No valid todo items found in the Excel file. Please ensure the first column contains todo content.');
        return;
      }

      // Use bulk create function if available, otherwise create individually
      const { contract } = await getContract();

      // Prepare arrays for bulk creation
      const contents = todoData.map(todo => todo.content);
      const dueDates = todoData.map(todo => Math.floor(todo.dueDate.getTime() / 1000));

      console.log('Importing todos:', { contents, dueDates });
      console.log(contract);
      

      // Check if bulk create function exists
      try {
        const tx = await contract.bulkCreateTodos(contents, dueDates);
        console.log('Bulk import transaction submitted:', tx.hash);
        await tx.wait();
        console.log('Bulk import transaction confirmed');

        await loadTodos();
        alert(`Successfully imported ${todoData.length} todos! Transaction: ${tx.hash}`);
      } catch (bulkError) {
        console.log('Bulk create not available, creating individually:', bulkError);

        // Fallback to individual creation
        let successCount = 0;
        // for (const todo of todoData) {
        //   try {
        //     const dueTimestamp = Math.floor(todo.dueDate.getTime() / 1000);
        //     const tx = await contract.createTodo(todo.content, dueTimestamp);
        //     await tx.wait();
        //     successCount++;
        //   } catch (error) {
        //     console.error('Error creating individual todo:', error);
        //   }
        // }

        // await loadTodos();
        // alert(`Successfully imported ${successCount} out of ${todoData.length} todos.`);
      }

    } catch (error) {
      console.error('Error importing Excel file:', error);
      alert('Error importing Excel file: ' + (error as any).message);
    } finally {
      setIsImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const downloadTemplate = () => {
    // Create sample data for the template
    const templateData = [
      ['Content', 'Due Date'],
      ['Complete project proposal', '2025-12-31'],
    ];

    // Create a new workbook and worksheet
    const ws = XLSX.utils.aoa_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Todo Template');

    // Set column widths
    ws['!cols'] = [
      { wch: 30 }, // Content column width
      { wch: 15 }  // Due Date column width
    ];

    // Download the file
    XLSX.writeFile(wb, 'todo_template.xlsx');
  };

  const handleSelectTodo = (todoId: number) => {
    const newSelected = new Set(selectedTodos);
    if (newSelected.has(todoId)) {
      newSelected.delete(todoId);
    } else {
      newSelected.add(todoId);
    }
    setSelectedTodos(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedTodos.size === todos.length) {
      setSelectedTodos(new Set());
    } else {
      setSelectedTodos(new Set(todos.map(todo => todo.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTodos.size === 0) return;

    const confirmed = window.confirm(`Are you sure you want to delete ${selectedTodos.size} todo(s)?`);
    if (!confirmed) return;

    setBulkActionLoading(true);
    try {
      const { contract } = await getContract();
      const idsToDelete = Array.from(selectedTodos);

      console.log('Bulk deleting todos:', idsToDelete);

      const tx = await contract.bulkDeleteTodos(idsToDelete);
      console.log('Bulk delete transaction submitted:', tx.hash);

      await tx.wait();
      console.log('Bulk delete transaction confirmed');

      await loadTodos();
      setSelectedTodos(new Set());
      alert(`Successfully deleted ${idsToDelete.length} todos! Transaction: ${tx.hash}`);
    } catch (error) {
      console.error('Error bulk deleting todos:', error);
      alert('Error deleting todos: ' + (error as any).message);
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkToggleComplete = async (markAsCompleted: boolean) => {
    if (selectedTodos.size === 0) return;

    setBulkActionLoading(true);
    try {
      const { contract } = await getContract();
      const selectedTodoObjects = todos.filter(todo => selectedTodos.has(todo.id));

      const ids = selectedTodoObjects.map(todo => todo.id);
      const contents = selectedTodoObjects.map(todo => todo.content);
      const completed = selectedTodoObjects.map(() => markAsCompleted);
      const dueDates = selectedTodoObjects.map(todo => todo.dueDate);

      console.log('Bulk updating todos:', { ids, completed: completed });

      const tx = await contract.bulkUpdateTodos(ids, contents, completed, dueDates);
      console.log('Bulk update transaction submitted:', tx.hash);

      await tx.wait();
      console.log('Bulk update transaction confirmed');

      await loadTodos();
      setSelectedTodos(new Set());
      alert(`Successfully ${markAsCompleted ? 'completed' : 'uncompleted'} ${ids.length} todos! Transaction: ${tx.hash}`);
    } catch (error) {
      console.error('Error bulk updating todos:', error);
      alert('Error updating todos: ' + (error as any).message);
    } finally {
      setBulkActionLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Add New Todo</h2>
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            placeholder="Enter your todo..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            onKeyPress={(e) => e.key === 'Enter' && handleAddTodo()}
          />
          <DatePicker
            selected={newDueDate}
            onChange={(date) => setNewDueDate(date)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholderText="Select due date"
            minDate={new Date()}
          />
          <button
            onClick={handleAddTodo}
            disabled={isLoading || !newTodo.trim()}
            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-md font-medium transition-colors flex items-center gap-2"
          >
            +
            {isLoading ? 'Adding...' : 'Add Todo'}
          </button>
          <button
            onClick={handleImportExcel}
            disabled={isImporting}
            className="px-6 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded-md font-medium transition-colors flex items-center gap-2"
          >
            📊
            {isImporting ? 'Importing...' : 'Import Excel'}
          </button>
          <button
            onClick={downloadTemplate}
            className="px-4 py-2 bg-green-500 hover:bg-gray-600 text-white rounded-md font-medium transition-colors flex items-center gap-2"
          >
            📥
            Download Template
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">
            Your Todos ({todos.length})
            {userAddress && (
              <span className="text-sm text-gray-500 ml-2">
                - {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
              </span>
            )}
          </h2>
          <button
            onClick={loadTodos}
            disabled={isLoadingTodos}
            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white rounded-md text-sm font-medium transition-colors"
          >
            {isLoadingTodos ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {todos.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedTodos.size === todos.length && todos.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium">
                    {selectedTodos.size === todos.length ? 'Deselect All' : 'Select All'}
                  </span>
                </label>
                {selectedTodos.size > 0 && (
                  <span className="text-sm text-gray-600">
                    {selectedTodos.size} selected
                  </span>
                )}
              </div>

              {selectedTodos.size > 0 && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleBulkToggleComplete(true)}
                    disabled={bulkActionLoading}
                    className="px-3 py-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded text-sm font-medium transition-colors"
                  >
                    {bulkActionLoading ? '⏳' : '✓'} Complete
                  </button>
                  <button
                    onClick={() => handleBulkToggleComplete(false)}
                    disabled={bulkActionLoading}
                    className="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-400 text-white rounded text-sm font-medium transition-colors"
                  >
                    {bulkActionLoading ? '⏳' : '↻'} Incomplete
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    disabled={bulkActionLoading}
                    className="px-3 py-1 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white rounded text-sm font-medium transition-colors"
                  >
                    {bulkActionLoading ? '⏳' : '🗑️'} Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {isLoadingTodos ? (
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <p className="text-gray-500">Loading todos from blockchain...</p>
          </div>
        ) : todos.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <p className="text-gray-500">
              {userAddress
                ? "No todos yet. Add your first todo above!"
                : "Connect your wallet to view todos."
              }
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {todos.map((todo) => (
              <div
                key={todo.id}
                className={`bg-white rounded-lg shadow-sm border p-4 transition-all ${
                  todo.completed ? 'opacity-75' : ''
                } ${selectedTodos.has(todo.id) ? 'ring-2 ring-blue-500' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    <input
                      type="checkbox"
                      checked={selectedTodos.has(todo.id)}
                      onChange={() => handleSelectTodo(todo.id)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <button
                      onClick={() => handleToggleTodo(todo.id)}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                        todo.completed
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'border-gray-300 hover:border-green-500'
                      }`}
                    >
                      {todo.completed && '✓'}
                    </button>

                    <div className="flex-1">
                      <p
                        className={`text-lg ${
                          todo.completed
                            ? 'line-through text-gray-500'
                            : 'text-gray-900'
                        }`}
                      >
                        {todo.content}
                      </p>
                      <div className="flex items-center space-x-4 mt-1">
                        <span
                          className={`text-sm ${
                            isOverdue(todo.dueDate) && !todo.completed
                              ? 'text-red-500 font-medium'
                              : 'text-gray-500'
                          }`}
                        >
                          Due: {formatDate(todo.dueDate)}
                        </span>
                        {isOverdue(todo.dueDate) && !todo.completed && (
                          <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                            Overdue
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteTodo(todo.id)}
                    disabled={deletingTodoId === todo.id}
                    className={`p-2 transition-colors ${
                      deletingTodoId === todo.id
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-400 hover:text-red-500'
                    }`}
                  >
                    {deletingTodoId === todo.id ? '⏳' : '🗑️'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TodoList;