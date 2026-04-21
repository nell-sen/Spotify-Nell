import { GoogleGenAI, Type } from "@google/genai";
import { LyricLine } from "../store/useMusicStore";

export async function syncLyricsWithAI(
  apiKey: string,
  title: string,
  artist: string,
  rawLyrics: string
): Promise<LyricLine[]> {
  if (!apiKey) throw new Error("API Key Gemini tidak ditemukan. Harap atur di panel Admin.");

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `
    Anda adalah asisten musik profesional. 
    Berikan sinkronisasi lirik waktu (timestamps) dalam format JSON untuk lagu berikut:
    Judul: ${title}
    Artis: ${artist}
    Lirik:
    ${rawLyrics}

    ATURAN:
    1. Estimasi waktu mulai (dalam detik) untuk setiap baris berdasarkan struktur lagu umum.
    2. Output HARUS berupa array JSON objek dengan properti "time" (angka detik) dan "text" (string lirik).
    3. Pastikan waktu berurutan dan masuk akal (misalnya baris pertama sekitar 0-5 detik, dst).
    4. Jangan berikan teks penjelasan, HANYA JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              time: { type: Type.NUMBER, description: "Awal baris dalam detik" },
              text: { type: Type.STRING, description: "Teks lirik baris tersebut" }
            },
            required: ["time", "text"]
          }
        }
      }
    });

    const result = JSON.parse(response.text || "[]");
    return result as LyricLine[];
  } catch (error) {
    console.error("Gemini Sync Error:", error);
    throw new Error("Gagal menyinkronkan lirik dengan AI. Periksa koneksi atau API Key Anda.");
  }
}

export async function generateLyricsFromAITitle(
  apiKey: string,
  title: string,
  artist: string
): Promise<LyricLine[]> {
  if (!apiKey) throw new Error("API Key Gemini tidak ditemukan. Harap atur di panel Admin.");

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `
    Anda adalah ensiklopedia musik profesional. 
    Berikan lirik lengkap dan sinkronisasi waktu (timestamps) dalam format JSON untuk lagu berikut:
    Judul: ${title}
    Artis: ${artist}

    ATURAN:
    1. Cari atau buat lirik yang akurat untuk lagu ini.
    2. Estimasi waktu mulai (dalam detik) untuk setiap baris.
    3. Output HARUS berupa array JSON objek dengan properti "time" (angka detik) dan "text" (string lirik).
    4. Pastikan waktu berurutan dan sinkron dengan lagu aslinya sebisa mungkin.
    5. Jika lagu tidak memiliki lirik (instrumental), kembalikan array kosong.
    6. Jangan berikan teks penjelasan, HANYA JSON array.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              time: { type: Type.NUMBER },
              text: { type: Type.STRING }
            },
            required: ["time", "text"]
          }
        }
      }
    });

    const result = JSON.parse(response.text || "[]");
    return result as LyricLine[];
  } catch (error) {
    console.error("Gemini Generate Error:", error);
    throw new Error("Gagal menghasilkan lirik AI. Periksa koneksi atau API Key Anda.");
  }
}
