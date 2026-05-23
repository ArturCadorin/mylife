/**
 * Export utilities — PDF (print), XLSX (SheetJS) e Google Drive.
 */
import * as XLSX from 'xlsx';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ExcelSheet {
  name: string;
  rows: (string | number | null)[][];
}

// ── XLSX ──────────────────────────────────────────────────────────────────────

export function downloadXlsx(sheets: ExcelSheet[], filename: string) {
  const wb = XLSX.utils.book_new();

  for (const sheet of sheets) {
    const ws = XLSX.utils.aoa_to_sheet(sheet.rows);

    // Auto-fit column widths
    const colWidths = sheet.rows.reduce<number[]>((acc, row) => {
      row.forEach((cell, i) => {
        const len = cell == null ? 0 : String(cell).length;
        acc[i] = Math.max(acc[i] ?? 0, len);
      });
      return acc;
    }, []);
    ws['!cols'] = colWidths.map((w) => ({ wch: Math.min(w + 2, 60) }));

    XLSX.utils.book_append_sheet(wb, ws, sheet.name);
  }

  XLSX.writeFile(wb, `${filename}.xlsx`);
}

/** Returns a Blob (for Google Drive upload) instead of downloading. */
export function buildXlsxBlob(sheets: ExcelSheet[]): Blob {
  const wb = XLSX.utils.book_new();
  for (const sheet of sheets) {
    const ws = XLSX.utils.aoa_to_sheet(sheet.rows);
    const colWidths = sheet.rows.reduce<number[]>((acc, row) => {
      row.forEach((cell, i) => {
        const len = cell == null ? 0 : String(cell).length;
        acc[i] = Math.max(acc[i] ?? 0, len);
      });
      return acc;
    }, []);
    ws['!cols'] = colWidths.map((w) => ({ wch: Math.min(w + 2, 60) }));
    XLSX.utils.book_append_sheet(wb, ws, sheet.name);
  }
  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  return new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

// ── PDF (print) ───────────────────────────────────────────────────────────────

export function triggerPrint() {
  window.print();
}

// ── Google Drive ──────────────────────────────────────────────────────────────

let _driveToken: string | null = null;

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (cfg: {
            client_id: string;
            scope: string;
            callback: (resp: { access_token?: string; error?: string }) => void;
          }) => { requestAccessToken: () => void };
        };
      };
    };
  }
}

function loadGisScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts) { resolve(); return; }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Falha ao carregar Google Identity Services'));
    document.head.appendChild(script);
  });
}

export async function getGoogleDriveToken(clientId: string): Promise<string> {
  if (_driveToken) return _driveToken;
  await loadGisScript();
  return new Promise((resolve, reject) => {
    const client = window.google!.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'https://www.googleapis.com/auth/drive.file',
      callback: (resp) => {
        if (resp.access_token) {
          _driveToken = resp.access_token;
          resolve(resp.access_token);
        } else {
          reject(new Error(resp.error ?? 'Autorização negada'));
        }
      },
    });
    client.requestAccessToken();
  });
}

/** Revoke token so next upload re-prompts auth */
export function revokeGoogleDriveToken() {
  _driveToken = null;
}

/** Upload a Blob to Google Drive and return the file URL. */
export async function uploadToGoogleDrive(
  blob: Blob,
  filename: string,
  accessToken: string,
): Promise<string> {
  const meta = JSON.stringify({ name: filename, mimeType: blob.type });

  const form = new FormData();
  form.append('metadata', new Blob([meta], { type: 'application/json' }));
  form.append('file', blob);

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink',
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: form,
    },
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? `Drive error ${res.status}`);
  }

  const data: { id: string; webViewLink: string } = await res.json();
  return data.webViewLink;
}
