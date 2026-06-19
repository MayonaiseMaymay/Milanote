import React from 'react';

export function GetNodeText() {
  return (
    <div className="absolute p-4 bg-white border border-gray-300 rounded shadow-md min-w-[200px] min-h-[100px]">
      <textarea
        className="w-full h-full resize-none outline-none bg-transparent"
        placeholder="Schreib etwas..."
      />
    </div>
  );
}