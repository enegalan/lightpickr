export type LightpickrPositionContext = {
  $anchor?: HTMLElement;
  $target: HTMLElement;
  $datepicker: HTMLElement;
  $pointer: HTMLElement;
  isViewChange: boolean;
  done: () => void;
};
