"use client";

import React, { useState, useEffect, useRef } from "react";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { TierRow } from "./TierRow";
import { UnrankedArea } from "./UnrankedArea";
import { Toolbar } from "./Toolbar";
import { EditRowModal } from "./EditRowModal";
import { ListSelector } from "./ListSelector";
import { AppState, TierListData, Item, Tier } from "@/types";
import { DEFAULT_TIERS } from "@/lib/constants";
import { v4 as uuidv4 } from "uuid";
import { toPng } from "html-to-image";

const STORAGE_KEY = "tier-list-app-state";
const OLD_STORAGE_KEY = "tier-list-data";

export default function TierList() {
  const [state, setState] = useState<AppState | null>(null);
  const [editingTierId, setEditingTierId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Initialize state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const oldSaved = localStorage.getItem(OLD_STORAGE_KEY);

    if (saved) {
      try {
        setState(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved state", e);
        initializeDefault();
      }
    } else if (oldSaved) {
      // Migrate old data
      try {
        const oldData = JSON.parse(oldSaved);
        const newList: TierListData = {
          ...oldData,
          id: uuidv4(),
          name: "My First List",
        };
        setState({
          lists: [newList],
          activeListId: newList.id,
        });
        localStorage.removeItem(OLD_STORAGE_KEY);
      } catch (e) {
        initializeDefault();
      }
    } else {
      initializeDefault();
    }
  }, []);

  // Save state to localStorage on changes
  useEffect(() => {
    if (state) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state]);

  const initializeDefault = () => {
    const id = uuidv4();
    setState({
      lists: [
        {
          id,
          name: "My Tier List",
          tiers: DEFAULT_TIERS.map((t) => ({ ...t, id: uuidv4() })),
          items: {},
          unrankedItemIds: [],
        },
      ],
      activeListId: id,
    });
  };

  const activeList = state?.lists.find((l) => l.id === state.activeListId) || null;

  const updateActiveList = (updates: Partial<TierListData>) => {
    if (!state || !activeList) return;
    setState({
      ...state,
      lists: state.lists.map((l) => (l.id === state.activeListId ? { ...l, ...updates } : l)),
    });
  };

  const handleDragEnd = (result: DropResult) => {
    if (!activeList || !result.destination) return;

    const { source, destination, draggableId } = result;
    const newList = { ...activeList };

    // Remove from source
    if (source.droppableId === "unranked") {
      newList.unrankedItemIds = Array.from(newList.unrankedItemIds);
      newList.unrankedItemIds.splice(source.index, 1);
    } else {
      const tierIndex = newList.tiers.findIndex((t) => t.id === source.droppableId);
      const tier = { ...newList.tiers[tierIndex] };
      tier.itemIds = Array.from(tier.itemIds);
      tier.itemIds.splice(source.index, 1);
      newList.tiers[tierIndex] = tier;
    }

    // Add to destination
    if (destination.droppableId === "unranked") {
      newList.unrankedItemIds = Array.from(newList.unrankedItemIds);
      newList.unrankedItemIds.splice(destination.index, 0, draggableId);
    } else {
      const tierIndex = newList.tiers.findIndex((t) => t.id === destination.droppableId);
      const tier = { ...newList.tiers[tierIndex] };
      tier.itemIds = Array.from(tier.itemIds);
      tier.itemIds.splice(destination.index, 0, draggableId);
      newList.tiers[tierIndex] = tier;
    }

    updateActiveList(newList);
  };

  const addItem = (url: string) => {
    if (!activeList) return;
    const id = uuidv4();
    const newItem: Item = { id, url };
    updateActiveList({
      items: { ...activeList.items, [id]: newItem },
      unrankedItemIds: [id, ...activeList.unrankedItemIds],
    });
  };

  const addRow = () => {
    if (!activeList) return;
    const newTier: Tier = {
      id: uuidv4(),
      label: "New Tier",
      color: "#333333",
      itemIds: [],
    };
    updateActiveList({
      tiers: [...activeList.tiers, newTier],
    });
  };

  const deleteRow = (tierId: string) => {
    if (!activeList) return;
    const tier = activeList.tiers.find((t) => t.id === tierId);
    if (!tier) return;

    updateActiveList({
      tiers: activeList.tiers.filter((t) => t.id !== tierId),
      unrankedItemIds: [...activeList.unrankedItemIds, ...tier.itemIds],
    });
  };

  const updateRow = (id: string, label: string, color: string) => {
    if (!activeList) return;
    updateActiveList({
      tiers: activeList.tiers.map((t) => (t.id === id ? { ...t, label, color } : t)),
    });
    setEditingTierId(null);
  };

  const createNewList = () => {
    if (!state) return;
    const id = uuidv4();
    const newList: TierListData = {
      id,
      name: `New List ${state.lists.length + 1}`,
      tiers: DEFAULT_TIERS.map((t) => ({ ...t, id: uuidv4() })),
      items: {},
      unrankedItemIds: [],
    };
    setState({
      lists: [...state.lists, newList],
      activeListId: id,
    });
  };

  const deleteList = (id: string) => {
    if (!state || state.lists.length <= 1) return;
    const newLists = state.lists.filter((l) => l.id !== id);
    setState({
      lists: newLists,
      activeListId: state.activeListId === id ? newLists[0].id : state.activeListId,
    });
  };

  const renameList = (id: string, newName: string) => {
    if (!state) return;
    setState({
      ...state,
      lists: state.lists.map((l) => (l.id === id ? { ...l, name: newName } : l)),
    });
  };

  const exportAsImage = async () => {
    if (listRef.current) {
      try {
        const dataUrl = await toPng(listRef.current, { cacheBust: true, backgroundColor: "#0a0a0a" });
        const link = document.createElement("a");
        link.download = `${activeList?.name || "tier-list"}-${new Date().getTime()}.png`;
        link.href = dataUrl;
        link.click();
      } catch (err) {
        console.error("Oops, something went wrong!", err);
      }
    }
  };

  if (!state || !activeList) return null;

  const editingTier = editingTierId ? activeList.tiers.find((t) => t.id === editingTierId) || null : null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
      <header className="mb-8 text-center">
        <h1 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tighter uppercase italic">
          Tier List Maker
        </h1>
        <p className="text-white/40 font-medium">Rank your favorites with ease.</p>
      </header>

      <ListSelector
        lists={state.lists}
        activeListId={state.activeListId}
        onSwitch={(id) => setState({ ...state, activeListId: id })}
        onCreate={createNewList}
        onDelete={deleteList}
        onRename={renameList}
      />

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="premium-card rounded-xl overflow-hidden shadow-2xl" ref={listRef}>
          <div className="flex flex-col">
            {activeList.tiers.map((tier) => (
              <TierRow
                key={tier.id}
                tier={tier}
                items={tier.itemIds.map((id) => activeList.items[id]).filter(Boolean)}
                onEdit={setEditingTierId}
                onDelete={deleteRow}
              />
            ))}
          </div>
        </div>

        <UnrankedArea items={activeList.unrankedItemIds.map((id) => activeList.items[id]).filter(Boolean)} />
      </DragDropContext>

      <Toolbar
        onAddItem={addItem}
        onAddRow={addRow}
        onReset={() => {
          if (confirm("Are you sure you want to reset this list?")) {
            updateActiveList({
              tiers: DEFAULT_TIERS.map((t) => ({ ...t, id: uuidv4() })),
              items: {},
              unrankedItemIds: [],
            });
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
        Tier List
      </footer>
    </div>
  );
}
