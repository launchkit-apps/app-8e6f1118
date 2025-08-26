"use client";

import React, { useState, useEffect } from 'react';

export default function CollaborativeSudoku() {
  const [gameCode, setGameCode] = useState<string>('');
  const [board, setBoard] = useState<number[][]>([]);
  const [selectedCell, setSelectedCell] = useState<{row: number, col: number} | null>(null);
  const [errors, setErrors] = useState<number>(0);
  const [gameTime, setGameTime] = useState<number>(0);
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [playerColor] = useState<string>('#FF4444');
  const [partnerActiveCell, setPartnerActiveCell] = useState<{row: number, col: number, color: string} | null>(null);
  const [playerName, setPlayerName] = useState<string>('');
  const [gameState, setGameState] = useState<'lobby' | 'game'>('lobby');
  const [joinCode, setJoinCode] = useState<string>('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [solution, setSolution] = useState<number[][]>([]);

  const shuffle = (array: number[]) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  const isValidPlacement = (board: number[][], num: number, row: number, col: number): boolean => {
    for (let x = 0; x < 9; x++) {
      if (board[row][x] === num || board[x][col] === num) return false;
    }
    
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (board[boxRow + i][boxCol + j] === num) return false;
      }
    }
    
    return true;
  };

  const generateSudoku = (difficulty: 'easy' | 'medium' | 'hard') => {
    const board = Array(9).fill(null).map(() => Array(9).fill(0));
    const numbers = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    board[0] = [...numbers];

    const solve = (row = 1, col = 0): boolean => {
      if (row === 9) return true;
      if (col === 9) return solve(row + 1, 0);
      if (board[row][col] !== 0) return solve(row, col + 1);
      
      const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
      for (const num of nums) {
        if (isValidPlacement(board, num, row, col)) {
          board[row][col] = num;
          if (solve(row, col + 1)) return true;
          board[row][col] = 0;
        }
      }
      return false;
    };

    solve();
    const completeSolution = board.map(row => [...row]);
    setSolution(completeSolution);

    const cellsToRemove = {
      easy: 35,
      medium: 45,
      hard: 55
    }[difficulty];

    let removed = 0;
    while (removed < cellsToRemove) {
      const row = Math.floor(Math.random() * 9);
      const col = Math.floor(Math.random() * 9);
      
      if (board[row][col] !== 0) {
        board[row][col] = 0;
        removed++;
      }
    }

    return board;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCellClick = (row: number, col: number) => {
    if (board[row][col] === 0) {
      setSelectedCell({ row, col });
    }
  };

  const handleNumberInput = (number: number) => {
    if (!selectedCell) return;
    const { row, col } = selectedCell;
    const isValid = solution[row][col] === number;
    
    if (!isValid) {
      setErrors(prev => {
        const newErrors = prev + 1;
        if (newErrors >= 3) {
          alert('Game Over - Too many errors!');
        }
        return newErrors;
      });
    }

    const newBoard = [...board];
    newBoard[row][col] = number;
    setBoard(newBoard);
    
    if (!gameStarted) {
      setGameStarted(true);
    }
  };

  const handleCreateGame = () => {
    if (!playerName) {
      alert('Please enter your name');
      return;
    }
    const newGameCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    setGameCode(newGameCode);
    const initialBoard = generateSudoku(difficulty);
    setBoard(initialBoard);
    setGameState('game');
  };

  const handleJoinGame = () => {
    if (!playerName) {
      alert('Please enter your name');
      return;
    }
    if (!joinCode) {
      alert('Please enter a game code');
      return;
    }
    setGameCode(joinCode);
    setGameState('game');
  };

  useEffect(() => {
    const initialBoard = generateSudoku(difficulty);
    setBoard(initialBoard);
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameStarted) {
      interval = setInterval(() => {
        setGameTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameStarted]);

  if (gameState === 'lobby') {
    return (
      <div className="flex flex-col items-center p-4 max-w-lg mx-auto">
        <h1 className="text-2xl font-bold mb-6">Collaborative Sudoku</h1>
        <div className="w-full max-w-md space-y-4">
          <input
            type="text"
            placeholder="Enter your name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="w-full p-2 border rounded"
          />
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
            className="w-full p-2 border rounded"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
          <button
            onClick={handleCreateGame}
            className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Create New Game
          </button>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter game code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              className="flex-1 p-2 border rounded"
            />
            <button
              onClick={handleJoinGame}
              className="p-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Join Game
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center p-4 max-w-lg mx-auto">
      <div className="mb-4 text-center">
        <h1 className="text-2xl font-bold mb-2">Collaborative Sudoku</h1>
        <div className="text-lg">
          Game Code: {gameCode} | Player: {playerName}
        </div>
        <div className="mt-2">
          Time: {formatTime(gameTime)} | Errors: {errors}/3
        </div>
      </div>

      <div className="relative grid grid-cols-9 gap-0 p-[2px] bg-gray-800 rounded-lg">
        {board.map((row, rowIndex) => (
          row.map((cell, colIndex) => {
            const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === colIndex;
            const isPartnerSelected = partnerActiveCell?.row === rowIndex && partnerActiveCell?.col === colIndex;
            const isInitialCell = cell !== 0;
            
            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                onClick={() => !isInitialCell && handleCellClick(rowIndex, colIndex)}
                className={`
                  w-11 h-11 flex items-center justify-center text-lg
                  ${isInitialCell ? 'font-bold text-gray-800' : 'text-blue-600'}
                  ${isSelected ? `border-2 border-[${playerColor}]` : 'border border-gray-300'}
                  ${isPartnerSelected ? `border-2 border-[${partnerActiveCell?.color}]` : ''}
                  relative bg-white
                  ${rowIndex === 0 ? 'border-t-2 border-t-gray-800' : ''}
                  ${rowIndex === 8 ? 'border-b-2 border-b-gray-800' : ''}
                  ${colIndex === 0 ? 'border-l-2 border-l-gray-800' : ''}
                  ${colIndex === 8 ? 'border-r-2 border-r-gray-800' : ''}
                  ${rowIndex % 3 === 2 ? 'border-b-2 border-b-gray-800' : ''}
                  ${colIndex % 3 === 2 ? 'border-r-2 border-r-gray-800' : ''}
                  transition-all duration-200
                  hover:bg-gray-50
                `}
              >
                {cell !== 0 && cell}
              </div>
            );
          })
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2 mt-4">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(number => (
          <button
            key={number}
            onClick={() => handleNumberInput(number)}
            className="w-12 h-12 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            {number}
          </button>
        ))}
      </div>
    </div>
  );
}