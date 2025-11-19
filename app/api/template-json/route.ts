import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function GET() {
  try {
    // 새 워크북 생성
    const workbook = XLSX.utils.book_new();

    // 예시 시트 데이터 생성 (시스템언어_앱)
    const appSheetData = [
      {
        분류: "공통",
        소분류: "공통",
        키코드: "확인",
        "ko-KR": "확인",
        "en-US": "Confirm",
        "ja-JP": "確認",
        "zh-Hans": "确认",
        "zh-Hant": "確認",
      },
      {
        분류: "공통",
        소분류: "공통",
        키코드: "다음",
        "ko-KR": "다음",
        "en-US": "Next",
        "ja-JP": "次へ",
        "zh-Hans": "下一步",
        "zh-Hant": "下一步",
      },
      {
        분류: "공통",
        소분류: "공통",
        키코드: "닫기",
        "ko-KR": "닫기",
        "en-US": "Close",
        "ja-JP": "閉じる",
        "zh-Hans": "关闭",
        "zh-Hant": "關閉",
      },
      {
        분류: "공통",
        소분류: "공통",
        키코드: "완료",
        "ko-KR": "완료",
        "en-US": "Complete",
        "ja-JP": "完了",
        "zh-Hans": "完成",
        "zh-Hant": "完成",
      },
      {
        분류: "공통",
        소분류: "공통",
        키코드: "줄바꿈_예시",
        "ko-KR": "첫 번째 줄\n두 번째 줄",
        "en-US": "First line\nSecond line",
        "ja-JP": "最初の行\n2行目",
        "zh-Hans": "第一行\n第二行",
        "zh-Hant": "第一行\n第二行",
      },
    ];

    // 예시 시트 데이터 생성 (시스템언어_키오스크)
    const kioskSheetData = [
      {
        분류: "주문",
        소분류: "결제",
        키코드: "결제하기",
        "ko-KR": "결제하기",
        "en-US": "Pay",
        "ja-JP": "支払う",
        "zh-Hans": "支付",
        "zh-Hant": "支付",
      },
      {
        분류: "주문",
        소분류: "결제",
        키코드: "결제완료",
        "ko-KR": "결제가 완료되었습니다.",
        "en-US": "Payment completed.",
        "ja-JP": "支払いが完了しました。",
        "zh-Hans": "支付已完成。",
        "zh-Hant": "支付已完成。",
      },
    ];

    // 시트 생성
    const appSheet = XLSX.utils.json_to_sheet(appSheetData);
    const kioskSheet = XLSX.utils.json_to_sheet(kioskSheetData);

    // 워크북에 시트 추가
    XLSX.utils.book_append_sheet(workbook, appSheet, "시스템언어_앱");
    XLSX.utils.book_append_sheet(workbook, kioskSheet, "시스템언어_키오스크");

    // 각 시트를 배열 형태로 변환
    const result: { [sheetName: string]: any[][] } = {};

    workbook.SheetNames.forEach((sheetName) => {
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      result[sheetName] = jsonData as any[][];
    });

    return NextResponse.json({
      success: true,
      data: result,
      sheetNames: workbook.SheetNames,
    });
  } catch (error: any) {
    console.error("템플릿 생성 오류:", error);
    return NextResponse.json(
      { error: error.message || "템플릿 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
