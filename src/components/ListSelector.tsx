"use client";

import React, { useState } from "react";
import { ChevronDown, Plus, Trash2, Edit2, Check } from "lucide-react";
import { TierListData } from "@/types";
import { cn } from "@/lib/utils";

interface ListSelectorProps {
  lists: TierListData[];
  activeListId: string;
  onSwitch: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
  onRename: (id: string, newName: string) => void;
}

export const ListSelector: React.FC<ListSelectorProps> = ({
  lists,
  activeListId,
  onSwitch,
  onCreate,
  onDelete,
  onRename,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const activeList = lists.find((l) => l.id === activeListId);

  const handleRenameStart = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    setEditingId(id);
    setEditName(name);
  };

  const handleRenameSubmit = (e: React.FormEvent, id: string) => {
    e.preventDefault();
    if (editName.trim()) {
      onRename(id, editName.trim());
      setEditingId(null);
    }
  };

  return (
    <div className="relative mb-6">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between w-64 px-4 py-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors text-left"
        >
          <span className="font-semibold truncate">{activeList?.name || "Select List"}</span>
          <ChevronDown className={cn("transition-transform", isOpen && "rotate-180")} size={18} />
        </button>
        <button
          onClick={onCreate}
          className="p-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors text-white"
          title="New List"
        >
          <Plus size={20} />
        </button>
      </div>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-2 w-72 bg-[#121212] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="max-h-64 overflow-y-auto">
              {lists.map((list) => (
                <div
                  key={list.id}
                  onClick={() => {
                    onSwitch(list.id);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "flex items-center justify-between px-4 py-3 cursor-pointer transition-colors group",
                    activeListId === list.id ? "bg-blue-600/20" : "hover:bg-white/5"
                  )}
                >
                  {editingId === list.id ? (
                    <form
                      onSubmit={(e) => handleRenameSubmit(e, list.id)}
                      className="flex-1 flex items-center gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        autoFocus
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 bg-black/40 border border-white/20 rounded px-2 py-0.5 text-sm outline-none"
                      />
                      <button type="submit" className="text-emerald-400 hover:text-emerald-300">
                        <Check size={16} />
                      </button>
                    </form>
                  ) : (
                    <>
                      <span className="text-sm font-medium truncate">{list.name}</span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => handleRenameStart(e, list.id, list.name)}
                          className="p-1 text-white/40 hover:text-white"
                        >
                          <Edit2 size={14} />
                        </button>
                        {lists.length > 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Delete list "${list.name}"?`)) onDelete(list.id);
                            }}
                            className="p-1 text-white/40 hover:text-red-400"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
