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

  const generateSudoku = () => {
    const base = Array(9).fill(null).map(() => Array(9).fill(0));
    const solution = solveSudoku([...base]);
    const puzzle = removeCells([...solution]);
    return puzzle;
  };

  const solveSudoku = (board: number[][]) => {
    const find_empty = () => {
      for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
          if (board[i][j] === 0) return [i, j];
        }
      }
      return null;
    };

    const valid = (num: number, pos: number[], board: number[][]) => {
      const [row, col] = pos;

      for (let x = 0; x < 9; x++) {
        if (board[row][x] === num && col !== x) return false;
      }

      for (let x = 0; x < 9; x++) {
        if (board[x][col] === num && row !== x) return false;
      }

      const box_x = Math.floor(col / 3) * 3;
      const box_y = Math.floor(row / 3) * 3;

      for (let i = box_y; i < box_y + 3; i++) {
        for (let j = box_x; j < box_x + 3; j++) {
          if (board[i][j] === num && i !== row && j !== col) return false;
        }
      }

      return true;
    };

    const solve = () => {
      const find = find_empty();
      if (!find) return true;

      const [row, col] = find;

      for (let i = 1; i <= 9; i++) {
        if (valid(i, [row, col], board)) {
          board[row][col] = i;

          if (solve()) return true;

          board[row][col] = 0;
        }
      }

      return false;
    };

    solve();
    return board;
  };

  const removeCells = (board: number[][]) => {
    const difficulty = 40; // Number of cells to remove
    const puzzle = [...board].map(row => [...row]);
    let count = 0;

    while (count < difficulty) {
      const row = Math.floor(Math.random() * 9);
      const col = Math.floor(Math.random() * 9);
      
      if (puzzle[row][col] !== 0) {
        puzzle[row][col] = 0;
        count++;
      }
    }

    return puzzle;
  };

  useEffect(() => {
    const initialBoard = generateSudoku();
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCellClick = (row: number, col: number) => {
    setSelectedCell({ row, col });
  };

  const handleNumberInput = (number: number) => {
    if (!selectedCell) return;
    const { row, col } = selectedCell;
    const isValid = true;
    
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

      <div className="grid grid-cols-9 gap-0 border-2 border-gray-800 p-0">
        {board.map((row, rowIndex) => (
          row.map((cell, colIndex) => {
            const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === colIndex;
            const isPartnerSelected = partnerActiveCell?.row === rowIndex && partnerActiveCell?.col === colIndex;
            
            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                onClick={() => handleCellClick(rowIndex, colIndex)}
                style={{
                  borderColor: isSelected ? playerColor :
                             isPartnerSelected ? partnerActiveCell.color :
                             '#ccc'
                }}
                className={`
                  w-10 h-10 flex items-center justify-center cursor-pointer bg-white
                  border
                  ${isSelected || isPartnerSelected ? 'border-2' : 'border-[0.5px]'}
                  ${rowIndex % 3 === 2 && rowIndex !== 8 ? 'border-b-2 border-b-gray-800' : ''}
                  ${colIndex % 3 === 2 && colIndex !== 8 ? 'border-r-2 border-r-gray-800' : ''}
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