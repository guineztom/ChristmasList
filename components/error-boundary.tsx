'use client';

import React from 'react';
import {AlertTriangle, RotateCcw} from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  {children: React.ReactNode},
  ErrorBoundaryState
> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = {hasError: false, message: ''};
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || 'Une erreur est survenue.',
    };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-[#FFF5F9] via-[#FDFBFF] to-[#F3EFFE]">
          <div className="max-w-md w-full bg-white border border-pink-100 rounded-[28px] p-6 shadow-xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#FDF2F8] text-[#DB2777] flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="font-display text-lg font-bold text-neutral-900">
              Oups, problème de chargement
            </h2>
            <p className="text-xs text-neutral-500 break-words">
              {this.state.message}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#EC4899] to-[#A855F7] rounded-2xl"
            >
              <RotateCcw className="w-4 h-4" />
              Recharger
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
