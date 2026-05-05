"use client";

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Tier } from "@/types";

interface EditRowModalProps {
  tier: Tier | null;
  onClose: () => void;
  onSave: (id: string, label: string, color: string) => void;
}

const PRESET_COLORS = [
  "#ff7f7f", "#ffbf7f", "#ffff7f", "#7fff7f", "#7fbfff", "#7f7fff", "#ff7fff", "#bf7fbf", "#333333"
];

export const EditRowModal: React.FC<EditRowModalProps> = ({ tier, onClose, onSave }) => {
  const [label, setLabel] = useState("");
  const [color, setColor] = useState("");

  useEffect(() => {
    if (tier) {
      setLabel(tier.label);
      setColor(tier.color);
    }
  }, [tier]);

  if (!tier) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="premium-card w-full max-w-md rounded-xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h3 className="text-lg font-bold">Edit Row</h3>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-white/60">Row Label</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. S-Tier"
            />
          </div>

          <div className="flex flex-col gap-3">
            <label className="text-sm font-medium text-white/60">Row Color</label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-10 h-10 rounded-full border-2 transition-transform hover:scale-110 ${
                    color === c ? "border-white scale-110" : "border-transparent"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-10 h-10 rounded-full overflow-hidden border-2 border-transparent cursor-pointer"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <button
              onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-white/10 hover:bg-white/5 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(tier.id, label, color)}
              className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 transition-colors font-bold"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
