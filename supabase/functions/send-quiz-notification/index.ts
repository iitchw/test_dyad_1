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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { fullName, score, dob, phone, gender } = await req.json()
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    const adminEmail = Deno.env.get('ADMIN_EMAIL_RECIPIENT')

    if (!resendApiKey || !adminEmail) {
      let errorMessage = "";
      if (!resendApiKey) errorMessage += "RESEND_API_KEY is not set. ";
      if (!adminEmail) errorMessage += "ADMIN_EMAIL_RECIPIENT is not set. ";
      console.error(errorMessage.trim());
      // Return a success response to the client to avoid breaking the user flow.
      return new Response(JSON.stringify({ message: "Email configuration missing on server." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
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

    // IMPORTANT: 'onboarding@resend.dev' is for development only.
    // For production, you must verify your own domain with Resend.
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: 'Hệ thống Trắc nghiệm <onboarding@resend.dev>',
        to: adminEmail,
        subject: `Bài kiểm tra mới từ ${fullName}`,
        html: emailHtml,
      }),
    });

    if (!res.ok) {
      const errorBody = await res.text();
      console.error("Failed to send email:", res.status, errorBody);
    }

    return new Response(JSON.stringify({ message: "Email notification request processed" }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error("Internal server error:", error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})