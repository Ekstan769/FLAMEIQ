*Format* 

await fetch('https://sendlib.samueltuoyo.com/api/send', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    from: 'mysecondgmail@gmail.com',
    to: 'user@example.com',
    subject: 'Hello via Fetch!',
    html: '<p>No SMTP configuration needed!</p>',
    replyTo: 'support@yourdomain.com',
    attachments: [
      { filename: 'invoice.pdf', content: 'JVBERi0xLjQKJ...' }
    ]
  })
});