declare var DEBUG: boolean;

declare interface HTMLElement
{
  mozRequestFullScreen(): void;
  webkitRequestFullscreen(): void;
  msRequestFullscreen(): void;
}

type Monetization = EventTarget & { state: 'stopped' | 'pending' | 'started'; };
declare interface Document
{
  monetization: Monetization;
}

declare module '*.txt' {
  let content: string;
  export default content;
}

declare module '*.webp' {
  let content: string;
  export default content;
}