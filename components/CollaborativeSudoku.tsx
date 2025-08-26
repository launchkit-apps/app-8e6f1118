"use client";

import React, { useState, useEffect } from 'react';

export default function CollaborativeSudoku() {
  // [Previous state declarations remain the same]
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

  const generateSudoku = (difficulty: 'easy' | 'medium' | 'hard') => {
    // Initialize empty board
    const base = Array(9).fill(null).map(() => Array(9).fill(0));
    
    // Fill diagonal boxes first (they are independent)
    for (let box = 0; box < 9; box += 3) {
      const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          const randomIndex = Math.floor(Math.random() * nums.length);
          base[box + i][box + j] = nums[randomIndex];
          nums.splice(randomIndex, 1);
        }
      }
    }

    // Solve the rest of the puzzle
    const solution = solveSudoku([...base]);
    setSolution(solution);
    
    // Remove cells based on difficulty
    const cellsToRemove = {
      easy: 35,
      medium: 45,
      hard: 55
    }[difficulty];
    
    // Remove cells strategically
    const puzzle = removeCellsStrategically([...solution], cellsToRemove);
    return puzzle;
  };

  const removeCellsStrategically = (board: number[][], count: number) => {
    const puzzle = [...board].map(row => [...row]);
    let cellsRemoved = 0;

    // Remove cells while ensuring unique solution
    while (cellsRemoved < count) {
      const row = Math.floor(Math.random() * 9);
      const col = Math.floor(Math.random() * 9);
      
      if (puzzle[row][col] !== 0) {
        const temp = puzzle[row][col];
        puzzle[row][col] = 0;
        
        // Check if puzzle still has unique solution
        const tempBoard = [...puzzle].map(row => [...row]);
        if (countSolutions(tempBoard) === 1) {
          cellsRemoved++;
        } else {
          puzzle[row][col] = temp;
        }
      }
    }

    return puzzle;
  };

  const countSolutions = (board: number[][]): number => {
    let count = 0;
    
    const isValid = (num: number, pos: [number, number]): boolean => {
      const [row, col] = pos;
      
      // Check row
      for (let x = 0; x < 9; x++) {
        if (board[row][x] === num && x !== col) return false;
      }
      
      // Check column
      for (let x = 0; x < 9; x++) {
        if (board[x][col] === num && x !== row) return false;
      }
      
      // Check 3x3 box
      const boxRow = Math.floor(row / 3) * 3;
      const boxCol = Math.floor(col / 3) * 3;
      
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          if (board[boxRow + i][boxCol + j] === num && 
              (boxRow + i !== row || boxCol + j !== col)) {
            return false;
          }
        }
      }
      
      return true;
    };

    const solve = () => {
      if (count > 1) return;
      
      let isEmpty = false;
      let row = -1;
      let col = -1;
      
      for (let i = 0; i < 9 && !isEmpty; i++) {
        for (let j = 0; j < 9 && !isEmpty; j++) {
          if (board[i][j] === 0) {
            row = i;
            col = j;
            isEmpty = true;
          }
        }
      }
      
      if (!isEmpty) {
        count++;
        return;
      }
      
      for (let num = 1; num <= 9; num++) {
        if (isValid(num, [row, col])) {
          board[row][col] = num;
          solve();
          board[row][col] = 0;
        }
      }
    };

    solve();
    return count;
  };

  // [Keep all other existing functions the same]

  if (gameState === 'lobby') {
    return (
      // [Keep lobby JSX the same]
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

      <div className="grid grid-cols-9 gap-0 border-2 border-gray-800">
        {board.map((row, rowIndex) => (
          row.map((cell, colIndex) => {
            const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === colIndex;
            const isPartnerSelected = partnerActiveCell?.row === rowIndex && partnerActiveCell?.col === colIndex;
            const isInitialCell = cell !== 0;
            
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