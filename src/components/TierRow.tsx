"use client";

import React from "react";
import { Droppable } from "@hello-pangea/dnd";
import { TierItem } from "./TierItem";
import { Item, Tier } from "@/types";
import { Settings, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TierRowProps {
  tier: Tier;
  items: Item[];
  onEdit: (tierId: string) => void;
  onDelete: (tierId: string) => void;
}

export const TierRow: React.FC<TierRowProps> = ({ tier, items, onEdit, onDelete }) => {
  return (
    <div className="flex min-h-[80px] md:min-h-[100px] border-b border-white/5 last:border-b-0 group">
      {/* Tier Label */}
      <div
        className="w-20 md:w-32 flex items-center justify-center text-black font-bold text-xl md:text-2xl relative select-none"
        style={{ backgroundColor: tier.color }}
      >
        <span className="break-all text-center px-2">{tier.label}</span>
      </div>

      {/* Droppable Area */}
      <Droppable droppableId={tier.id} direction="horizontal">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "flex-1 flex flex-wrap content-start items-center p-2 gap-2 transition-colors",
              snapshot.isDraggingOver ? "bg-white/5" : "bg-transparent"
            )}
          >
            {items.map((item, index) => (
              <TierItem key={item.id} id={item.id} url={item.url} index={index} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      {/* Row Actions */}
      <div className="w-12 md:w-16 flex flex-col items-center justify-center gap-2 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(tier.id)}
          className="p-1.5 rounded-full hover:bg-white/10 transition-colors text-white/70 hover:text-white"
          title="Edit Row"
        >
          <Settings size={18} />
        </button>
        <button
          onClick={() => onDelete(tier.id)}
          className="p-1.5 rounded-full hover:bg-red-500/20 transition-colors text-red-400 hover:text-red-300"
          title="Delete Row"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
};
