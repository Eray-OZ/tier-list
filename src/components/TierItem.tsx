"use client";

import React from "react";
import { Draggable } from "@hello-pangea/dnd";
import { cn } from "@/lib/utils";

import { X } from "lucide-react";

interface TierItemProps {
  id: string;
  url: string;
  index: number;
  onDelete?: (id: string) => void;
}

export const TierItem: React.FC<TierItemProps> = ({ id, url, index, onDelete }) => {
  return (
    <Draggable draggableId={id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={cn(
            "w-16 h-16 md:w-20 md:h-20 flex-shrink-0 rounded-sm overflow-hidden border border-white/10 transition-shadow relative group/item",
            snapshot.isDragging ? "shadow-2xl z-50 ring-2 ring-blue-500" : "shadow-md"
          )}
        >
          <img src={url} alt="Tier Item" className="w-full h-full object-cover pointer-events-none" />
          
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(id);
              }}
              className="absolute top-0.5 right-0.5 p-0.5 bg-red-600 text-white rounded-sm opacity-0 group-hover/item:opacity-100 transition-opacity z-10 hover:bg-red-500"
              title="Delete Item"
            >
              <X size={12} />
            </button>
          )}
        </div>
      )}
    </Draggable>
  );
};
