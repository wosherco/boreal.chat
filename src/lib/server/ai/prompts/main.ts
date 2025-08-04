import mainLiquidTemplate from "$lib/prompts/main.liquid?raw";
import { Liquid } from "liquidjs";

const engine = new Liquid();

const template = engine.parse(mainLiquidTemplate);

interface MainPromptParams {
  userAlias: string;
  model: string;
}

export function parseMainPrompt(params: MainPromptParams) {
  const currentTime = new Date().toLocaleString();

  return engine
    .render(
      template,
      {
        ...params,
        currentTime,
      },
      {},
    )
    .then(String);
}
