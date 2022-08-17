let animation_timer = 0;
export let animation_frame = 0;
export let update_animation_frame = (delta: number) =>
{
  animation_timer += delta;
  if (animation_timer > 500)
  {
    if (animation_timer > 1000) animation_timer = 0;
    animation_timer -= 500;
    animation_frame = ++animation_frame % 2;
  }
};