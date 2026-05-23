'use client';

import { useState, useRef, useEffect } from 'react';
import { FileSpreadsheet, Printer, Cloud, ChevronDown, Loader2, Check, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

import {
  downloadXlsx,
  buildXlsxBlob,
  triggerPrint,
  getGoogleDriveToken,
  uploadToGoogleDrive,
  type ExcelSheet,
} from '@/lib/export';

interface ExportMenuProps {
  /** Called synchronously when the user picks an export. Returns the sheets to export. */
  getSheets: () => ExcelSheet[];
  filename?: string;
  /** Optional Google Drive client ID. If omitted, Drive option is hidden. */
  googleClientId?: string;
}

export function ExportMenu({
  getSheets,
  filename = 'relatorio-mylife',
  googleClientId,
}: ExportMenuProps) {
  const [open, setOpen]       = useState(false);
  const [loading, setLoading] = useState<'excel' | 'drive' | null>(null);
  const [driveLink, setDriveLink] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  async function handleExcel() {
    setOpen(false);
    setLoading('excel');
    try {
      const sheets = getSheets();
      downloadXlsx(sheets, filename);
      toast.success('Arquivo Excel gerado!');
    } catch (err) {
      toast.error('Erro ao gerar Excel.');
      console.error(err);
    } finally {
      setLoading(null);
    }
  }

  function handlePrint() {
    setOpen(false);
    triggerPrint();
  }

  async function handleGoogleDrive() {
    setOpen(false);
    if (!googleClientId) return;
    setLoading('drive');
    setDriveLink(null);
    try {
      const token  = await getGoogleDriveToken(googleClientId);
      const sheets = getSheets();
      const blob   = buildXlsxBlob(sheets);
      const link   = await uploadToGoogleDrive(blob, `${filename}.xlsx`, token);
      setDriveLink(link);
      toast.success(
        <span className="flex items-center gap-2">
          Enviado ao Google Drive!
          <a href={link} target="_blank" rel="noopener noreferrer"
             className="underline font-semibold flex items-center gap-1">
            Abrir <ExternalLink className="h-3 w-3" />
          </a>
        </span>,
        { duration: 8000 },
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      if (msg.includes('popup_closed') || msg.includes('access_denied')) {
        toast.info('Autorização cancelada.');
      } else {
        toast.error(`Erro ao enviar ao Drive: ${msg}`);
      }
    } finally {
      setLoading(null);
    }
  }

  const busy = loading !== null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={busy}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-colors disabled:opacity-50"
      >
        {busy ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
        )}
        Exportar
        <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-50 w-52 rounded-xl border border-slate-200 bg-white shadow-lg shadow-slate-200/60 overflow-hidden animate-fade-in-up">
          {/* Excel */}
          <button
            type="button"
            onClick={handleExcel}
            className="flex w-full items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50">
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            </span>
            <div className="text-left">
              <p className="font-medium leading-tight">Excel (.xlsx)</p>
              <p className="text-xs text-slate-400">Planilha com todos os dados</p>
            </div>
          </button>

          {/* PDF / Print */}
          <button
            type="button"
            onClick={handlePrint}
            className="flex w-full items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors border-t border-slate-100"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50">
              <Printer className="h-4 w-4 text-rose-500" />
            </span>
            <div className="text-left">
              <p className="font-medium leading-tight">PDF / Imprimir</p>
              <p className="text-xs text-slate-400">Imprimir ou salvar como PDF</p>
            </div>
          </button>

          {/* Google Drive */}
          {googleClientId ? (
            <button
              type="button"
              onClick={handleGoogleDrive}
              className="flex w-full items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors border-t border-slate-100"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50">
                <Cloud className="h-4 w-4 text-blue-500" />
              </span>
              <div className="text-left flex-1">
                <p className="font-medium leading-tight flex items-center gap-1.5">
                  Google Drive
                  {driveLink && <Check className="h-3.5 w-3.5 text-emerald-500" />}
                </p>
                <p className="text-xs text-slate-400">
                  {driveLink ? 'Enviado — clique para enviar novamente' : 'Salvar planilha no Drive'}
                </p>
              </div>
            </button>
          ) : (
            <div className="flex items-center gap-3 px-4 py-3 border-t border-slate-100 opacity-50 cursor-not-allowed">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-50">
                <Cloud className="h-4 w-4 text-slate-400" />
              </span>
              <div className="text-left">
                <p className="text-sm font-medium text-slate-500 leading-tight">Google Drive</p>
                <p className="text-xs text-slate-400">Configure NEXT_PUBLIC_GOOGLE_CLIENT_ID</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
