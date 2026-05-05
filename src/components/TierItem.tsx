"use client";

import React from "react";
import { Draggable } from "@hello-pangea/dnd";
import { cn } from "@/lib/utils";

interface TierItemProps {
  id: string;
  url: string;
  index: number;
}

export const TierItem: React.FC<TierItemProps> = ({ id, url, index }) => {
  return (
    <Draggable draggableId={id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={cn(
            "w-16 h-16 md:w-20 md:h-20 flex-shrink-0 rounded-sm overflow-hidden border border-white/10 transition-shadow",
            snapshot.isDragging ? "shadow-2xl z-50 ring-2 ring-blue-500" : "shadow-md"
          )}
        >
          <img
            src={url}
            alt="Tier Item"
            className="w-full h-full object-cover pointer-events-none"
          />
        </div>
      )}
    </Draggable>
  );
};
