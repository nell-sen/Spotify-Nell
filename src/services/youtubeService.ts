export interface YouTubePlaylistItem {
  title: string;
  artist: string;
  thumbnail: string;
  videoId: string;
}

export async function fetchYouTubePlaylist(apiKey: string, playlistUrl: string): Promise<YouTubePlaylistItem[]> {
  if (!apiKey) throw new Error('YouTube API Key is required');
  
  const playlistIdMatch = playlistUrl.match(/[&?]list=([^&]+)/);
  const playlistId = playlistIdMatch ? playlistIdMatch[1] : playlistUrl;

  if (!playlistId || playlistId.length < 5) {
    throw new Error('Invalid YouTube Playlist URL or ID');
  }

  const allItems: YouTubePlaylistItem[] = [];
  let nextPageToken = '';

  try {
    do {
      const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=50&key=${apiKey}${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to fetch playlist');
      }

      const data = await response.json();
      nextPageToken = data.nextPageToken || '';

      const batch = data.items.map((item: any) => {
        const title = item.snippet.title;
        let artist = 'Unknown Artist';
        let songTitle = title;
        
        // Improved parsing for common title formats
        if (title.includes(' - ')) {
          [artist, songTitle] = title.split(' - ').map((s: string) => s.trim());
        } else if (title.includes(' : ')) {
          [artist, songTitle] = title.split(' : ').map((s: string) => s.trim());
        } else if (item.snippet.videoOwnerChannelTitle) {
          artist = item.snippet.videoOwnerChannelTitle.replace(' - Topic', '').trim();
        }

        return {
          title: songTitle,
          artist: artist,
          thumbnail: item.snippet.thumbnails?.maxres?.url || item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url,
          videoId: item.snippet.resourceId.videoId
        };
      });

      allItems.push(...batch);
      
      // Safety limit to avoid infinite loops or excessive API usage
      if (allItems.length > 500) break;

    } while (nextPageToken);

    return allItems;
  } catch (error: any) {
    console.error('YouTube API Error:', error);
    throw new Error(`YouTube API: ${error.message}`);
  }
}
