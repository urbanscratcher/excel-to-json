"use client";

import ky from "ky";
import { useState } from "react";
import ExcelEditor from "./components/ExcelEditor";

interface JsonData {
  [prefix: string]: {
    [lang: string]: any;
  };
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [jsonData, setJsonData] = useState<JsonData | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [downloadZip, setDownloadZip] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingSheet, setEditingSheet] = useState<{
    name: string;
    data: any[][];
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setSuccess(false);
      setJsonData(null);
      setCopiedKey(null);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await ky.get("/api/template").blob();

      // Excel 파일 다운로드
      const url = window.URL.createObjectURL(response);
      const a = document.createElement("a");
      a.href = url;

      a.download = "i18n-template.xlsx";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setError("템플릿 다운로드 중 오류가 발생했습니다.");
    }
  };

  const handleOpenEditor = () => {
    // 제공된 데이터만 사용: 분류, 소분류, 키코드, ko-KR, en-US, ja-JP, zh-Hans, zh-Hant
    const initialData = [
      [
        "분류",
        "소분류",
        "키코드",
        "ko-KR",
        "en-US",
        "ja-JP",
        "zh-Hans",
        "zh-Hant",
      ],
      ["공통", "공통", "확인", "확인", "Confirm", "確認", "确认", "確認"],
    ];

    setEditingSheet({
      name: "",
      data: initialData,
    });
    setEditMode(true);
  };

  const handleSaveSheet = async (sheetData: any[][]) => {
    if (!editingSheet) return;

    // 서버로 데이터 전송하여 Excel 파일 생성
    try {
      const response = await ky
        .post("/api/create-excel", {
          json: { sheets: { Sheet1: sheetData } },
        })
        .blob();

      const excelFile = new File([response], "i18n-template.xlsx", {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      setFile(excelFile);
      setEditMode(false);
      setEditingSheet(null);
      setSuccess(true);
      setError(null);
    } catch (err: any) {
      setError("Excel 파일 생성 중 오류가 발생했습니다.");
    }
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setEditingSheet(null);
  };

  const handleConvert = async () => {
    if (!file) {
      setError("파일을 선택해주세요.");
      return;
    }

    setIsConverting(true);
    setError(null);
    setSuccess(false);
    setJsonData(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      // ZIP 파일 다운로드 (체크박스가 체크되어 있을 때만)
      if (downloadZip) {
        const zipResponse = await ky
          .post("/api/convert", {
            body: formData,
          })
          .blob();

        const zipUrl = window.URL.createObjectURL(zipResponse);
        const zipLink = document.createElement("a");
        zipLink.href = zipUrl;
        zipLink.download = "i18n-json-files.zip";
        document.body.appendChild(zipLink);
        zipLink.click();
        window.URL.revokeObjectURL(zipUrl);
        document.body.removeChild(zipLink);
      }

      // JSON 데이터 가져오기
      const jsonResponse = await ky
        .post("/api/convert-json", {
          body: formData,
        })
        .json<{ success: boolean; data: JsonData }>();

      if (jsonResponse.success) {
        setJsonData(jsonResponse.data);
      }

      setSuccess(true);
      setFile(null);
      // 파일 input 초기화
      const fileInput = document.getElementById(
        "file-input"
      ) as HTMLInputElement;
      if (fileInput) {
        fileInput.value = "";
      }
    } catch (err: any) {
      if (err.response) {
        const errorData = await err.response.json();
        setError(errorData.error || "변환 중 오류가 발생했습니다.");
      } else {
        setError("네트워크 오류가 발생했습니다.");
      }
    } finally {
      setIsConverting(false);
    }
  };

  const handleCopyCode = async (text: string, key: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2000);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          document.execCommand("copy");
          setCopiedKey(key);
          setTimeout(() => setCopiedKey(null), 2000);
        } catch (err) {
          console.error("복사 실패:", err);
        }
        document.body.removeChild(textArea);
      }
    } catch (err) {
      console.error("복사 실패:", err);
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h1>Excel to JSON Converter</h1>
        <p className="description">
          Excel 파일을 업로드하면 i18n용 JSON 파일로 변환됩니다.
        </p>

        <div className="template-buttons">
          <button onClick={handleDownloadTemplate} className="template-button">
            📥 템플릿 Excel 다운로드
          </button>
          <button
            onClick={handleOpenEditor}
            className="template-button edit-button"
          >
            ✏️ 직접 편집하기
          </button>
        </div>

        <div className="upload-area">
          <input
            id="file-input"
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="file-input"
          />
          <label htmlFor="file-input" className="file-label">
            {file ? file.name : "Excel 파일 선택"}
          </label>
        </div>

        {file && (
          <div className="file-info">
            <p>
              선택된 파일: <strong>{file.name}</strong>
            </p>
            <p>파일 크기: {(file.size / 1024).toFixed(2)} KB</p>
          </div>
        )}

        {error && <div className="error">{error}</div>}

        {success && (
          <div className="success">
            ✅ 변환이 완료되었습니다!
            {downloadZip && " ZIP 파일이 다운로드되었습니다."}
          </div>
        )}

        <div className="download-option">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={downloadZip}
              onChange={(e) => setDownloadZip(e.target.checked)}
              className="checkbox-input"
            />
            <span> ZIP 파일 다운로드</span>
          </label>
        </div>

        <button
          onClick={handleConvert}
          disabled={!file || isConverting}
          className="convert-button"
        >
          {isConverting ? "변환 중..." : "변환하기"}
        </button>

        {editMode && editingSheet && (
          <div className="editor-section">
            <ExcelEditor
              initialData={editingSheet.data}
              onSave={handleSaveSheet}
              onCancel={handleCancelEdit}
            />
          </div>
        )}

        {jsonData && !editMode && (
          <div className="json-results">
            <h3>생성된 JSON 코드</h3>
            {Object.entries(jsonData).map(([prefix, langData]) => (
              <div key={prefix} className="json-section">
                <h4 className="json-section-title">{prefix}</h4>
                {Object.entries(langData).map(([lang, data]) => {
                  const jsonString = JSON.stringify(data, null, 2);
                  const copyKey = `${prefix}-${lang}`;
                  const isCopied = copiedKey === copyKey;
                  return (
                    <div key={lang} className="json-item">
                      <div className="json-header">
                        <span className="json-filename">{lang}.json</span>
                        <button
                          onClick={() => handleCopyCode(jsonString, copyKey)}
                          className="copy-button"
                        >
                          {isCopied ? "✅ 복사됨!" : "📋 복사"}
                        </button>
                      </div>
                      <pre className="json-code">
                        <code>{jsonString}</code>
                      </pre>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        <div className="info">
          <h3>사용 방법</h3>
          <ul>
            <li>
              "직접 편집하기" 버튼을 클릭하여 웹에서 바로 편집하거나, "템플릿
              Excel 다운로드" 버튼으로 템플릿을 다운로드하여 편집할 수 있습니다.
            </li>
            <li>
              Excel 파일에는 분류, 소분류, 키코드 컬럼과 언어별 컬럼(ko-KR,
              en-US, ja-JP, zh-Hans, zh-Hant)이 필요합니다.
            </li>
            <li>
              편집한 Excel 파일을 업로드하면 자동으로 JSON 파일로 변환됩니다.
            </li>
            <li>
              변환된 JSON 파일은 화면에서 확인하거나 ZIP 파일로 다운로드할 수
              있습니다.
            </li>
          </ul>
        </div>
      </div>

      <style jsx>{`
        .container {
          width: 100%;
          max-width: 900px;
        }

        .card {
          background: white;
          border-radius: 16px;
          padding: 40px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }

        h1 {
          font-size: 32px;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 12px;
          text-align: center;
        }

        .description {
          font-size: 16px;
          color: #666;
          text-align: center;
          margin-bottom: 32px;
        }

        .upload-area {
          margin-bottom: 24px;
        }

        .file-input {
          display: none;
        }

        .file-label {
          display: block;
          padding: 20px;
          border: 2px dashed #667eea;
          border-radius: 12px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
          background: #f8f9ff;
          color: #667eea;
          font-weight: 500;
        }

        .file-label:hover {
          background: #f0f2ff;
          border-color: #764ba2;
        }

        .file-info {
          background: #f8f9ff;
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 16px;
          font-size: 14px;
          color: #333;
        }

        .file-info p {
          margin: 4px 0;
        }

        .error {
          background: #fee;
          color: #c33;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 16px;
          font-size: 14px;
        }

        .success {
          background: #efe;
          color: #3c3;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 16px;
          font-size: 14px;
        }

        .convert-button {
          width: 100%;
          padding: 16px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
          margin-bottom: 24px;
        }

        .convert-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
        }

        .convert-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .template-button {
          width: 100%;
          padding: 14px;
          background: white;
          color: #667eea;
          border: 2px solid #667eea;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          margin-bottom: 24px;
        }

        .template-button:hover {
          background: #f8f9ff;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
        }

        .json-results {
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid #eee;
        }

        .json-results h3 {
          font-size: 20px;
          font-weight: 600;
          color: #333;
          margin-bottom: 20px;
        }

        .json-section {
          margin-bottom: 32px;
        }

        .json-section-title {
          font-size: 18px;
          font-weight: 600;
          color: #667eea;
          margin-bottom: 16px;
          padding-bottom: 8px;
          border-bottom: 2px solid #667eea;
        }

        .json-item {
          margin-bottom: 24px;
          background: #f8f9ff;
          border-radius: 8px;
          overflow: hidden;
        }

        .json-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: #667eea;
          color: white;
        }

        .json-filename {
          font-weight: 600;
          font-size: 14px;
        }

        .copy-button {
          padding: 6px 12px;
          background: white;
          color: #667eea;
          border: none;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .copy-button:hover {
          background: #f0f2ff;
          transform: translateY(-1px);
        }

        .json-code {
          margin: 0;
          padding: 16px;
          background: #1e1e1e;
          color: #d4d4d4;
          overflow-x: auto;
          font-size: 13px;
          line-height: 1.6;
          font-family: "Consolas", "Monaco", "Courier New", monospace;
        }

        .json-code code {
          display: block;
          white-space: pre;
        }

        .info {
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid #eee;
        }

        .info h3 {
          font-size: 18px;
          font-weight: 600;
          color: #333;
          margin-bottom: 12px;
        }

        .info ul {
          list-style: none;
          padding: 0;
        }

        .info li {
          padding: 8px 0;
          padding-left: 24px;
          position: relative;
          font-size: 14px;
          color: #666;
          line-height: 1.6;
        }

        .info li:before {
          content: "•";
          position: absolute;
          left: 8px;
          color: #667eea;
          font-weight: bold;
        }
      `}</style>
    </div>
  );
}
