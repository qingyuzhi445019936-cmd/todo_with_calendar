import React, { useState, useMemo, useEffect } from 'react';
import { Calendar, momentLocalizer, Event } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { ethers } from 'ethers';
import { Todo } from './TodoApp';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../contracts/config';

const localizer = momentLocalizer(moment);

interface CalendarEvent extends Event {
  resource: Todo;
}

const TodoCalendar: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingTodo, setIsCreatingTodo] = useState(false);

  // Get contract instance
  const getContract = async () => {
    if (typeof (window as any).ethereum === 'undefined') {
      throw new Error('MetaMask is not installed');
    }

    const provider = new ethers.BrowserProvider((window as any).ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
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
    setIsLoading(true);
    try {
      const address = await getUserAddress();
      if (!address) {
        console.log('📅 Calendar: No wallet connected');
        setTodos([]);
        return;
      }

      const { contract } = await getContract();

      // Check network
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const network = await provider.getNetwork();
      if (Number(network.chainId) !== 11155111) {
        console.log('📅 Calendar: Wrong network, please switch to Sepolia');
        setTodos([]);
        return;
      }

      console.log('📅 Calendar: Loading todos for', address);
      const userTodos = await contract.getUserTodoDetails(address);
      console.log('📅 Calendar: Loaded', userTodos.length, 'todos');

      const formattedTodos: Todo[] = userTodos
        .filter((todo: any) => todo.id && Number(todo.id) > 0)
        .map((todo: any) => ({
          id: Number(todo.id),
          content: todo.content,
          completed: todo.completed,
          dueDate: Number(todo.dueDate),
          owner: todo.owner,
          createdAt: Number(todo.createdAt),
        }));

      setTodos(formattedTodos);
    } catch (error) {
      console.error('📅 Calendar: Error loading todos:', error);
      // Handle empty result gracefully
      if ((error as any).message?.includes('could not decode result data')) {
        console.log('📅 Calendar: No todos found (empty result)');
        setTodos([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Load todos when component mounts
  useEffect(() => {
    loadTodos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const events: CalendarEvent[] = useMemo(() => {
    return todos.map(todo => ({
      id: todo.id,
      title: todo.content,
      start: new Date(todo.dueDate * 1000),
      end: new Date(todo.dueDate * 1000),
      resource: todo,
    }));
  }, [todos]);

  const eventStyleGetter = (event: CalendarEvent) => {
    const todo = event.resource;
    let backgroundColor = '#3174ad';

    if (todo.completed) {
      backgroundColor = '#22c55e'; // Green for completed
    } else if (todo.dueDate * 1000 < Date.now()) {
      backgroundColor = '#ef4444'; // Red for overdue
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '5px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block'
      }
    };
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    const todo = event.resource;
    alert(`Todo: ${todo.content}\nDue: ${new Date(todo.dueDate * 1000).toLocaleDateString()}\nStatus: ${todo.completed ? 'Completed' : 'Pending'}`);
  };

  const handleSelectSlot = async ({ start }: { start: Date }) => {
    const content = prompt('Enter todo content:');
    if (!content || !content.trim()) return;

    setIsCreatingTodo(true);
    try {
      const { contract } = await getContract();
      const dueTimestamp = Math.floor(start.getTime() / 1000);

      console.log('📅 Creating todo from calendar:', { content, dueTimestamp });

      // Call smart contract function
      const tx = await contract.createTodo(content.trim(), dueTimestamp);
      console.log('📅 Transaction submitted:', tx.hash);

      // Wait for transaction to be mined
      console.log('📅 Waiting for confirmation...');
      await tx.wait();
      console.log('📅 Transaction confirmed');

      // Reload todos
      await loadTodos();

      alert('Todo created successfully from calendar!');
    } catch (error) {
      console.error('📅 Error creating todo:', error);
      if ((error as any).code === 'ACTION_REJECTED') {
        alert('Transaction was rejected by user');
      } else if ((error as any).message?.includes('user rejected')) {
        alert('Transaction rejected by user');
      } else {
        alert('Error creating todo: ' + (error as any).message);
      }
    } finally {
      setIsCreatingTodo(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold">Todo Calendar</h2>
          {(isLoading || isCreatingTodo) && (
            <div className="flex items-center text-sm text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
              {isLoading ? 'Loading todos...' : 'Creating todo...'}
            </div>
          )}
        </div>
        <div className="flex items-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span>Pending</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span>Completed</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span>Overdue</span>
          </div>
        </div>
      </div>

      <div style={{ height: '600px' }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          eventPropGetter={eventStyleGetter}
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          selectable
          views={['month', 'week', 'day']}
          defaultView="month"
          popup
          showMultiDayTimes
        />
      </div>

      <div className="mt-4 text-sm text-gray-600">
        <p>
          {isCreatingTodo
            ? 'Creating todo on blockchain...'
            : 'Click on a date to add a new todo, or click on an existing todo to view details.'
          }
        </p>
      </div>
    </div>
  );
};

export default TodoCalendar;