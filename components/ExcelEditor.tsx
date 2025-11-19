"use client";

import { HotTable } from "@handsontable/react-wrapper";
import "handsontable/dist/handsontable.full.min.css";
import { registerAllModules } from "handsontable/registry";
import { useEffect, useRef, useState } from "react";

registerAllModules();

interface ExcelEditorProps {
  initialData?: any[][];
  onSave: (data: any[][]) => void;
  onCancel: () => void;
}

export default function ExcelEditor({
  initialData,
  onSave,
  onCancel,
}: ExcelEditorProps) {
  const hotTableRef = useRef<any>(null);
  const [data, setData] = useState<any[][]>(initialData || []);

  useEffect(() => {
    if (initialData) {
      setData(initialData);
    }
  }, [initialData]);

  const handleSave = () => {
    if (hotTableRef.current) {
      const hotInstance = hotTableRef.current.hotInstance;
      const sheetData = hotInstance.getData();
      onSave(sheetData);
    }
  };

  const handleAddRow = () => {
    if (hotTableRef.current) {
      const hotInstance = hotTableRef.current.hotInstance;
      const rowCount = hotInstance.countRows();
      hotInstance.alter("insert_row", rowCount);
    }
  };

  const handleAddColumn = () => {
    if (hotTableRef.current) {
      const hotInstance = hotTableRef.current.hotInstance;
      const colCount = hotInstance.countCols();
      hotInstance.alter("insert_col", colCount);
    }
  };

  return (
    <div className="excel-editor-container">
      <div className="excel-editor-toolbar">
        <button onClick={handleAddRow} className="toolbar-button">
          ➕ 행 추가
        </button>
        <button onClick={handleAddColumn} className="toolbar-button">
          ➕ 열 추가
        </button>
        <div className="toolbar-spacer"></div>
        <button onClick={handleSave} className="toolbar-button save-button">
          💾 저장
        </button>
        <button onClick={onCancel} className="toolbar-button cancel-button">
          ❌ 취소
        </button>
      </div>
      <HotTable
        ref={hotTableRef}
        data={data}
        licenseKey="non-commercial-and-evaluation"
        width="100%"
        height="600"
        rowHeaders={true}
        colHeaders={true}
        contextMenu={true}
        manualColumnResize={true}
        manualRowResize={true}
        stretchH="all"
        autoWrapRow={true}
        autoWrapCol={true}
        className="excel-table"
      />
      <style jsx>{`
        .excel-editor-container {
          width: 100%;
          margin-top: 24px;
        }

        .excel-editor-toolbar {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;
          padding: 12px;
          background: #f8f9ff;
          border-radius: 8px;
          align-items: center;
        }

        .toolbar-button {
          padding: 8px 16px;
          border: 1px solid #667eea;
          background: white;
          color: #667eea;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .toolbar-button:hover {
          background: #667eea;
          color: white;
        }

        .save-button {
          background: #667eea;
          color: white;
          border-color: #667eea;
        }

        .save-button:hover {
          background: #764ba2;
        }

        .cancel-button {
          border-color: #999;
          color: #666;
        }

        .cancel-button:hover {
          background: #999;
          color: white;
        }

        .toolbar-spacer {
          flex: 1;
        }

        .excel-table {
          border: 1px solid #ddd;
          border-radius: 8px;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
