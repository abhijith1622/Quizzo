/**
 * Utility for CSV generation, formula injection escaping, and browser file downloads
 */

export function escapeCsv(val: any): string {
  if (val === null || val === undefined) return '';
  let str = String(val).trim();

  // CSV Formula Injection mitigation: neutralize leading '=', '+', '-', '@', '\t', '\r'
  if (/^[=+\-@\t\r]/.test(str)) {
    str = "'" + str;
  }

  // Escape commas, quotes, line breaks
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r') || str.startsWith("'")) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

export function downloadCsvBlob(csvContent: string, filename: string) {
  // Ensure UTF-8 BOM
  const contentWithBom = csvContent.startsWith('\uFEFF') ? csvContent : '\uFEFF' + csvContent;
  const blob = new Blob([contentWithBom], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export interface SimpleStandingsData {
  sessionId: string;
  quizTitle: string;
  completedAt?: string;
  participants: Array<{
    rank: number;
    nickname: string;
    score: number;
    streak?: number;
    correctCount?: number;
    accuracy?: number;
  }>;
}

/**
 * Generates and downloads a Participant Standings CSV on the client side
 */
export function exportClientStandingsCsv(data: SimpleStandingsData, customFilename?: string) {
  const safeSessionId = data.sessionId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = customFilename || `quizzo-standings-${safeSessionId}-${dateStr}.csv`;

  const headers = [
    'rank',
    'podium_position',
    'participant_id',
    'participant_name',
    'quiz_title',
    'session_id',
    'total_score',
    'streak',
    'completion_status',
    'submitted_at'
  ];

  const rows: string[][] = data.participants.map((p) => {
    let podium = '';
    if (p.rank === 1) podium = 'Gold';
    else if (p.rank === 2) podium = 'Silver';
    else if (p.rank === 3) podium = 'Bronze';

    return [
      escapeCsv(p.rank),
      escapeCsv(podium),
      escapeCsv(`p_${p.rank}`),
      escapeCsv(p.nickname),
      escapeCsv(data.quizTitle),
      escapeCsv(data.sessionId),
      escapeCsv(p.score),
      escapeCsv(p.streak || 0),
      escapeCsv('completed'),
      escapeCsv(data.completedAt || new Date().toISOString())
    ];
  });

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  downloadCsvBlob(csv, filename);
}
