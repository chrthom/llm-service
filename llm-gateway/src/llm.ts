import { Generate, ModelType } from "@llama-node/core";
import { LLM } from "llama-node";
import { LLMRS, LoadConfig } from "llama-node/dist/llm/llm-rs.js";
import path from "path";

export default class LLMModel {
  private modelPath: string;
  private llama = new LLM(LLMRS);
  private defaultModel = 'ggml-alpaca-7b-q4.bin';
  private config: Partial<Generate>;
  private terminatingLetters: number = 9;
  private ready = false;

  constructor(model?: string) {
    this.modelPath = path.resolve(process.cwd(), `models/${model ?? this.defaultModel}`);
    console.log(`Loading model from ${this.modelPath} ...`);
    this.llama.load({
      modelPath: this.modelPath,
      modelType: ModelType.Llama
    }).then(() => this.ready = true);
    this.config = {
      batchSize: 15,
      numThreads: 3,
      numPredict: 1000,
      temperature: 0.8,
      topP: 0.9,
      topK: 60,
      repeatPenalty: 1.3,
      repeatLastN: 64,
      seed: -1,
      feedPrompt: true
    };
  }
  async run(prompt: string) {
    if (!this.ready) return 'I am not ready to answer yet. Please try again later.\n';
    const params = { ...this.config };
    params.prompt = prompt;
    let response = '';
    await this.llama.createCompletion(params, (data) => {
      process.stdout.write(data.token);
      response += data.token;
    });
    response = response.slice(0, -this.terminatingLetters);
    response = response.replaceAll("\\n", '\n') + '\n';
    return response;
  }
}
