import { assert } from "@debug/assert";
import { VERSION } from "@root/version";

export let SCREEN_WIDTH = 640;
export let SCREEN_HEIGHT = 360;

export let SCREEN_CENTER_X = SCREEN_WIDTH / 2;
export let SCREEN_CENTER_Y = SCREEN_HEIGHT / 2;

export let window_reference: Window = window;
export let document_reference: Document = document;
export let monetization_reference: Monetization = document.monetization;
export let canvas_reference: HTMLCanvasElement;

export let initialize_page = (): HTMLCanvasElement =>
{
  document_reference.title = `Forgotten Depths (${VERSION})`;
  let css = "margin:0;padding:0;background-color:#000;width:100vw;height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;";
  document_reference.documentElement.style.cssText = css;
  document_reference.body.style.cssText = css;

  let stage = document_reference.createElement("div");
  stage.style.cssText = `display:flex;flex-direction:column;align-items:center;justify-content:center;height:calc(100vw*(9/16));max-height:100vh;width:100vw;min-height:${SCREEN_HEIGHT}px`;
  document_reference.body.appendChild(stage);

  canvas_reference = document_reference.createElement("canvas");
  assert(canvas_reference !== null, "Unable to find canvas element on index.html");

  canvas_reference.style.cssText = "height:100%;image-rendering:optimizeSpeed;image-rendering:pixelated;";
  stage.appendChild(canvas_reference);

  canvas_reference.width = SCREEN_WIDTH;
  canvas_reference.height = SCREEN_HEIGHT;

  return canvas_reference;
};

export let request_fullscreen = (): void =>
{
  if (document_reference.fullscreenEnabled)
  {
    if (!document_reference.fullscreenElement)
    {
      let body = document_reference.querySelector("body");
      let fullscreen = canvas_reference.requestFullscreen || canvas_reference.mozRequestFullScreen || canvas_reference.webkitRequestFullscreen || canvas_reference.msRequestFullscreen;
      assert(fullscreen !== undefined, "Unable to find a requestFullscreen implementation.");
      fullscreen.call(body).then(() => window_reference.screen.orientation.lock("landscape-primary").catch(_ => _)).catch(_ => _);
    }
    else
    {
      document_reference.exitFullscreen();
    }
  }
};