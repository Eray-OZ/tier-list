"use client";

import React, { useState, useEffect, useRef } from "react";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { TierRow } from "./TierRow";
import { UnrankedArea } from "./UnrankedArea";
import { Toolbar } from "./Toolbar";
import { EditRowModal } from "./EditRowModal";
import { ListSelector } from "./ListSelector";
import { AuthButton } from "./AuthButton";
import { AppState, TierListData, Item, Tier } from "@/types";
import { DEFAULT_TIERS } from "@/lib/constants";
import { v4 as uuidv4 } from "uuid";
import { toPng } from "html-to-image";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Cloud, CloudOff, Loader2 } from "lucide-react";

const STORAGE_KEY = "tier-list-app-state";

export default function TierList() {
  const [state, setState] = useState<AppState | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [editingTierId, setEditingTierId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          try {
            setState(JSON.parse(saved));
          } catch (e) {
            initializeDefault();
          }
        } else {
          initializeDefault();
        }
        setLoading(false);
      } else {
        fetchFromFirestore(u);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchFromFirestore = async (u: User) => {
    setLoading(true);
    try {
      const docRef = doc(db, "users", u.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setState(docSnap.data().appState);
      } else {
        const localSaved = localStorage.getItem(STORAGE_KEY);
        let initialState: AppState;
        if (localSaved) {
          try {
            initialState = JSON.parse(localSaved);
          } catch (e) {
            initialState = createDefaultState();
          }
        } else {
          initialState = createDefaultState();
        }
        setState(initialState);
        await setDoc(docRef, { appState: initialState });
      }
    } catch (e: any) {
      console.warn("Firestore fallback:", e.message);
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setState(JSON.parse(saved));
      else initializeDefault();
    } finally {
      setLoading(false);
    }
  };

  const createDefaultState = (): AppState => {
    const id = uuidv4();
    return {
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
    };
  };

  const saveToCloud = async (newState: AppState) => {
    if (!user) return;
    setSyncing(true);
    try {
      await setDoc(doc(db, "users", user.uid), { appState: newState });
    } catch (e) {
      console.error("Cloud save failed", e);
    } finally {
      setSyncing(false);
    }
  };

  const updateState = (newState: AppState) => {
    setState(newState);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    if (user) {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        saveToCloud(newState);
      }, 2000);
    }
  };

  const initializeDefault = () => {
    const initialState = createDefaultState();
    setState(initialState);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialState));
  };

  const activeList = state?.lists.find((l) => l.id === state.activeListId) || null;

  const updateActiveList = (updates: Partial<TierListData>) => {
    if (!state || !activeList) return;
    const newState = {
      ...state,
      lists: state.lists.map((l) => (l.id === state.activeListId ? { ...l, ...updates } : l)),
    };
    updateState(newState);
  };

  const handleDragEnd = (result: DropResult) => {
    if (!activeList || !result.destination) return;
    const { source, destination, draggableId } = result;
    const newList = { ...activeList };

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

  const handleFilesUpload = async (files: File[]) => {
    if (!activeList) return;

    setSyncing(true);
    try {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

      if (!cloudName || !uploadPreset) {
        throw new Error("Cloudinary configuration missing in .env.local");
      }

      // Her dosyayı sırayla yükle
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", uploadPreset);

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
          {
            method: "POST",
            body: formData,
          }
        );

        const data = await response.json();
        if (data.secure_url) {
          addItem(data.secure_url);
        }
      }
    } catch (e) {
      console.error("Cloudinary upload failed", e);
      // Fallback: Yerel yükleme (base64)
      for (const file of files) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const result = event.target?.result;
          if (typeof result === "string") {
            addItem(result);
          }
        };
        reader.readAsDataURL(file);
      }
    } finally {
      setSyncing(false);
    }
  };

  const addRow = () => {
    if (!activeList) return;
    const newTier: Tier = { id: uuidv4(), label: "New Tier", color: "#333333", itemIds: [] };
    updateActiveList({ tiers: [...activeList.tiers, newTier] });
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

  const deleteItem = (itemId: string, containerId: string) => {
    if (!activeList) return;
    const newList = { ...activeList };

    // Remove from container
    if (containerId === "unranked") {
      newList.unrankedItemIds = newList.unrankedItemIds.filter((id) => id !== itemId);
    } else {
      const tierIndex = newList.tiers.findIndex((t) => t.id === containerId);
      if (tierIndex !== -1) {
        const tier = { ...newList.tiers[tierIndex] };
        tier.itemIds = tier.itemIds.filter((id) => id !== itemId);
        newList.tiers[tierIndex] = tier;
      }
    }

    // Also remove from items dictionary
    const newItems = { ...newList.items };
    delete newItems[itemId];
    newList.items = newItems;

    updateActiveList(newList);
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
    updateState({ ...state, lists: [...state.lists, newList], activeListId: id });
  };

  const deleteList = (id: string) => {
    if (!state || state.lists.length <= 1) return;
    const newLists = state.lists.filter((l) => l.id !== id);
    updateState({
      lists: newLists,
      activeListId: state.activeListId === id ? newLists[0].id : state.activeListId,
    });
  };

  const renameList = (id: string, newName: string) => {
    if (!state) return;
    updateState({ ...state, lists: state.lists.map((l) => (l.id === id ? { ...l, name: newName } : l)) });
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
        console.error("Export failed", err);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <Loader2 className="animate-spin text-blue-500" size={48} />
      </div>
    );
  }

  if (!state || !activeList) return null;

  const editingTier = editingTierId ? activeList.tiers.find((t) => t.id === editingTierId) || null : null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
        <div className="text-center md:text-left">
          <h1 className="text-4xl md:text-6xl font-black text-white mb-2 tracking-tighter uppercase italic">
            Tier List Maker
          </h1>
          <div className="flex items-center justify-center md:justify-start gap-3">
            <p className="text-white/40 font-medium">Rank your favorites with ease.</p>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/5 text-[10px] font-bold uppercase tracking-wider text-white/30 border border-white/5">
              {user ? (
                <>
                  {syncing ? <Loader2 size={10} className="animate-spin" /> : <Cloud size={10} />}
                  <span>Cloud Sync Active</span>
                </>
              ) : (
                <>
                  <CloudOff size={10} />
                  <span>Local Mode</span>
                </>
              )}
            </div>
          </div>
        </div>
        <AuthButton user={user} />
      </div>

      <ListSelector
        lists={state.lists}
        activeListId={state.activeListId}
        onSwitch={(id) => updateState({ ...state, activeListId: id })}
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
                onDeleteItem={deleteItem}
              />
            ))}
          </div>
        </div>
        <UnrankedArea
          items={activeList.unrankedItemIds.map((id) => activeList.items[id]).filter(Boolean)}
          onDeleteItem={deleteItem}
        />
      </DragDropContext>

      <Toolbar
        onAddItem={addItem}
        onAddFiles={handleFilesUpload}
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

      <EditRowModal tier={editingTier} onClose={() => setEditingTierId(null)} onSave={updateRow} />

      <footer className="mt-20 text-center text-white/20 text-xs font-medium uppercase tracking-widest pb-8">
        Tier List
      </footer>
    </div>
  );
}
