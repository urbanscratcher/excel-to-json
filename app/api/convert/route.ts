import { NextRequest, NextResponse } from "next/server";
import { convertExcelToJson } from "@/lib/converter";
import JSZip from "jszip";

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

    // ZIP 파일 생성
    const zip = new JSZip();

    Object.entries(result).forEach(([prefix, langData]) => {
      Object.entries(langData).forEach(([lang, jsonData]) => {
        const jsonString = JSON.stringify(jsonData, null, 2);
        zip.file(`${prefix}/${lang}.json`, jsonString);
      });
    });

    // ZIP 파일을 버퍼로 변환
    const zipBuffer = await zip.generateAsync({ type: "uint8array" });

    // 응답 반환
    return new Response(zipBuffer as any, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="i18n-json-files.zip"`,
      },
    });
  } catch (error: any) {
    console.error("변환 오류:", error);
    return NextResponse.json(
      { error: error.message || "파일 변환 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

