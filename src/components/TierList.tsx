"use client";

import React, { useState, useEffect, useRef } from "react";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { TierRow } from "./TierRow";
import { UnrankedArea } from "./UnrankedArea";
import { Toolbar } from "./Toolbar";
import { EditRowModal } from "./EditRowModal";
import { TierListData, Item, Tier } from "@/types";
import { DEFAULT_TIERS } from "@/lib/constants";
import { v4 as uuidv4 } from "uuid";
import { toPng } from "html-to-image";

const STORAGE_KEY = "tier-list-data";

export default function TierList() {
  const [data, setData] = useState<TierListData | null>(null);
  const [editingTierId, setEditingTierId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Initialize data from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setData(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved data", e);
        resetToDefault();
      }
    } else {
      resetToDefault();
    }
  }, []);

  // Save data to localStorage on changes
  useEffect(() => {
    if (data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  }, [data]);

  const resetToDefault = () => {
    setData({
      tiers: DEFAULT_TIERS.map(t => ({ ...t, id: uuidv4() })),
      items: {},
      unrankedItemIds: [],
    });
  };

  const handleDragEnd = (result: DropResult) => {
    if (!data || !result.destination) return;

    const { source, destination, draggableId } = result;

    // Moving from one container to another (or same)
    const newData = { ...data };

    // Remove from source
    if (source.droppableId === "unranked") {
      newData.unrankedItemIds = Array.from(newData.unrankedItemIds);
      newData.unrankedItemIds.splice(source.index, 1);
    } else {
      const tierIndex = newData.tiers.findIndex((t) => t.id === source.droppableId);
      const tier = { ...newData.tiers[tierIndex] };
      tier.itemIds = Array.from(tier.itemIds);
      tier.itemIds.splice(source.index, 1);
      newData.tiers[tierIndex] = tier;
    }

    // Add to destination
    if (destination.droppableId === "unranked") {
      newData.unrankedItemIds = Array.from(newData.unrankedItemIds);
      newData.unrankedItemIds.splice(destination.index, 0, draggableId);
    } else {
      const tierIndex = newData.tiers.findIndex((t) => t.id === destination.droppableId);
      const tier = { ...newData.tiers[tierIndex] };
      tier.itemIds = Array.from(tier.itemIds);
      tier.itemIds.splice(destination.index, 0, draggableId);
      newData.tiers[tierIndex] = tier;
    }

    setData(newData);
  };

  const addItem = (url: string) => {
    if (!data) return;
    const id = uuidv4();
    const newItem: Item = { id, url };
    setData({
      ...data,
      items: { ...data.items, [id]: newItem },
      unrankedItemIds: [id, ...data.unrankedItemIds],
    });
  };

  const addRow = () => {
    if (!data) return;
    const newTier: Tier = {
      id: uuidv4(),
      label: "New Tier",
      color: "#333333",
      itemIds: [],
    };
    setData({
      ...data,
      tiers: [...data.tiers, newTier],
    });
  };

  const deleteRow = (tierId: string) => {
    if (!data) return;
    const tier = data.tiers.find(t => t.id === tierId);
    if (!tier) return;

    // Move items back to unranked
    setData({
      ...data,
      tiers: data.tiers.filter(t => t.id !== tierId),
      unrankedItemIds: [...data.unrankedItemIds, ...tier.itemIds],
    });
  };

  const updateRow = (id: string, label: string, color: string) => {
    if (!data) return;
    setData({
      ...data,
      tiers: data.tiers.map(t => t.id === id ? { ...t, label, color } : t),
    });
    setEditingTierId(null);
  };

  const exportAsImage = async () => {
    if (listRef.current) {
      try {
        const dataUrl = await toPng(listRef.current, { cacheBust: true, backgroundColor: "#0a0a0a" });
        const link = document.createElement("a");
        link.download = `tier-list-${new Date().getTime()}.png`;
        link.href = dataUrl;
        link.click();
      } catch (err) {
        console.error("Oops, something went wrong!", err);
      }
    }
  };

  if (!data) return null;

  const editingTier = editingTierId ? data.tiers.find(t => t.id === editingTierId) || null : null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
      <header className="mb-12 text-center">
        <h1 className="text-4xl md:text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400 mb-4 tracking-tighter uppercase italic">
          Tier List Maker
        </h1>
        <p className="text-white/40 font-medium">Rank your favorites with ease.</p>
      </header>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="premium-card rounded-xl overflow-hidden shadow-2xl" ref={listRef}>
          <div className="flex flex-col">
            {data.tiers.map((tier) => (
              <TierRow
                key={tier.id}
                tier={tier}
                items={tier.itemIds.map((id) => data.items[id]).filter(Boolean)}
                onEdit={setEditingTierId}
                onDelete={deleteRow}
              />
            ))}
          </div>
        </div>

        <UnrankedArea items={data.unrankedItemIds.map((id) => data.items[id]).filter(Boolean)} />
      </DragDropContext>

      <Toolbar
        onAddItem={addItem}
        onAddRow={addRow}
        onReset={() => {
          if (confirm("Are you sure you want to reset everything?")) {
            resetToDefault();
          }
        }}
        onExport={exportAsImage}
      />

      <EditRowModal
        tier={editingTier}
        onClose={() => setEditingTierId(null)}
        onSave={updateRow}
      />

      <footer className="mt-20 text-center text-white/20 text-xs font-medium uppercase tracking-widest pb-8">
        Built with Antigravity • Modern Tier List Experience
      </footer>
    </div>
  );
}
