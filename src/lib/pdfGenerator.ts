import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { showLoading, dismissToast, showError, showSuccess } from "@/utils/toast";

export const generatePdfFromElement = async (element: HTMLElement, fileName: string) => {
  if (!element) {
    showError("Không thể tìm thấy nội dung để tạo PDF.");
    return;
  }

  const loadingToast = showLoading("Đang tạo file PDF...");

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      // Các tùy chọn này giúp html2canvas chụp lại toàn bộ nội dung có thể cuộn
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    const ratio = canvasWidth / canvasHeight;
    const imgHeightOnPdf = pdfWidth / ratio;

    let heightLeft = imgHeightOnPdf;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeightOnPdf);
    heightLeft -= pdfHeight;

    while (heightLeft > 0) {
      position = -heightLeft;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeightOnPdf);
      heightLeft -= pdfHeight;
    }

    pdf.save(`${fileName}.pdf`);
    
    dismissToast(loadingToast);
    showSuccess("Đã tạo file PDF thành công!");

  } catch (err) {
    dismissToast(loadingToast);
    showError("Đã xảy ra lỗi khi tạo PDF.");
    console.error("Lỗi tạo PDF:", err);
  }
};