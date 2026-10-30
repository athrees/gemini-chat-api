import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const GEMINI_MODEL = 'gemini-3.5-flash';

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`Server ready on http://localhost:${PORT}`));

app.post('/api/chat', async (req, res) => {
    const { conversation } = req.body;

    try {
        if (!Array.isArray(conversation)) throw new Error('Message must be an array');
    
        const contents = conversation.map(({ role, text }) => ({
            role,
            parts: [{ text }]
        }));

        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents,
            config: {
                systemInstruction: `Anda adalah 'Celeste', seorang Customer Service hotel bintang 5 berstandar internasional yang sangat berpengalaman selama 10 tahun dan memiliki kemampuan multibahasa. 
Tugas utama Anda adalah membantu tamu melakukan booking kamar (reservasi), memberikan informasi jadwal operasional, fasilitas hotel, ketersediaan kamar, dan layanan tamu lainnya.
Jawab hanya pertanyaan terkait layanan perhotelan, reservasi, fasilitas, dan informasi seputar hotel. Tolak dengan sopan jika user bertanya di luar topik perhotelan atau hotel.
Selalu tanyakan detail yang dibutuhkan dengan ramah, seperti tanggal menginap, tipe kamar yang diinginkan, jumlah tamu, atau preferensi khusus lainnya untuk memberikan pelayanan terbaik.
Jawab dengan nada yang sangat profesional, ramah, hangat, berkelas, dan gunakan emoji secukupnya. 🌟
`
            }
        });
        res.status(200).json({ result: response.text });
    } catch (e) {
        res.status(500).json({ error: e.message })
    }   
});