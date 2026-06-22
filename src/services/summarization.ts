import { CreateMLCEngine, InitProgressReport, MLCEngine } from "@mlc-ai/web-llm";
import { PROMPTS } from "../constants/prompts";
import { TranscriptSegment } from "../types";

export type SummaryLevel = 'short' | 'medium' | 'detailed';

export class SummarizationService {
  private engine: MLCEngine | null = null;
  private isLoaded: boolean = false;

  // The specific Qwen 2.5 1.5B model from MLC
  private modelId = "Qwen2.5-1.5B-Instruct-q4f16_1-MLC"; 

  public async initModel(onProgress?: (progress: InitProgressReport) => void): Promise<void> {
    if (this.isLoaded && this.engine) return;

    this.engine = await CreateMLCEngine(this.modelId, {
      initProgressCallback: onProgress,
    });
    
    this.isLoaded = true;
  }

  public async generateSummary(
    segments: TranscriptSegment[], 
    level: SummaryLevel, 
    onUpdate?: (text: string) => void
  ): Promise<string> {
    if (!this.engine || !this.isLoaded) {
      throw new Error("Model is not initialized. Call initModel() first.");
    }

    const transcriptText = segments
      .map(s => `[${new Date(s.timestamp.start).toISOString().substr(11, 8)}] ${s.speaker}: ${s.text}`)
      .join("\n");

    const promptTemplate = PROMPTS[level.toUpperCase() as keyof typeof PROMPTS];
    const prompt = promptTemplate.replace("{transcript}", transcriptText);

    let fullResponse = "";

    const chunks = await this.engine.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      stream: true,
    });

    for await (const chunk of chunks) {
      const content = chunk.choices[0]?.delta?.content || "";
      fullResponse += content;
      if (onUpdate) {
        onUpdate(fullResponse);
      }
    }

    return fullResponse;
  }
}
