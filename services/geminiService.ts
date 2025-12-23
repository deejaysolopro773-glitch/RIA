
import { GoogleGenAI, Modality, Type, GenerateContentResponse } from "@google/genai";

export class GeminiService {
  private static instance: GoogleGenAI;

  static getClient(): GoogleGenAI {
    // Creating a fresh client instance before calls to ensure latest API_KEY (especially for Veo)
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  static async editImage(
    base64Image: string,
    mimeType: string,
    prompt: string
  ): Promise<string | null> {
    const ai = this.getClient();
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return null;
  }

  static async generateVideo(
    imageBytes: string,
    mimeType: string,
    prompt: string,
    aspectRatio: '16:9' | '9:16'
  ): Promise<any> {
    const ai = this.getClient();
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      image: {
        imageBytes: imageBytes,
        mimeType: mimeType,
      },
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: aspectRatio
      }
    });

    return operation;
  }

  static async pollVideoOperation(operation: any): Promise<any> {
    const ai = this.getClient();
    return await ai.operations.getVideosOperation({ operation });
  }
}
