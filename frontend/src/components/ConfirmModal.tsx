import { AlertTriangle, Trash2, X } from 'lucide-react';
import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
}

interface ConfirmCtx {
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
}

const Ctx = createContext<ConfirmCtx>({ confirm: async () => false });
export const useConfirm = () => useContext(Ctx);

interface PendingConfirm extends ConfirmOptions {
  resolve: (v: boolean) => void;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null);

  const confirm = useCallback((opts: ConfirmOptions) =>
    new Promise<boolean>(resolve => setPending({ ...opts, resolve })), []);

  const handle = (v: boolean) => {
    pending?.resolve(v);
    setPending(null);
  };

  return (
    <Ctx.Provider value={{ confirm }}>
      {children}
      {pending && (
        <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm animate-modal-in">
            <div className="p-5">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 ${pending.danger ? 'bg-red-100' : 'bg-amber-100'}`}>
                {pending.danger ? <Trash2 size={20} className="text-red-500" /> : <AlertTriangle size={20} className="text-amber-500" />}
              </div>
              <h3 className="font-bold text-slate-800 text-base mb-1">{pending.title || '¿Estás segura?'}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{pending.message}</p>
            </div>
            <div className="flex gap-2 px-5 pb-5">
              <button className="btn-secondary flex-1 justify-center" onClick={() => handle(false)}>
                <X size={15} /> Cancelar
              </button>
              <button
                className={`flex-1 justify-center font-medium px-4 py-2 rounded-lg transition-colors inline-flex items-center gap-2 cursor-pointer ${
                  pending.danger
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-amber-500 hover:bg-amber-600 text-white'
                }`}
                onClick={() => handle(true)}
              >
                {pending.danger ? <Trash2 size={15} /> : <AlertTriangle size={15} />}
                {pending.confirmLabel || 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}
