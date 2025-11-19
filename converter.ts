import * as fs from "fs";
import * as path from "path";
import * as XLSX from "xlsx";

// Excel 파일 경로
const EXCEL_FILE = "target.xlsx";
const OUTPUT_DIR = "output";

// 언어 매핑 (컬럼 헤더명 -> 파일명)
const LANGUAGES = ["ko-KR", "en-US", "ja-JP", "zh-Hans", "zh-Hant"] as const;
type Language = (typeof LANGUAGES)[number];

// 시트 이름 매핑
const SHEETS = {
  app: "시스템언어_앱",
  kiosk: "시스템언어_키오스크",
} as const;

interface RowData {
  분류: string;
  소분류: string;
  키코드: string;
  [key: string]: string; // 언어별 컬럼
}

interface JsonStructure {
  [key: string]: {
    [key: string]: {
      [key: string]: string;
    };
  };
}

// 출력 디렉토리 생성
function ensureOutputDir() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
}

// 시트별 출력 디렉토리 생성
function ensureSheetOutputDir(prefix: string) {
  const sheetDir = path.join(OUTPUT_DIR, prefix);
  if (!fs.existsSync(sheetDir)) {
    fs.mkdirSync(sheetDir, { recursive: true });
  }
}

// Excel 파일 읽기
function readExcelFile(filePath: string): XLSX.WorkBook {
  const workbook = XLSX.readFile(filePath);
  return workbook;
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
    const 키코드 = String(row["키코드"] || "").trim();

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
        // Excel의 줄바꿈 문자(\n)를 그대로 유지
        // 이미 \n으로 저장되어 있을 수 있으므로 그대로 사용
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

// JSON 파일 저장
function saveJsonFile(filePath: string, data: JsonStructure) {
  const jsonString = JSON.stringify(data, null, 2);
  fs.writeFileSync(filePath, jsonString, "utf-8");
}

// 검증 함수
function validateJsonFiles(
  prefix: string,
  languages: readonly Language[],
  rowCount: number
): void {
  console.log(`\n[검증] ${prefix}`);
  console.log(`- 총 행 수: ${rowCount}`);

  languages.forEach((lang) => {
    const outputFile = path.join(OUTPUT_DIR, prefix, `${lang}.json`);

    if (!fs.existsSync(outputFile)) {
      console.log(`  ❌ ${lang}: 파일이 생성되지 않았습니다.`);
      return;
    }

    const content = fs.readFileSync(outputFile, "utf-8");
    const jsonData: JsonStructure = JSON.parse(content);

    // 1뎁스 키 개수
    const l1Keys = Object.keys(jsonData);
    // 2뎁스 키 개수
    const l2KeysCount = l1Keys.reduce(
      (sum, l1) => sum + Object.keys(jsonData[l1]).length,
      0
    );
    // 3뎁스 키 개수
    const l3KeysCount = l1Keys.reduce(
      (sum, l1) =>
        sum +
        Object.keys(jsonData[l1]).reduce(
          (s2, l2) => s2 + Object.keys(jsonData[l1][l2]).length,
          0
        ),
      0
    );

    console.log(`  ✓ ${lang}:`);
    console.log(`    - 1뎁스(분류): ${l1Keys.length}개`);
    console.log(`    - 2뎁스(소분류): ${l2KeysCount}개`);
    console.log(`    - 3뎁스(키코드): ${l3KeysCount}개`);

    // 각 언어별로 키 개수가 일관되는지 확인
    if (l3KeysCount !== rowCount) {
      console.log(
        `    ⚠️  경고: 키코드 개수(${l3KeysCount})가 행 수(${rowCount})와 다릅니다.`
      );
    }
  });
}

// 메인 함수
function main() {
  try {
    console.log("Excel 파일 읽기 시작...");
    const workbook = readExcelFile(EXCEL_FILE);

    ensureOutputDir();

    // 각 시트 처리
    Object.entries(SHEETS).forEach(([prefix, sheetName]) => {
      console.log(`\n처리 중: ${sheetName}`);

      const sheet = workbook.Sheets[sheetName];
      if (!sheet) {
        console.error(`시트를 찾을 수 없습니다: ${sheetName}`);
        return;
      }

      // 시트를 JSON 배열로 변환
      const sheetData: any[] = XLSX.utils.sheet_to_json(sheet);
      const rowCount = sheetData.length;
      console.log(`- 총 ${rowCount}개 행 발견`);

      // 사용 가능한 언어 컬럼 확인
      if (sheetData.length === 0) {
        console.error(`시트가 비어있습니다: ${sheetName}`);
        return;
      }

      const firstRow = sheetData[0];
      const availableLanguages = LANGUAGES.filter((lang) =>
        firstRow.hasOwnProperty(lang)
      );

      if (availableLanguages.length === 0) {
        console.error(`언어 컬럼을 찾을 수 없습니다: ${sheetName}`);
        return;
      }

      console.log(`- 발견된 언어: ${availableLanguages.join(", ")}`);

      // 시트별 출력 디렉토리 생성
      ensureSheetOutputDir(prefix);

      // JSON 구조로 변환
      const jsonMap = convertSheetToJson(sheetData, availableLanguages);

      // 각 언어별로 JSON 파일 저장
      availableLanguages.forEach((lang) => {
        const outputFileName = `${lang}.json`;
        const outputPath = path.join(OUTPUT_DIR, prefix, outputFileName);
        saveJsonFile(outputPath, jsonMap.get(lang)!);
        console.log(`  ✓ 생성: ${prefix}/${outputFileName}`);
      });

      // 검증
      validateJsonFiles(prefix, availableLanguages, rowCount);
    });

    console.log("\n✅ 모든 파일 생성 완료!");
    console.log(`📁 출력 폴더:`);
    console.log(`   - ${OUTPUT_DIR}/app/`);
    console.log(`   - ${OUTPUT_DIR}/kiosk/`);
  } catch (error) {
    console.error("오류 발생:", error);
    process.exit(1);
  }
}

// 실행
main();
