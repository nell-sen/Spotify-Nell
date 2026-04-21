import play from 'play-dl';

async function test() {
  try {
    const stream = await play.stream('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    console.log((stream as any).url);
  } catch (e: any) {
    console.error('Error:', e.message);
  }
}

test();
