import { GoogleGenAI, Modality } from "@google/genai";

// Helper to decode Base64 to ArrayBuffer
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

export const generateImage = async (prompt: string, aspectRatio: string = "1:1") => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio,
          // imageSize is not supported in flash-image, only pro-image
        },
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image generated.");
  } catch (error) {
    console.error("Image gen error:", error);
    throw error;
  }
};

export const generateText = async (prompt: string, systemInstruction?: string, useSearch = false) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = useSearch ? 'gemini-2.5-flash' : 'gemini-2.5-flash'; // 2.5 Flash for speed
  
  const config: any = {
    systemInstruction,
  };

  if (useSearch) {
    config.tools = [{ googleSearch: {} }];
  }

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config,
    });
    
    // Check for grounding chunks if search was used
    let groundingUrls: {url: string, title: string}[] = [];
    if (useSearch) {
        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (chunks) {
            chunks.forEach((chunk: any) => {
                if (chunk.web?.uri) {
                    groundingUrls.push({ url: chunk.web.uri, title: chunk.web.title || chunk.web.uri });
                }
            });
        }
    }

    return {
        text: response.text || "No response text.",
        groundingUrls
    };
  } catch (error) {
    console.error("Text gen error:", error);
    throw error;
  }
};

export const generateSpeech = async (text: string, voiceName: string = 'Kore') => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName },
                    },
                },
            },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) throw new Error("No audio generated");
        
        // Return base64 directly to be used in an audio element
        return `data:audio/mp3;base64,${base64Audio}`; 

    } catch (e) {
        console.error("TTS Error", e);
        throw e;
    }
}


export const generateVideo = async (prompt: string, aspectRatio: string = '16:9', imageInput?: string) => {
    // 1. Check API Key for Veo
    // Cast to any to avoid type conflict with existing global AIStudio definition
    const win = window as any;
    if (win.aistudio) {
        const hasKey = await win.aistudio.hasSelectedApiKey();
        if (!hasKey) {
            await win.aistudio.openSelectKey();
        }
    }

    // Create fresh instance to pick up potentially new key
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    try {
        const params: any = {
            model: 'veo-3.1-fast-generate-preview',
            prompt: prompt,
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: aspectRatio
            }
        };

        // If an image is provided (Image-to-Video)
        if (imageInput) {
            // Remove data:image/png;base64, prefix if present
            const base64Data = imageInput.split(',')[1] || imageInput;
            const mimeType = imageInput.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/)?.[1] || 'image/png';

            params.image = {
                imageBytes: base64Data,
                mimeType: mimeType
            };
        }

        let operation = await ai.models.generateVideos(params);

        // Polling
        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 5000)); // Poll every 5s
            operation = await ai.operations.getVideosOperation({operation});
        }

        const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!videoUri) throw new Error("Video generation failed or returned no URI");

        // Fetch the actual video bytes using the URI + API Key
        const videoRes = await fetch(`${videoUri}&key=${process.env.API_KEY}`);
        if (!videoRes.ok) throw new Error("Failed to download generated video");
        
        const blob = await videoRes.blob();
        return URL.createObjectURL(blob);

    } catch (error) {
        console.error("Veo Error:", error);
        throw error;
    }
}