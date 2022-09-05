import { BLACK_T75 } from "@graphics/colour";
import { push_quad } from "@graphics/quad";
import { push_text, RIGHT_ALGIN_TEXT } from "@graphics/text";
import { A_PRESSED, B_PRESSED, controls_used, DOWN_PRESSED, UP_PRESSED } from "@input/controls";
import { animation_frame } from "@root/animation";
import { render_panel } from "@root/nodes/panel";
import { render_text_menu } from "@root/nodes/text-menu";
import { get_next_scene_id, pop_scene, Scene } from "@root/scene";
import { SCREEN_CENTER_X, SCREEN_CENTER_Y, SCREEN_HEIGHT, SCREEN_WIDTH } from "@root/screen";
import { zzfx } from "@root/zzfx";
export namespace Dialog
{
  let dialogQueue: string[] = [];
  let targetDialogText: string = "";
  let currentDialogText: string = "";
  let currentDialogTextIndex: number = 0;

  let choice_index = 0;
  let choice_handler: (() => void) | null = null;

  let dialogTimer: number = 0;
  let letterRate = 32;
  let talkSoundPlay: number = 0;

  export let _push_dialog_text = (text: string): void =>
  {
    dialogQueue.push(text);
  };

  export let _push_yes_no_dialog = (text: string, confirm_handler: () => void): void =>
  {
    _push_dialog_text(text);
    choice_handler = confirm_handler;
  };

  let set_dialog_text = (text: string) =>
  {
    if (targetDialogText.length === 0)
    {
      targetDialogText = text;
      currentDialogText = "";
      currentDialogTextIndex = 0;

      letterRate = 32;

      return true;
    }
    return false;
  };

  let _reset_fn = () =>
  {
    choice_index = 0;
    if (targetDialogText.length === 0)
      set_dialog_text(dialogQueue.shift() || "");
  };

  let _update_fn = (delta: number) =>
  {
    controls_used(A_BUTTON, B_BUTTON);
    if (targetDialogText.length === 0)
      set_dialog_text(dialogQueue.shift() || "");

    if (targetDialogText.length > 0)
    {
      if (currentDialogTextIndex >= targetDialogText.length)
      {
        if (choice_handler)
          controls_used(D_UP, D_DOWN, A_BUTTON, B_BUTTON);

        if (UP_PRESSED) choice_index = 0;
        else if (DOWN_PRESSED) choice_index = 1;
        else if (A_PRESSED)
        {
          if (choice_handler)
          {
            if (!choice_index)
              choice_handler();
          }
          choice_handler = null;
          targetDialogText = "";
        }
        else if (B_PRESSED)
          targetDialogText = "";
      }
      else
      {
        if (A_PRESSED)
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
    push_quad(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT, BLACK_T75);
    let box_w = SCREEN_WIDTH;
    let box_y = SCREEN_HEIGHT - 10;
    let box_h = 80;
    render_panel(0, box_y - box_h, box_w, box_h);
    push_text(currentDialogText, 5, box_y - (box_h - 5), { _scale: 2 });

    if (currentDialogTextIndex >= targetDialogText.length)
    {
      if (choice_handler)
      {
        render_panel(SCREEN_CENTER_X - 50, SCREEN_CENTER_Y, 100, 54);
        render_text_menu(SCREEN_CENTER_X, SCREEN_CENTER_Y + 5, ["yes", "no"], 2, choice_index);
      }
      else if (animation_frame)
        push_text("continue", SCREEN_WIDTH - 5, box_y - 13, RIGHT_ALGIN_TEXT);
    }
  };

  export let _scene_id = get_next_scene_id();
  export let _scene: Scene = { _scene_id, _reset_fn, _update_fn, _render_fn };
}