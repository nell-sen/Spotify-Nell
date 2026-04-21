export async function getDirectAudioStream(videoId: string): Promise<string> {
  try {
    const response = await fetch(`/api/youtube-stream?videoId=${videoId}`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch stream from backend');
    }
    const data = await response.json();
    if (data.url) return data.url;
    throw new Error('No stream URL returned from backend');
  } catch (e: any) {
    throw new Error(e.message || 'Gagal mengekstrak aliran audio.');
  }
}

export function isYouTubeUrl(url: string): boolean {
  return !!url && (url.includes('youtube.com') || url.includes('youtu.be'));
}

export function extractVideoId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
  return match ? match[1] : null;
}
