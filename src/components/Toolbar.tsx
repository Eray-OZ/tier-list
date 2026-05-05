"use client";

import React, { useState } from "react";
import { Download, Plus, RotateCcw, Image as ImageIcon, Link as LinkIcon, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToolbarProps {
  onAddItem: (url: string) => void;
  onAddRow: () => void;
  onReset: () => void;
  onExport: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({ onAddItem, onAddRow, onReset, onExport }) => {
  const [imageUrl, setImageUrl] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(false);

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (imageUrl.trim()) {
      onAddItem(imageUrl.trim());
      setImageUrl("");
      setShowUrlInput(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result;
        if (typeof result === "string") {
          onAddItem(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col gap-4 mt-8">
      <div className="flex flex-wrap items-center gap-3">
        {/* Add Item Section */}
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md cursor-pointer transition-colors text-sm font-medium">
            <ImageIcon size={18} />
            <span>Upload Image</span>
            <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
          </label>

          <button
            onClick={() => setShowUrlInput(!showUrlInput)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 border border-white/10 rounded-md transition-colors text-sm font-medium",
              showUrlInput ? "bg-white/10" : "hover:bg-white/5"
            )}
          >
            <LinkIcon size={18} />
            <span>URL</span>
          </button>
        </div>

        <div className="h-8 w-[1px] bg-white/10 mx-2 hidden sm:block" />

        {/* List Controls */}
        <button
          onClick={onAddRow}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md transition-colors text-sm font-medium"
        >
          <Plus size={18} />
          <span>Add Row</span>
        </button>

        <button
          onClick={onExport}
          className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-md transition-colors text-sm font-medium"
        >
          <Download size={18} />
          <span>Export</span>
        </button>

        <button
          onClick={onReset}
          className="flex items-center gap-2 px-4 py-2 border border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-md transition-colors text-sm font-medium ml-auto"
        >
          <RotateCcw size={18} />
          <span>Reset</span>
        </button>
      </div>

      {showUrlInput && (
        <form onSubmit={handleUrlSubmit} className="flex gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <input
            type="text"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="Paste image URL here..."
            className="flex-1 bg-white/5 border border-white/10 rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-sm font-medium"
          >
            Add
          </button>
        </form>
      )}
    </div>
  );
};
