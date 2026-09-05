import type { CSSProperties, DetailedHTMLProps, HTMLAttributes, Ref } from "react";

/**
 * JSX typings for the @google/model-viewer custom element.
 * @see https://modelviewer.dev/
 */
type ModelViewerJSX = DetailedHTMLProps<
  HTMLAttributes<HTMLElement>,
  HTMLElement
> & {
  src?: string;
  alt?: string;
  poster?: string;
  exposure?: string | number;
  "camera-controls"?: boolean | "";
  "auto-rotate"?: boolean | "";
  "touch-action"?: string;
  "shadow-intensity"?: string | number;
  "environment-image"?: string;
  ar?: boolean | "";
  style?: CSSProperties;
  className?: string;
  ref?: Ref<HTMLElement>;
};

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": ModelViewerJSX;
    }
  }
}

export {};
