export function assert(predicate: (() => boolean) | boolean, message: string): asserts predicate
{
  if (DEBUG)
  {
    if (typeof predicate === "function" ? !predicate() : !predicate)
    {
      throw new Error(message);
    }
  }
}