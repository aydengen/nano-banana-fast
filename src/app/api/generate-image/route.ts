// 提取年代
function extractDecate(prompt: string) {
  const match = prompt.match(/(\d{4}s)/);
  return match ? match[1] : null;
}

function getFallbackPrompt(decade: string): string {
  return `Create a photograph of the person in this image as if they were living in the ${decade}. The photograph should capture the distinct fashion, hairstyles, and overall atmosphere of that time period. Ensure the final image is a clear photograph that looks authentic to the era.`;
}

export async function POST(request: Request) {
  try {
    const { imageDataUrl, prompt } = await request.json();

    if (!process.env.API_KEY) {
      return new Response(
        JSON.stringify({ error: "Missing API_KEY env" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    if (!imageDataUrl || !prompt) {
      return new Response(
        JSON.stringify({ error: "Missing imageDataUrl or prompt" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    const match = imageDataUrl.match(/^data:image\/(\w+);base64,(.*)$/);
    if (!match) {
      return new Response(
        JSON.stringify({ error: '"Invalid image data URL format. Expected "data:image/...;base64,..."' }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // const [, mimeType, base64Data] = match;

    let resultUrl: string | null = null;
    let attempt = 0;
    const maxAttempts = 2;

    while (!resultUrl && attempt < maxAttempts) {
      try {
        const currentPrompt = attempt === 0 ? prompt : getFallbackPrompt(extractDecate(prompt) || "1950s");

        const res = await fetch(process.env.API_URL ? process.env.API_URL + "/chat/completions" : "https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: process.env.MODEL || "google/gemini-2.5-flash-image-preview:free", messages: [{
              role: "user", content: [
                { type: "text", text: currentPrompt },
                { type: "image_url", image_url: { url: imageDataUrl } },
              ]
            }]
          }),
        });
        const data = await res.json();
        // return new Response(JSON.stringify(data), { status: res.status, headers: { "Content-Type": "application/json" } });
        console.log(data);
        if (data) {
          resultUrl = data.choices?.[0]?.message?.images?.[0].type === 'image_url' ? data.choices?.[0]?.message?.images?.[0].image_url?.url : null;
        }
      } catch (error) {
        console.error(`Error on attempt ${attempt + 1}:`, error);
      }
      attempt++;
    }

    if (!resultUrl) {
      return new Response(
        JSON.stringify({ error: "Failed to generate image" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
    return new Response(JSON.stringify({ imageUrl: resultUrl }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (error) {
    console.error('Error generating image:', error);

    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';

    // Check for specific error types
    if (errorMessage.includes('API key')) {
      return new Response(
        JSON.stringify({ error: 'API configuration error. Please check your API key.' }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    if (errorMessage.includes('rate limit')) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: `Failed to generate image: ${errorMessage}` }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}


