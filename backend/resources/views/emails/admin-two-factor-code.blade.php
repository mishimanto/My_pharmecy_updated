<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Admin Verification Code</title>
</head>
<body style="margin:0;background:#f1f5f9;color:#0f172a;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f1f5f9;margin:0;padding:32px 12px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #dbe3ec;">
                    <tr>
                        <td style="background:#0f766e;padding:24px 28px;color:#ffffff;">
                            <h1 style="text-align:center;font-size:24px;line-height:1.25;font-weight:700;">Verification code</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:28px;">
                            <p style="margin:0 0 14px;font-size:15px;line-height:1.7;color:#334155;">Hello <strong>{{ $recipientName }}</strong>,</p>
                            <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#334155;">Use the code below to complete your admin login. Keep it private and do not share it with anyone.</p>

                            <div style="margin:24px 0;padding:20px;background:#ecfdf5;border:1px solid #a7f3d0;text-align:center;">
                                <div style="font-size:34px;line-height:1;font-weight:800;letter-spacing:0.18em;color:#065f46;">{{ $code }}</div>
                            </div>

                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 22px;background:#f8fafc;border:1px solid #e2e8f0;">
                                <tr>
                                    <td style="padding:14px 16px;font-size:13px;line-height:1.6;color:#475569;">
                                        <b>Note:</b> This code expires in <strong style="color:#0f172a;">{{ $expiresIn }}</strong>. If you did not try to sign in, change your password and review active sessions from the admin security page.
                                    </td>
                                </tr>
                            </table>                            
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
