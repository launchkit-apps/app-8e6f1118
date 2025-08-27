"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
  const [seed, setSeed] = useState<string>('');

  const generateSudokuWithSeed = (difficulty: 'easy' | 'medium' | 'hard', seed: string) => {
    const seededRandom = () => {
      const x = Math.sin(Number(seed)) * 10000;
      seed = (Number(seed) * 1234567).toString();
      return x - Math.floor(x);
    };

    const seededShuffle = (array: number[]) => {
      const shuffled = [...array];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(seededRandom() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    };

    const board = Array(9).fill(null).map(() => Array(9).fill(0));
    const numbers = seededShuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    board[0] = [...numbers];

    const solve = (row = 1, col = 0): boolean => {
      if (row === 9) return true;
      if (col === 9) return solve(row + 1, 0);
      if (board[row][col] !== 0) return solve(row, col + 1);
      
      const nums = seededShuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
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

    const cellsToRemoveOrder = Array(81).fill(0).map((_, i) => i)
      .sort(() => seededRandom() - 0.5);

    for (let i = 0; i < cellsToRemove; i++) {
      const cellIndex = cellsToRemoveOrder[i];
      const row = Math.floor(cellIndex / 9);
      const col = cellIndex % 9;
      board[row][col] = 0;
    }

    return board;
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

  const handleCreateGame = async () => {
    if (!playerName) {
      alert('Please enter your name');
      return;
    }
    const newGameCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const newSeed = Date.now().toString();
    const initialBoard = generateSudokuWithSeed(difficulty, newSeed);
    
    const { error } = await supabase
      .from('games')
      .insert([{
        code: newGameCode,
        board: initialBoard,
        solution: solution,
        seed: newSeed,
        difficulty,
        players: {
          [playerName]: {
            color: playerColor,
            activeCell: null
          }
        },
        errors: 0,
        game_time: 0,
        start_time: new Date().toISOString()
      }]);

    if (error) {
      alert('Error creating game');
      return;
    }

    setSeed(newSeed);
    setGameCode(newGameCode);
    setBoard(initialBoard);
    setGameState('game');
  };

  const handleJoinGame = async () => {
    if (!playerName) {
      alert('Please enter your name');
      return;
    }
    if (!joinCode) {
      alert('Please enter a game code');
      return;
    }

    const { data: gameData, error } = await supabase
      .from('games')
      .select('*')
      .eq('code', joinCode)
      .single();

    if (error || !gameData) {
      alert('Game not found!');
      return;
    }

    const { error: updateError } = await supabase
      .from('games')
      .update({
        players: {
          ...gameData.players,
          [playerName]: {
            color: playerColor,
            activeCell: null
          }
        }
      })
      .eq('code', joinCode);

    if (updateError) {
      alert('Error joining game');
      return;
    }

    setGameCode(joinCode);
    setBoard(gameData.board);
    setSolution(gameData.solution);
    setSeed(gameData.seed);
    setGameState('game');
  };

  const handleNumberInput = async (number: number) => {
    if (!selectedCell) return;
    const { row, col } = selectedCell;
    const isValid = solution[row][col] === number;
    
    const newBoard = [...board];
    newBoard[row][col] = number;
    
    const { error } = await supabase
      .from('games')
      .update({
        board: newBoard,
        errors: isValid ? errors : errors + 1
      })
      .eq('code', gameCode);

    if (error) {
      alert('Error updating game');
      return;
    }
    
    if (!gameStarted) {
      setGameStarted(true);
    }
  };

  const handleCellClick = async (row: number, col: number) => {
    if (board[row][col] === 0) {
      setSelectedCell({ row, col });
      
      const { error } = await supabase
        .from('games')
        .update({
          [`players.${playerName}.activeCell`]: { row, col }
        })
        .eq('code', gameCode);

      if (error) {
        alert('Error updating cell selection');
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (gameState === 'game' && gameCode) {
      const gameSubscription = supabase
        .channel(`game_${gameCode}`)
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'games',
          filter: `code=eq.${gameCode}`
        }, payload => {
          const gameData = payload.new;
          if (gameData) {
            setBoard(gameData.board);
            setErrors(gameData.errors);
            setGameTime(Math.floor((Date.now() - new Date(gameData.start_time).getTime()) / 1000));
            
            const players = Object.entries(gameData.players);
            const partner = players.find(([name]) => name !== playerName);
            if (partner) {
              setPartnerActiveCell({
                ...partner[1].activeCell,
                color: partner[1].color
              });
            }
          }
        })
        .subscribe();

      return () => {
        supabase.removeChannel(gameSubscription);
      };
    }
  }, [gameState, gameCode, playerName]);

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