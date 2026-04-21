import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import play from 'play-dl';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // YouTube Stream Proxy using Concurrent Promise Racing
  app.get("/api/youtube-stream", async (req, res) => {
    const videoId = req.query.videoId as string;
    if (!videoId) return res.status(400).json({ error: "Missing videoId" });

    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

    // Helper to fetch with strict timeout
    const fetchApi = async (url: string, options: any, type: 'cobalt' | 'invidious' | 'piped') => {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 4500); // 4.5s strict timeout
      try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(id);
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        
        let streamUrl = null;
        if (type === 'cobalt' && data.url) {
          streamUrl = data.url;
        } else if (type === 'invidious' && data.formatStreams) {
          const audioStream = data.formatStreams.find((s: any) => s.resolution === 'Audio only' || typeof s.bitrate === 'number') || data.adaptiveFormats?.find((s: any) => s.type?.includes('audio'));
          if (audioStream && audioStream.url) streamUrl = audioStream.url;
        } else if (type === 'piped' && data.audioStreams) {
          const audioStream = data.audioStreams.find((s: any) => s.bitrate > 0) || data.audioStreams[0];
          if (audioStream && audioStream.url) streamUrl = audioStream.url;
        }

        if (streamUrl) return streamUrl;
        throw new Error('No audio stream extracted');
      } catch (err) {
        clearTimeout(id);
        throw err;
      }
    };

    // Store all racing promises
    const tasks: Promise<string>[] = [];

    // 1. Cobalt Instances
    const cobaltInstances = ['https://api.cobalt.tools/api/json', 'https://cobalt-api.peppe8o.com/api/json', 'https://api.cobalt.bkc.icu/api/json'];
    for (const url of cobaltInstances) {
      tasks.push(fetchApi(url, {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        body: JSON.stringify({ url: videoUrl, isAudioOnly: true })
      }, 'cobalt'));
    }

    // 2. Invidious Instances
    const invidiousInstances = ['vid.puffyan.us', 'inv.nadeko.net', 'invidious.nerdvpn.de', 'inv.tux.pizza'];
    for (const domain of invidiousInstances) {
      tasks.push(fetchApi(`https://${domain}/api/v1/videos/${videoId}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      }, 'invidious'));
    }

    // 3. Piped Instances
    const pipedInstances = ['pipedapi.kavin.rocks', 'pipedapi.colby.solutions', 'api.piped.video'];
    for (const domain of pipedInstances) {
      tasks.push(fetchApi(`https://${domain}/streams/${videoId}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      }, 'piped'));
    }

    // 4. play-dl Native
    tasks.push(new Promise(async (resolve, reject) => {
      try {
        const stream = await play.stream(videoUrl, { discordPlayerCompatibility: true });
        if (stream && (stream as any).url) resolve((stream as any).url);
        else reject(new Error('play-dl no suitable format'));
      } catch (err) {
        reject(err);
      }
    }));

    try {
      // Race! The first instance to successfully resolve a URL wins.
      const winningUrl = await Promise.any(tasks);
      return res.json({ url: winningUrl });
    } catch (aggregateError) {
      // If ALL tasks fail or timeout, silently return an error code so the frontend fallback triggers cleanly
      return res.status(500).json({ error: "Native extraction and fallbacks failed on backend" });
    }
  });


  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
