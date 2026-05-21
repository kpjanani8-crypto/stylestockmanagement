export const invoiceCss = `
  *{box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
  body{margin:0;padding:48px;color:#1a1a1a;background:#fff}
  .head{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #d4af37;padding-bottom:24px;margin-bottom:32px}
  h1{margin:0;font-size:32px;letter-spacing:-0.5px}
  .brand{color:#d4af37;font-weight:700;font-size:14px;letter-spacing:2px;text-transform:uppercase}
  .muted{color:#666;font-size:13px}
  table{width:100%;border-collapse:collapse;margin:24px 0}
  th,td{padding:14px;text-align:left;border-bottom:1px solid #eee}
  th{background:#fafafa;font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#666}
  td.r,th.r{text-align:right}
  .totals{margin-left:auto;width:280px;font-size:14px}
  .totals .row{display:flex;justify-content:space-between;padding:8px 0}
  .totals .grand{border-top:2px solid #1a1a1a;margin-top:8px;padding-top:14px;font-size:18px;font-weight:700}
  .gold{color:#d4af37}
  .foot{margin-top:48px;text-align:center;color:#999;font-size:12px}
  @media print{body{padding:24px}.noprint{display:none}}
`;
