"use client";

import ky from "ky";
import { useState } from "react";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setSuccess(false);
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

  const handleConvert = async () => {
    if (!file) {
      setError("파일을 선택해주세요.");
      return;
    }

    setIsConverting(true);
    setError(null);
    setSuccess(false);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await ky
        .post("/api/convert", {
          body: formData,
        })
        .blob();

      // ZIP 파일 다운로드
      const url = window.URL.createObjectURL(response);
      const a = document.createElement("a");
      a.href = url;
      a.download = "i18n-json-files.zip";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

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

  return (
    <div className="container">
      <div className="card">
        <h1>Excel to JSON Converter</h1>
        <p className="description">
          Excel 파일을 업로드하면 i18n용 JSON 파일로 변환됩니다.
        </p>

        <button onClick={handleDownloadTemplate} className="template-button">
          📥 템플릿 Excel 다운로드
        </button>

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
            ✅ 변환이 완료되었습니다! ZIP 파일이 다운로드되었습니다.
          </div>
        )}

        <button
          onClick={handleConvert}
          disabled={!file || isConverting}
          className="convert-button"
        >
          {isConverting ? "변환 중..." : "변환하기"}
        </button>

        <div className="info">
          <h3>사용 방법</h3>
          <ul>
            <li>
              먼저 "템플릿 Excel 다운로드" 버튼을 클릭하여 템플릿 파일을
              다운로드하세요.
            </li>
            <li>템플릿 파일을 열어 번역 내용을 입력한 후 저장하세요.</li>
            <li>
              저장한 Excel 파일을 업로드하면 자동으로 JSON 파일로 변환됩니다.
            </li>
            <li>
              Excel 파일의 모든 시트가 자동으로 감지되어 처리됩니다. 각 시트에는
              분류, 소분류, 키코드 컬럼과 언어별 컬럼(ko-KR, en-US, ja-JP,
              zh-Hans, zh-Hant)이 필요합니다.
            </li>
            <li>
              시트 이름이 폴더명으로 사용되며, 각 시트별로 언어별 JSON 파일이
              생성됩니다.
            </li>
            <li>변환된 JSON 파일은 ZIP 파일로 다운로드됩니다.</li>
          </ul>
        </div>
      </div>

      <style jsx>{`
        .container {
          width: 100%;
          max-width: 600px;
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
