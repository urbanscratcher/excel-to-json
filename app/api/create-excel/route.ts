import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sheets } = body;

    if (!sheets || typeof sheets !== "object") {
      return NextResponse.json(
        { error: "시트 데이터가 필요합니다." },
        { status: 400 }
      );
    }

    // 새 워크북 생성
    const workbook = XLSX.utils.book_new();

    // 각 시트를 워크북에 추가
    Object.entries(sheets).forEach(([sheetName, data]: [string, any]) => {
      const sheet = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, sheet, sheetName);
    });

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
    console.error("Excel 생성 오류:", error);
    return NextResponse.json(
      { error: error.message || "Excel 파일 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
