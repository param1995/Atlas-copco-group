import ExcelJS from 'exceljs';

import type { DashboardSnapshot } from '../../api';
import { buildTelemetryExportTable } from './telemetry-export';

export async function createTelemetryWorkbook(
  snapshot: DashboardSnapshot
): Promise<Blob> {
  const table = buildTelemetryExportTable(snapshot);

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Telemetry');

  workbook.creator = 'Compressor Operations';

  worksheet.columns = table.headers.map((header, index) => ({
    key: `column${index}`,
    header,
    width: Math.min(32, Math.max(18, header.length + 2))
  }));

  worksheet.getRow(1).font = {
    bold: true,
    color: { argb: 'FFFFFFFF' }
  };

  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF176B56' }
  };

  table.rows.forEach((row) => {
    worksheet.addRow(row);
  });

  // Make Timestamp column wide enough for date + time
  worksheet.getColumn(1).width = 24;

  // Make all cells easier to read
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      row.alignment = {
        vertical: 'middle'
      };
    }
  });

  worksheet.views = [
    {
      state: 'frozen',
      ySplit: 1
    }
  ];

  worksheet.autoFilter = {
    from: {
      row: 1,
      column: 1
    },
    to: {
      row: 1,
      column: table.headers.length
    }
  };

  const buffer = await workbook.xlsx.writeBuffer();

  return new Blob(
    [buffer as unknown as BlobPart],
    {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }
  );
}