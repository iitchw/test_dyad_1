// Define a minimal Deno global for TypeScript to prevent compile errors.
// The actual Deno runtime provides the full implementation.
declare global {
  const Deno: {
    env: {
      get(key: string): string | undefined;
    };
  };
}

// @ts-ignore: Deno-specific import
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function getEmailContent(status: string, fullName: string, score: number) {
  if (status === 'approved') {
    return {
      subject: `Chúc mừng: Bài kiểm tra của bạn đã được phê duyệt`,
      body: `
        <h1>Kết quả bài kiểm tra đã được phê duyệt</h1>
        <p>Chào ${fullName},</p>
        <p>Chúng tôi vui mừng thông báo rằng bài kiểm tra của bạn đã được xem xét và <strong>phê duyệt</strong>.</p>
        <p><strong>Điểm số cuối cùng của bạn là: ${score.toFixed(1)} / 10</strong></p>
        <p>Cảm ơn bạn đã tham gia.</p>
      `
    };
  } else if (status === 'redo_required') {
    return {
      subject: `Thông báo: Yêu cầu làm lại bài kiểm tra`,
      body: `
        <h1>Yêu cầu làm lại bài kiểm tra</h1>
        <p>Chào ${fullName},</p>
        <p>Sau khi xem xét, bài kiểm tra của bạn có một số điểm chưa đạt và bạn được <strong>yêu cầu làm lại</strong>.</p>
        <p>Vui lòng truy cập lại hệ thống để thực hiện lại bài kiểm tra.</p>
        <p>Cảm ơn bạn.</p>
      `
    };
  } else {
     return {
      subject: `Thông báo kết quả bài kiểm tra`,
      body: `
        <h1>Thông báo kết quả bài kiểm tra</h1>
        <p>Chào ${fullName},</p>
        <p>Bài kiểm tra của bạn đã được xem xét. Trạng thái hiện tại là: ${status}.</p>
        <p><strong>Điểm số của bạn là: ${score.toFixed(1)} / 10</strong></p>
        <p>Vui lòng liên hệ quản trị viên để biết thêm chi tiết.</p>
      `
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { recipientEmail, fullName, score, status } = await req.json()
    const resendApiKey = Deno.env.get('RESEND_API_KEY')

    if (!resendApiKey) {
      console.error("RESEND_API_KEY is not set.");
      return new Response(JSON.stringify({ message: "Email configuration missing on server." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }
    
    if (!recipientEmail) {
      return new Response(JSON.stringify({ error: "Recipient email is required." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    const { subject, body } = getEmailContent(status, fullName, score);

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: 'Hệ thống Trắc nghiệm <onboarding@resend.dev>',
        to: recipientEmail,
        subject: subject,
        html: body,
      }),
    });

    if (!res.ok) {
      const errorBody = await res.text();
      console.error("Failed to send email:", res.status, errorBody);
      throw new Error("Failed to send email");
    }

    return new Response(JSON.stringify({ message: "Email sent successfully" }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})