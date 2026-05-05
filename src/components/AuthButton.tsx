"use client";

import React from "react";
import { auth, googleProvider } from "@/lib/firebase";
import { signInWithPopup, signOut, User } from "firebase/auth";
import { LogIn, LogOut, User as UserIcon } from "lucide-react";

interface AuthButtonProps {
  user: User | null;
}

export const AuthButton: React.FC<AuthButtonProps> = ({ user }) => {
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  if (user) {
    return (
      <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-full pl-1 pr-4 py-1">
        {user.photoURL ? (
          <img src={user.photoURL} alt={user.displayName || "User"} className="w-8 h-8 rounded-full" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
            <UserIcon size={16} />
          </div>
        )}
        <div className="flex flex-col">
          <span className="text-xs font-bold leading-none">{user.displayName}</span>
          <button
            onClick={handleLogout}
            className="text-[10px] text-white/40 hover:text-red-400 text-left transition-colors uppercase font-black tracking-widest mt-0.5"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={handleLogin}
      className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-full text-sm font-bold hover:bg-white/90 transition-all active:scale-95"
    >
      <LogIn size={18} />
      <span>Sign in with Google</span>
    </button>
  );
};
