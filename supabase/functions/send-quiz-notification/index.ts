// Define a minimal Deno global for TypeScript to prevent compile errors.
// The actual Deno runtime provides the full implementation.
declare global {
  const Deno: {
    env: {
      get(key: string): string | undefined;
    };
  };
}

// @ts-ignore: The local TypeScript server can't resolve Deno's URL imports, but this is valid in the Deno runtime.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// !!! THAY ĐỔI: Vui lòng thay thế bằng địa chỉ email quản trị của bạn
const ADMIN_EMAIL = "your-admin-email@example.com";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { fullName, score, dob, phone, gender } = await req.json()
    const resendApiKey = Deno.env.get('RESEND_API_KEY')

    if (!resendApiKey) {
      console.error("RESEND_API_KEY is not set in environment variables.")
      // Không trả về lỗi cho client để không chặn luồng nộp bài
      return new Response(JSON.stringify({ message: "Email configuration missing on server." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200, // Trả về thành công để không báo lỗi cho người dùng
      })
    }

    const emailHtml = `
      <h1>Có bài kiểm tra mới</h1>
      <p>Một bài kiểm tra vừa được hoàn thành với các thông tin sau:</p>
      <ul>
        <li><strong>Họ và tên:</strong> ${fullName}</li>
        <li><strong>Ngày sinh:</strong> ${dob}</li>
        <li><strong>Số điện thoại:</strong> ${phone}</li>
        <li><strong>Giới tính:</strong> ${gender}</li>
        <li><strong>Điểm số:</strong> ${score.toFixed(1)} / 10</li>
      </ul>
      <p>Bạn có thể xem lại bài làm chi tiết trong trang quản trị.</p>
    `;

    // Lưu ý: 'onboarding@resend.dev' chỉ dành cho mục đích phát triển.
    // Để sử dụng trong môi trường production, bạn cần xác thực tên miền của mình với Resend.
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: 'Quiz System <onboarding@resend.dev>',
        to: ADMIN_EMAIL,
        subject: `Bài kiểm tra mới từ ${fullName}`,
        html: emailHtml,
      }),
    });

    if (!res.ok) {
      const errorBody = await res.text();
      console.error("Gửi email thất bại:", errorBody);
      // Không trả về lỗi để tránh làm gián đoạn người dùng
    }

    return new Response(JSON.stringify({ message: "Yêu cầu gửi email đã được xử lý" }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error(error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})