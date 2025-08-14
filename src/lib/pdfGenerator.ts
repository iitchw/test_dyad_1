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
    // html2canvas captures the HTML element as an image.
    // Text within this image will not be selectable or searchable in the PDF.
    // Font embedding in jspdf primarily affects text drawn directly by jspdf, not text within images.
    const canvas = await html2canvas(element, {
      scale: 2, // Increase scale for better resolution
      useCORS: true,
      backgroundColor: '#ffffff',
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

    // Add the first part of the image
    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeightOnPdf);
    heightLeft -= pdfHeight;

    // Add new pages and continue drawing the image if it's taller than one page
    // The 'position' parameter shifts the image vertically to show the next segment
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