import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function GET() {
  try {
    // 새 워크북 생성
    const workbook = XLSX.utils.book_new();

    // 간단한 템플릿 데이터: 헤더 + 예시 데이터 1줄
    const sheetData = [
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

    // 시트 생성
    const sheet = XLSX.utils.aoa_to_sheet(sheetData);

    // 워크북에 시트 추가
    XLSX.utils.book_append_sheet(workbook, sheet, "Sheet1");

    // Excel 파일을 버퍼로 변환
    const excelBuffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    // 응답 반환
    return new Response(excelBuffer as any, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="i18n-template.xlsx"`,
      },
    });
  } catch (error: any) {
    console.error("템플릿 생성 오류:", error);
    return NextResponse.json(
      { error: error.message || "템플릿 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
