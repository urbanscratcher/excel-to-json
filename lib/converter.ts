import * as XLSX from "xlsx";

// 언어 매핑 (컬럼 헤더명 -> 파일명)
const LANGUAGES = ["ko-KR", "en-US", "ja-JP", "zh-Hans", "zh-Hant"] as const;
export type Language = (typeof LANGUAGES)[number];

// 시트 이름을 안전한 폴더명으로 변환
function sanitizeSheetName(sheetName: string): string {
  // 특수문자를 언더스코어로 변환하고, 연속된 언더스코어를 하나로 통합
  return sheetName
    .replace(/[^a-zA-Z0-9가-힣_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

export interface JsonStructure {
  [key: string]: {
    [key: string]: {
      [key: string]: string;
    };
  };
}

export interface ConversionResult {
  [prefix: string]: {
    [lang: string]: JsonStructure;
  };
}

export interface ValidationResult {
  prefix: string;
  rowCount: number;
  languages: Language[];
  stats: {
    [lang: string]: {
      l1Count: number;
      l2Count: number;
      l3Count: number;
    };
  };
}

// 시트 데이터를 JSON 구조로 변환
function convertSheetToJson(
  sheetData: any[],
  languages: readonly Language[]
): Map<Language, JsonStructure> {
  const resultMap = new Map<Language, JsonStructure>();

  // 각 언어별로 초기화
  languages.forEach((lang) => {
    resultMap.set(lang, {});
  });

  // 각 행 처리
  sheetData.forEach((row: any) => {
    const 분류 = String(row["분류"] || "").trim();
    const 소분류 = String(row["소분류"] || "").trim();
    let 키코드 = String(row["키코드"] || "").trim();

    // 키코드의 콜론(:)을 언더바(_)로 변환
    키코드 = 키코드.replace(/:/g, "_");

    // 빈 키는 스킵
    if (!분류 || !소분류 || !키코드) {
      return;
    }

    // 각 언어별로 값 설정
    languages.forEach((lang) => {
      let value = row[lang];

      // 값이 없거나 NaN인 경우 빈 문자열
      if (value === undefined || value === null || value === "") {
        value = "";
      } else {
        // 문자열로 변환 (줄바꿈은 자동으로 유지됨)
        value = String(value);
      }

      // 중첩 구조 생성
      const langResult = resultMap.get(lang)!;
      if (!langResult[분류]) {
        langResult[분류] = {};
      }
      if (!langResult[분류][소분류]) {
        langResult[분류][소분류] = {};
      }
      langResult[분류][소분류][키코드] = value;
    });
  });

  return resultMap;
}

// Excel 파일 버퍼를 읽어서 JSON으로 변환
export function convertExcelToJson(fileBuffer: Buffer): {
  result: ConversionResult;
  validation: ValidationResult[];
} {
  const workbook = XLSX.read(fileBuffer, { type: "buffer" });
  const result: ConversionResult = {};
  const validation: ValidationResult[] = [];

  // 모든 시트 이름 가져오기
  const sheetNames = workbook.SheetNames;

  // 각 시트 처리
  sheetNames.forEach((sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) {
      return;
    }

    // 시트를 JSON 배열로 변환
    const sheetData: any[] = XLSX.utils.sheet_to_json(sheet);
    const rowCount = sheetData.length;

    if (sheetData.length === 0) {
      return;
    }

    // 필수 컬럼 확인 (분류, 소분류, 키코드)
    const firstRow = sheetData[0];
    if (
      !firstRow.hasOwnProperty("분류") ||
      !firstRow.hasOwnProperty("소분류") ||
      !firstRow.hasOwnProperty("키코드")
    ) {
      // 필수 컬럼이 없으면 스킵
      return;
    }

    const availableLanguages = LANGUAGES.filter((lang) =>
      firstRow.hasOwnProperty(lang)
    );

    if (availableLanguages.length === 0) {
      // 언어 컬럼이 없으면 스킵
      return;
    }

    // 시트 이름을 안전한 폴더명으로 변환
    const folderName = sanitizeSheetName(sheetName);

    // JSON 구조로 변환
    const jsonMap = convertSheetToJson(sheetData, availableLanguages);

    // 결과 저장
    result[folderName] = {};
    availableLanguages.forEach((lang) => {
      result[folderName][lang] = jsonMap.get(lang)!;
    });

    // 검증 정보 수집
    const stats: ValidationResult["stats"] = {};
    availableLanguages.forEach((lang) => {
      const jsonData = result[folderName][lang];
      const l1Keys = Object.keys(jsonData);
      const l2KeysCount = l1Keys.reduce(
        (sum, l1) => sum + Object.keys(jsonData[l1]).length,
        0
      );
      const l3KeysCount = l1Keys.reduce(
        (sum, l1) =>
          sum +
          Object.keys(jsonData[l1]).reduce(
            (s2, l2) => s2 + Object.keys(jsonData[l1][l2]).length,
            0
          ),
        0
      );

      stats[lang] = {
        l1Count: l1Keys.length,
        l2Count: l2KeysCount,
        l3Count: l3KeysCount,
      };
    });

    validation.push({
      prefix: folderName,
      rowCount,
      languages: availableLanguages,
      stats,
    });
  });

  return { result, validation };
}
