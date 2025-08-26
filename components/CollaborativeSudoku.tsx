"use client";

import React, { useState, useEffect } from 'react';

export default function CollaborativeSudoku() {
  const [gameCode, setGameCode] = useState<string>('');
  const [board, setBoard] = useState<number[][]>([]);
  const [selectedCell, setSelectedCell] = useState<{row: number, col: number} | null>(null);
  const [errors, setErrors] = useState<number>(0);
  const [gameTime, setGameTime] = useState<number>(0);
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [playerColor] = useState<string>('#FF4444'); // Would come from server
  const [partnerActiveCell, setPartnerActiveCell] = useState<{row: number, col: number, color: string} | null>(null);

  // Initialize empty board
  useEffect(() => {
    const emptyBoard = Array(9).fill(null).map(() => Array(9).fill(0));
    setBoard(emptyBoard);
  }, []);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameStarted) {
      interval = setInterval(() => {
        setGameTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameStarted]);

  // Format time as mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCellClick = (row: number, col: number) => {
    setSelectedCell({ row, col });
    // In real implementation, broadcast this to other player
  };

  const handleNumberInput = (number: number) => {
    if (!selectedCell) return;
    const { row, col } = selectedCell;
    
    // In real implementation, validate against solution
    const isValid = true; // Mock validation
    
    if (!isValid) {
      setErrors(prev => {
        const newErrors = prev + 1;
        if (newErrors >= 3) {
          alert('Game Over - Too many errors!');
          // Handle game over
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

  return (
    <div className="flex flex-col items-center p-4 max-w-lg mx-auto">
      <div className="mb-4 text-center">
        <h1 className="text-2xl font-bold mb-2">Collaborative Sudoku</h1>
        <div className="text-lg">
          Game Code: {gameCode || 'ABCD123'}
        </div>
        <div className="mt-2">
          Time: {formatTime(gameTime)} | Errors: {errors}/3
        </div>
      </div>

      <div className="grid grid-cols-9 gap-[1px] bg-gray-300 p-[1px] mb-4">
        {board.map((row, rowIndex) => (
          row.map((cell, colIndex) => {
            const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === colIndex;
            const isPartnerSelected = partnerActiveCell?.row === rowIndex && partnerActiveCell?.col === colIndex;
            
            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                onClick={() => handleCellClick(rowIndex, colIndex)}
                style={{
                  border: isSelected ? `2px solid ${playerColor}` :
                         isPartnerSelected ? `2px solid ${partnerActiveCell.color}` :
                         '1px solid #ccc',
                  backgroundColor: 'white'
                }}
                className={`
                  w-10 h-10 flex items-center justify-center cursor-pointer
                  ${(rowIndex + 1) % 3 === 0 && 'border-b-2 border-b-gray-800'}
                  ${(colIndex + 1) % 3 === 0 && 'border-r-2 border-r-gray-800'}
                `}
              >
                {cell !== 0 && cell}
              </div>
            );
          })
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2">
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