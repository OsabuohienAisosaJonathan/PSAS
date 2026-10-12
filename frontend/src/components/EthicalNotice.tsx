import React from 'react';
import { AlertTriangle, Lock } from 'lucide-react';

export const EthicalNotice: React.FC = () => {
  return (
    <div className="bg-amber-950/30 border border-amber-600/30 rounded-xl p-3.5 mb-6 text-amber-200/90 text-xs flex items-start space-x-3">
      <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
      <div className="space-y-1">
        <p className="font-semibold text-amber-300">
          Ethical Research & Privacy Notice (Dissertation Protocol):
        </p>
        <p className="text-amber-200/80 leading-relaxed">
          This system is a defensive security evaluation tool developed for academic research. 
          <strong className="text-amber-200"> Never enter a password that you currently use on a real or sensitive account.</strong> 
          Candidate inputs are processed strictly client-side in browser memory with zero plaintext retention.
        </p>
      </div>
    </div>
  );
};
