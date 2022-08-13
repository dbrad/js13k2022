let fps_text_node: Text;
let ms_text_node: Text;
let ft_text_node: Text;
let update_text_node: Text;
let render_text_node: Text;

let frame_count: number = 0;
let fps: number = 60;
let next_update_time: number = 0;
let ms: number = 1000 / fps;
let update_time = 0;
let render_time = 0;

let average_frame_time = 0;
let average_update_time = 0;
let average_render_time = 0;

export function initialize_fps_meter(): void
{
  if (DEBUG)
  {
    let container: HTMLDivElement = document.createElement("div");
    container.style.position = "absolute";
    container.style.right = "0px";
    container.style.top = "0px";
    container.style.zIndex = "1000";

    document.body.prepend(container);

    let overlay: HTMLDivElement = document.createElement("div");
    overlay.style.position = "absolute";
    overlay.style.right = "0px";
    overlay.style.top = "0px";
    overlay.style.fontFamily = "Courier";
    overlay.style.fontSize = "13px";
    overlay.style.fontWeight = "bold";
    overlay.style.padding = "0.5em 1em";
    overlay.style.backgroundColor = "rgba(0, 0, 0, 0.2)";
    overlay.style.color = "white";
    overlay.style.textAlign = "right";
    overlay.style.width = "190px";
    overlay.style.userSelect = "none";
    container.appendChild(overlay);

    let fps_div: HTMLDivElement = document.createElement("div");
    overlay.appendChild(fps_div);

    let ms_div: HTMLDivElement = document.createElement("div");
    overlay.appendChild(ms_div);

    let frame_time_div: HTMLDivElement = document.createElement("div");
    overlay.appendChild(frame_time_div);

    let update_time_div: HTMLDivElement = document.createElement("div");
    overlay.appendChild(update_time_div);

    let render_time_div: HTMLDivElement = document.createElement("div");
    overlay.appendChild(render_time_div);

    fps_text_node = document.createTextNode("");
    fps_div.appendChild(fps_text_node);

    ms_text_node = document.createTextNode("");
    ms_div.appendChild(ms_text_node);

    ft_text_node = document.createTextNode("");
    frame_time_div.appendChild(ft_text_node);

    update_text_node = document.createTextNode("");
    update_time_div.appendChild(update_text_node);

    render_text_node = document.createTextNode("");
    render_time_div.appendChild(render_text_node);
  }
}

export function tick_fps_meter(frame_start_time: number, delta: number): void
{
  if (DEBUG)
  {
    performance.measure("frame", "start_of_frame");
    let frame_duration_time = performance.getEntriesByName("frame")[0].duration;

    ms = (0.9 * delta) + (0.1 * ms);
    average_frame_time = (0.9 * frame_duration_time) + (0.1 * average_frame_time);
    if (average_frame_time < 0) average_frame_time = 0;

    if (ms > 250)
    {
      fps = 0;
      ms = 0;
      average_frame_time = 0;
      average_update_time = 0;
      average_render_time = 0;
    }

    if (frame_start_time >= next_update_time)
    {
      performance.measure("update", "update_start", "update_end");
      performance.measure("render", "render_start", "render_end");

      let last_update_time = next_update_time - 1000;
      let current_fps = frame_count * 1000;
      let actual_duration = frame_start_time - last_update_time;
      fps = (0.9 * (current_fps / actual_duration)) + (0.1 * fps);

      update_time = performance.getEntriesByName("update")[0].duration;
      render_time = performance.getEntriesByName("render")[0].duration;

      average_update_time = (0.9 * update_time) + (0.1 * average_update_time);
      average_render_time = (0.9 * render_time) + (0.1 * average_render_time);

      fps_text_node.nodeValue = `FPS ${fps.toFixed((3)).padStart(7, " ")} HZ`;
      ms_text_node.nodeValue = `BROWSER FRAME ${ms.toFixed(3).padStart(7, " ")} MS`;
      ft_text_node.nodeValue = `REAL FRAME ${average_frame_time.toFixed(3).padStart(7, " ")} MS`;
      update_text_node.nodeValue = `UPDATE ${average_update_time.toFixed(3).padStart(7, " ")} MS`;
      render_text_node.nodeValue = `RENDER ${average_render_time.toFixed(3).padStart(7, " ")} MS`;

      next_update_time = frame_start_time + 1000;
      frame_count = 0;
      performance.clearMeasures();
    }
    performance.clearMeasures("frame");
    performance.clearMarks();

    frame_count++;
  }
}


export let performance_mark = (markName: string): void =>
{
  if (DEBUG)
    performance.mark(markName);
};