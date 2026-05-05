"use client";

import React from "react";
import { Droppable } from "@hello-pangea/dnd";
import { TierItem } from "./TierItem";
import { Item } from "@/types";
import { cn } from "@/lib/utils";

interface UnrankedAreaProps {
  items: Item[];
  onDeleteItem: (itemId: string, containerId: string) => void;
}

export const UnrankedArea: React.FC<UnrankedAreaProps> = ({ items, onDeleteItem }) => {
  return (
    <div className="mt-8 premium-card rounded-lg overflow-hidden">
      <div className="bg-white/5 px-4 py-2 border-b border-white/10">
        <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Unranked Pool</h2>
      </div>
      <Droppable droppableId="unranked" direction="horizontal">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "min-h-[120px] flex flex-wrap content-start items-center p-4 gap-4 transition-colors",
              snapshot.isDraggingOver ? "bg-white/5" : "bg-transparent"
            )}
          >
            {items.map((item, index) => (
              <TierItem
                key={item.id}
                id={item.id}
                url={item.url}
                index={index}
                onDelete={(itemId) => onDeleteItem(itemId, "unranked")}
              />
            ))}
            {provided.placeholder}
            {items.length === 0 && !snapshot.isDraggingOver && (
              <div className="w-full flex items-center justify-center text-white/20 italic text-sm">
                Add images below to start ranking
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
};
