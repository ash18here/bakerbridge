interface WhatsAppParams {
  phoneNumber: string; // Format: 919876543210
  bakerName: string;
  cakeTitle: string;
  price: number;
  weight: string;
  imageUrl: string;
}

export function generateWhatsAppOrderLink({
  phoneNumber,
  bakerName,
  cakeTitle,
  price,
  weight,
  imageUrl,
}: WhatsAppParams): string {
  const message = 
`Hi ${bakerName}! 👋
I found this cake on your online showcase and want to check availability:

🎂 *Design:* ${cakeTitle}
⚖️ *Starting Weight:* ${weight}
💰 *Est. Base Price:* ₹${price}
📸 *Reference Image:* ${imageUrl}

My Event Date: [                     ]
Delivery Area: [                     ]
Is this slot open?`;

  return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
}