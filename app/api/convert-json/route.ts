import { convertExcelToJson } from "@/lib/converter";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "파일이 업로드되지 않았습니다." },
        { status: 400 }
      );
    }

    // Excel 파일인지 확인
    if (
      !file.name.endsWith(".xlsx") &&
      !file.name.endsWith(".xls") &&
      file.type !==
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ) {
      return NextResponse.json(
        { error: "Excel 파일(.xlsx, .xls)만 업로드 가능합니다." },
        { status: 400 }
      );
    }

    // 파일을 버퍼로 변환
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Excel을 JSON으로 변환
    const { result, validation } = convertExcelToJson(buffer);

    // JSON 데이터 반환
    return NextResponse.json({
      success: true,
      data: result,
      validation,
    });
  } catch (error: any) {
    console.error("변환 오류:", error);
    return NextResponse.json(
      { error: error.message || "파일 변환 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
