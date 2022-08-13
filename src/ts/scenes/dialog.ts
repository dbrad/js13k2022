import { push_quad } from "@graphics/quad";
import { push_text } from "@graphics/text";
import { key_state } from "@input/controls";
import { get_next_scene_id, pop_scene, Scene } from "@root/scene";
import { SCREEN_HEIGHT, SCREEN_WIDTH } from "@root/screen";
import { zzfx } from "@root/zzfx";
export namespace Dialog
{
  let dialogQueue: string[] = [];
  let targetDialogText: string = "";
  let currentDialogText: string = "";
  let currentDialogTextIndex: number = 0;

  let dialogTimer: number = 0;
  let blinkTimer: number = 0;
  let showContinue: boolean = true;
  let letterRate = 32;
  let talkSoundPlay: number = 0;

  export let push_dialog_text = (text: string): void =>
  {
    dialogQueue.push(text);
  };

  let set_dialog_text = (text: string) =>
  {
    if (targetDialogText.length === 0)
    {
      targetDialogText = text;
      currentDialogText = "";
      currentDialogTextIndex = 0;

      blinkTimer = 0;
      showContinue = true;
      letterRate = 32;

      return true;
    }
    return false;
  };

  let _setup_fn = () => { };
  let _reset_fn = () => { };
  let _update_fn = (now: number, delta: number) =>
  {
    if (targetDialogText.length === 0)
      set_dialog_text(dialogQueue.shift() || "");

    if (targetDialogText.length > 0)
    {
      if (currentDialogTextIndex >= targetDialogText.length)
      {
        blinkTimer += delta;
        if (blinkTimer > 500)
        {
          if (blinkTimer > 1000)
            blinkTimer = 0;
          else
            blinkTimer -= 500;

          showContinue = !showContinue;
        }
        if (key_state.get(A_BUTTON) === KEY_WAS_DOWN)
          targetDialogText = "";
      }
      else
      {
        if (key_state.get(A_BUTTON) === KEY_WAS_DOWN)
          letterRate = 16;

        dialogTimer += delta;
        if (dialogTimer >= letterRate)
        {
          dialogTimer -= letterRate;
          currentDialogTextIndex++;
          talkSoundPlay = (talkSoundPlay + 1) % 5;
          if (talkSoundPlay === 0)
            zzfx(...[, 1, 110, .01, .05, .01, 1, 50, 1, , , , , , , , , .5]);
        }
        currentDialogText = targetDialogText.substring(0, currentDialogTextIndex);
      }
    }
    else
    {
      pop_scene();
    }
  };

  let _render_fn = () =>
  {
    let box_w = SCREEN_WIDTH;
    let box_h = 100;
    push_quad(0, SCREEN_HEIGHT - box_h, box_w, box_h, 0xFFFFFFFF);
    push_quad(2, SCREEN_HEIGHT - (box_h - 2), box_w - 4, box_h - 4, 0xFF000000);
    push_text(currentDialogText, 5, SCREEN_HEIGHT - (box_h - 5), { _width: box_w - 10, _scale: 2 });

    if (showContinue)
      push_text("touch the continue", SCREEN_WIDTH - 5, SCREEN_HEIGHT - 13, { _align: TEXT_ALIGN_RIGHT });

  };

  export let _scene_id = get_next_scene_id();
  export let _scene: Scene = { _scene_id, _setup_fn, _reset_fn, _update_fn, _render_fn };
}