declare module 'animejs' {
  type AnimeParams = Record<string, unknown>;
  type AnimeInstance = {
    pause?: () => void;
    finished?: Promise<void>;
  };
  function anime(params: AnimeParams): AnimeInstance;
  namespace anime {
    function remove(targets: unknown): void;
  }
  export default anime;
}
